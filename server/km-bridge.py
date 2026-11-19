#!/usr/bin/env python3
"""知识地图的真终端机桥接服务。

网页通过 WebSocket 连进来，先登录，然后：
  box    确认这道题的容器在不在，不在就开一台（km-term 镜像）
  shell  在容器里开一个 zsh，网页打的字送进去，画面送回网页
  exec   在容器里跑一个命令，把输出回给网页（准备题目、判题用）
  reset  把这道题的容器整台删掉

用法：
  python3 km-bridge.py passwd     设置登录密码（第一次要先做）
  python3 km-bridge.py serve      启动服务（只听 127.0.0.1，靠 tailscale serve 对外）

只用 Python 内置模块和 websockets（sudo apt install python3-websockets）。
"""
import asyncio
import codecs
import fcntl
import getpass
import hashlib
import hmac
import json
import os
import re
import secrets
import signal
import struct
import sys
import termios
import time

import websockets

PORT = int(os.environ.get('KM_PORT', '7681'))
IMAGE = os.environ.get('KM_IMAGE', 'km-term')
CONFIG = os.path.expanduser(os.environ.get('KM_CONFIG', '~/.config/km-bridge/config.json'))
MAX_BOXES = 8            # 最多同时留几台容器，超过就删最久没用的
IDLE_HOURS = 24          # 多久没用就自动删掉
TOKEN_DAYS = 30          # 登录后记住几天
LOCK_AFTER = 5           # 连续输错几次就锁住
LOCK_MINUTES = 15
BOX_NAME = re.compile(r'^[a-z0-9][a-z0-9-]{0,39}$')
RUN_FLAGS = [
    '--network', 'none',           # 不能上网
    '--memory', '256m', '--memory-swap', '256m',
    '--cpus', '0.5',
    '--pids-limit', '200',
    '--hostname', 'labex',
    '--label', 'km=1',
]

used = {}        # 容器名称 → 最后使用时间
fails = []       # 输错密码的时间


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


# 设置文件：密码的哈希和签 token 用的密钥 --------------------------------------
def load_config():
    with open(CONFIG) as f:
        return json.load(f)


def hash_pw(pw, salt):
    return hashlib.pbkdf2_hmac('sha256', pw.encode(), bytes.fromhex(salt), 300_000).hex()


def set_password():
    pw = getpass.getpass('新密码（至少 10 个字）：')
    if len(pw) < 10:
        sys.exit('太短了，至少 10 个字。')
    if getpass.getpass('再输入一次：') != pw:
        sys.exit('两次不一样，没有保存。')
    salt = secrets.token_hex(16)
    cfg = {'salt': salt, 'hash': hash_pw(pw, salt), 'secret': secrets.token_hex(32)}
    os.makedirs(os.path.dirname(CONFIG), exist_ok=True)
    fd = os.open(CONFIG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        json.dump(cfg, f)
    print(f'已保存到 {CONFIG}（权限 600，只有你读得到）。以前登录过的设备都要重新登录。')


def make_token(cfg):
    exp = str(int(time.time()) + TOKEN_DAYS * 86400)
    sig = hmac.new(bytes.fromhex(cfg['secret']), exp.encode(), 'sha256').hexdigest()
    return f'{exp}.{sig}'


def check_token(cfg, token):
    try:
        exp, sig = str(token).split('.')
        good = hmac.new(bytes.fromhex(cfg['secret']), exp.encode(), 'sha256').hexdigest()
        return hmac.compare_digest(sig, good) and int(exp) > time.time()
    except ValueError:
        return False


def locked():
    now = time.time()
    fails[:] = [t for t in fails if now - t < LOCK_MINUTES * 60]
    return len(fails) >= LOCK_AFTER


# docker --------------------------------------------------------------------
async def docker(*args, stdin=None, timeout=20):
    p = await asyncio.create_subprocess_exec(
        'docker', *args,
        stdin=asyncio.subprocess.PIPE if stdin is not None else asyncio.subprocess.DEVNULL,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE)
    try:
        out, err = await asyncio.wait_for(p.communicate(stdin), timeout)
    except asyncio.TimeoutError:
        p.kill()
        await p.wait()
        return 124, b'', b'timeout'
    return p.returncode, out[:2_000_000], err[:200_000]


async def box_list():
    code, out, _ = await docker('ps', '-a', '--filter', 'label=km=1', '--format', '{{.Names}}')
    return out.decode().split() if code == 0 else []


async def ensure_box(name):
    """容器在就直接用，不在就开一台。回传 True 代表是新开的。"""
    used[name] = time.time()
    code, out, _ = await docker('inspect', '-f', '{{.State.Running}}', name)
    if code == 0:
        if out.strip() != b'true':
            await docker('start', name)
        return False
    names = await box_list()
    if len(names) >= MAX_BOXES:
        names.sort(key=lambda n: used.get(n, 0))
        for old in names[:len(names) - MAX_BOXES + 1]:
            log('容器太多，删掉最久没用的', old)
            await docker('rm', '-f', old)
            used.pop(old, None)
    code, _, err = await docker('run', '-d', '--name', name, *RUN_FLAGS, IMAGE, 'sleep', 'infinity')
    if code != 0:
        raise RuntimeError(err.decode(errors='replace').strip())
    log('开了新容器', name)
    return True


async def reaper():
    """定时清掉太久没用的容器。"""
    while True:
        await asyncio.sleep(600)
        for name in await box_list():
            if time.time() - used.setdefault(name, time.time()) > IDLE_HOURS * 3600:
                log('太久没用，删掉', name)
                await docker('rm', '-f', name)
                used.pop(name, None)


# 终端机：用一对 pty 接 docker exec -it ---------------------------------------
class Term:
    def __init__(self, send):
        self.send = send
        self.proc = None
        self.fd = None
        self.decoder = codecs.getincrementaldecoder('utf-8')(errors='replace')

    async def start(self, name, cwd, cols, rows):
        await self.stop()
        master, slave = os.openpty()
        self.fd = master
        self.resize(cols, rows)
        self.proc = await asyncio.create_subprocess_exec(
            'docker', 'exec', '-it', '-u', 'labex', '-w', cwd,
            '-e', 'TERM=xterm-256color', '-e', 'LANG=C.UTF-8', name, 'zsh',
            stdin=slave, stdout=slave, stderr=slave, start_new_session=True)
        os.close(slave)
        loop = asyncio.get_running_loop()
        loop.add_reader(master, self.on_read)
        asyncio.ensure_future(self.watch(self.proc))

    def on_read(self):
        try:
            data = os.read(self.fd, 65536)
        except OSError:
            data = b''
        if not data:
            asyncio.get_running_loop().remove_reader(self.fd)
            return
        text = self.decoder.decode(data)
        if text:
            asyncio.ensure_future(self.send({'t': 'out', 'd': text}))

    async def watch(self, proc):
        await proc.wait()
        if proc is self.proc:
            await asyncio.sleep(0.1)   # 让最后的输出先送出去
            self.close_fd()
            self.proc = None
            await self.send({'t': 'exit'})

    def write(self, text):
        if self.fd is not None:
            os.write(self.fd, text.encode())

    def resize(self, cols, rows):
        if self.fd is None:
            return
        cols = max(20, min(400, int(cols or 80)))
        rows = max(5, min(200, int(rows or 24)))
        fcntl.ioctl(self.fd, termios.TIOCSWINSZ, struct.pack('HHHH', rows, cols, 0, 0))
        if self.proc and self.proc.returncode is None:
            self.proc.send_signal(signal.SIGWINCH)   # 告诉 docker 窗口大小变了

    def close_fd(self):
        if self.fd is not None:
            try:
                asyncio.get_running_loop().remove_reader(self.fd)
            except Exception:
                pass
            os.close(self.fd)
            self.fd = None

    async def stop(self):
        proc, self.proc = self.proc, None
        if proc and proc.returncode is None:
            proc.kill()
            await proc.wait()
        self.close_fd()


# 一条 WebSocket 连接 ---------------------------------------------------------
async def handler(ws, *_):
    cfg = load_config()
    authed = False
    box = None
    lock = asyncio.Lock()

    async def send(msg):
        async with lock:
            try:
                await ws.send(json.dumps(msg, ensure_ascii=False))
            except websockets.ConnectionClosed:
                pass

    term = Term(send)
    try:
        async for raw in ws:
            if not isinstance(raw, str) or len(raw) > 1_000_000:
                continue
            try:
                m = json.loads(raw)
            except ValueError:
                continue
            t = m.get('t')

            # 登录 ------------------------------------------------------------
            if not authed:
                if t == 'auth' and check_token(cfg, m.get('token')):
                    authed = True
                    await send({'t': 'auth', 'ok': True})
                elif t == 'login':
                    if locked():
                        await send({'t': 'auth', 'ok': False, 'err': f'输错太多次，请 {LOCK_MINUTES} 分钟后再试。'})
                    elif hmac.compare_digest(hash_pw(str(m.get('password', '')), cfg['salt']), cfg['hash']):
                        fails.clear()
                        authed = True
                        await send({'t': 'auth', 'ok': True, 'token': make_token(cfg)})
                        log('登录成功', ws.remote_address)
                    else:
                        fails.append(time.time())
                        log('密码错误', ws.remote_address, f'{len(fails)}/{LOCK_AFTER}')
                        await asyncio.sleep(1)
                        await send({'t': 'auth', 'ok': False, 'err': '密码不对。'})
                else:
                    await send({'t': 'auth', 'ok': False, 'err': '要先登录。'})
                continue

            # 登录之后 --------------------------------------------------------
            if t == 'box':
                name = f"km-{m.get('box', '')}"
                if not BOX_NAME.match(name[3:]):
                    await send({'t': 'error', 'err': '题目名称不对。'})
                    continue
                await term.stop()
                box = name
                try:
                    fresh = await ensure_box(box)
                    await send({'t': 'box', 'fresh': fresh})
                except RuntimeError as e:
                    await send({'t': 'error', 'err': f'开不了容器：{e}'})
            elif not box:
                await send({'t': 'error', 'err': '要先选题目。'})
            elif t == 'shell':
                used[box] = time.time()
                await term.start(box, str(m.get('cwd') or '/home/labex/project'), m.get('cols'), m.get('rows'))
            elif t == 'in':
                term.write(str(m.get('d', '')))
            elif t == 'size':
                term.resize(m.get('cols'), m.get('rows'))
            elif t == 'exec':
                used[box] = time.time()
                argv = [str(x) for x in m.get('argv', [])]
                user = 'root' if m.get('user') == 'root' else 'labex'
                cwd = str(m.get('cwd') or '/home/labex/project')
                stdin = m.get('stdin')
                args = ['exec'] + (['-i'] if stdin is not None else []) + ['-u', user, '-w', cwd, '-e', 'LANG=C.UTF-8', box] + argv
                code, out, err = await docker(*args, stdin=None if stdin is None else str(stdin).encode(), timeout=20)
                await send({'t': 'exec', 'id': m.get('id'), 'code': code,
                            'out': out.decode(errors='replace'), 'err': err.decode(errors='replace')})
            elif t == 'reset':
                await term.stop()
                await docker('rm', '-f', box)
                used.pop(box, None)
                log('重置', box)
                await send({'t': 'reset'})
    finally:
        await term.stop()


async def serve():
    load_config()   # 还没设密码就直接报错
    async with websockets.serve(handler, '127.0.0.1', PORT, max_size=2 ** 20, ping_interval=20):
        log(f'桥接服务启动：ws://127.0.0.1:{PORT}，镜像 {IMAGE}')
        asyncio.ensure_future(reaper())
        await asyncio.Future()


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'passwd':
        set_password()
    elif cmd == 'serve':
        if not os.path.exists(CONFIG):
            sys.exit('还没设置密码：先运行 python3 km-bridge.py passwd')
        asyncio.run(serve())
    else:
        print(__doc__)
