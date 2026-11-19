#!/usr/bin/env python3
"""知识地图的网站服务器 + 真终端机桥接服务。

整个网站都要先用 Google 账号登录，而且只放行设置里写的邮箱。
没登录只看得到登录页；登录后才送出文章、练习场这些文件。
Authenticator（两步验证）由 Google 负责：在你的 Google 账号打开两步验证就好。

真终端机走同一个网址的 /ws（WebSocket），共用这次登录：
  box    确认这道题的容器在不在，不在就开一台（km-term 镜像）
  shell  在容器里开一个 zsh，网页打的字送进去，画面送回网页
  exec   在容器里跑一个命令，把输出回给网页（准备题目、判题用）
  reset  把这道题的容器整台删掉

用法：
  python3 km-bridge.py setup      设置 Google 登录（第一次要先做）
  python3 km-bridge.py serve      启动服务（只听 127.0.0.1，靠 tailscale funnel 对外）
  python3 km-bridge.py token      印出一个 30 天有效的 token，给检查工具用
  python3 km-bridge.py logout-all 让所有设备都要重新登录

用到 Python 内置模块和 aiohttp（sudo apt install python3-aiohttp）。
网站文件放在 ~/km-site（用 rsync 从 Mac 同步过来），登录页是同一个文件夹里的 login.html。
"""
import asyncio
import base64
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
from urllib.parse import quote, urlencode

from aiohttp import ClientSession, ClientTimeout, WSMsgType, web

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get('KM_PORT', '7681'))
IMAGE = os.environ.get('KM_IMAGE', 'km-term')
CONFIG = os.path.expanduser(os.environ.get('KM_CONFIG', '~/.config/km-bridge/config.json'))
SITE = os.path.realpath(os.path.expanduser(os.environ.get('KM_SITE', '~/km-site')))
LOGIN_PAGE = os.path.join(HERE, 'login.html')
GOOGLE_AUTH = os.environ.get('KM_GOOGLE_AUTH', 'https://accounts.google.com/o/oauth2/v2/auth')
GOOGLE_TOKEN = os.environ.get('KM_GOOGLE_TOKEN', 'https://oauth2.googleapis.com/token')
GOOGLE_ISSUERS = ('https://accounts.google.com', 'accounts.google.com')
COOKIE = 'km_session'
FLOW_COOKIE = 'km_oauth'
SECURE_COOKIE = os.environ.get('KM_INSECURE') != '1'   # 本机测试（http）才关掉
MAX_BOXES = 8            # 最多同时留几台容器，超过就删最久没用的
IDLE_HOURS = 24          # 多久没用就自动删掉
TOKEN_DAYS = 30          # 登录后记住几天
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


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


# 设置文件 --------------------------------------------------------------------
# { public_url, client_id, client_secret, allowed: [邮箱], secret: 签名用的密钥 }
def load_config():
    with open(CONFIG) as f:
        return json.load(f)


def save_config(cfg):
    os.makedirs(os.path.dirname(CONFIG), exist_ok=True)
    fd = os.open(CONFIG, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        json.dump(cfg, f, indent=2)


def setup():
    old = load_config() if os.path.exists(CONFIG) else {}

    def ask(q, k):
        keep = f'（直接按 Enter 保留 {old[k]}）' if old.get(k) else ''
        return input(f'{q}{keep}：').strip() or old.get(k, '')

    url = ask('网站网址，例如 https://instance-xxxx.tailxxxx.ts.net', 'public_url').rstrip('/')
    cid = ask('Google 的 Client ID', 'client_id')
    sec = getpass.getpass('Google 的 Client secret（输入时不会显示；直接按 Enter 保留原来的）：').strip() or old.get('client_secret', '')
    keep = f"（直接按 Enter 保留 {', '.join(old['allowed'])}）" if old.get('allowed') else ''
    mails = input(f'可以登录的 Gmail，多个用逗号隔开{keep}：').strip()
    allowed = [m.strip().lower() for m in mails.split(',') if m.strip()] or old.get('allowed', [])
    if not (url.startswith('https://') and cid and sec and allowed):
        sys.exit('有东西没填，或网址不是 https:// 开头，没有保存。')
    save_config({'public_url': url, 'client_id': cid, 'client_secret': sec, 'allowed': allowed,
                 'secret': old.get('secret') or secrets.token_hex(32)})
    print(f'已保存到 {CONFIG}（权限 600，只有你读得到）。')
    print(f'Google Cloud 里「已获授权的重定向 URI」要填：{url}/auth/callback')
    print('服务已经在跑的话，要重启：sudo systemctl restart km-bridge')


# 签名：登录状态和 Google 登录途中的暂存，都用服务器的密钥签名，别人改不了 -------------
def sign(cfg, data):
    body = base64.urlsafe_b64encode(json.dumps(data).encode()).decode().rstrip('=')
    sig = hmac.new(bytes.fromhex(cfg['secret']), body.encode(), 'sha256').hexdigest()
    return f'{body}.{sig}'


def unsign(cfg, value):
    try:
        body, sig = str(value or '').rsplit('.', 1)
        good = hmac.new(bytes.fromhex(cfg['secret']), body.encode(), 'sha256').hexdigest()
        if not hmac.compare_digest(sig, good):
            return None
        data = json.loads(base64.urlsafe_b64decode(body + '=' * (-len(body) % 4)))
        return data if data.get('exp', 0) > time.time() else None
    except (ValueError, TypeError, AttributeError):
        return None


def make_token(cfg, email):
    return sign(cfg, {'email': email, 'exp': int(time.time()) + TOKEN_DAYS * 86400})


def check_token(cfg, token):
    data = unsign(cfg, token)
    return bool(data and data.get('email') in cfg['allowed'])


def who_of(request):
    # 通过 tailscale funnel 进来的连接，真正的来源写在 X-Forwarded-For
    return request.headers.get('X-Forwarded-For') or request.remote



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
        asyncio.get_running_loop().add_reader(master, self.on_read)
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



# WebSocket：真终端机 ---------------------------------------------------------
def same_origin(request):
    origin = request.headers.get('Origin', '')
    return origin.split('://', 1)[-1] == request.host


async def ws_handler(request):
    cfg = request.app['cfg']
    ws = web.WebSocketResponse(heartbeat=20, max_msg_size=2 ** 20)
    await ws.prepare(request)
    # 从网站本身连进来：带着登录的 Cookie，而且来源是同一个网址（挡住别的网站借用你的登录）
    by_cookie = same_origin(request) and check_token(cfg, request.cookies.get(COOKIE))
    authed = False
    box = None
    lock = asyncio.Lock()

    async def send(msg):
        async with lock:
            if not ws.closed:
                try:
                    await ws.send_str(json.dumps(msg, ensure_ascii=False))
                except ConnectionError:
                    pass

    term = Term(send)
    try:
        async for msg in ws:
            if msg.type != WSMsgType.TEXT:
                continue
            try:
                m = json.loads(msg.data)
            except ValueError:
                continue
            t = m.get('t')

            # 登录：网站上用 Cookie；检查工具用 km-bridge.py token 印出来的 token
            if not authed:
                authed = t == 'auth' and (by_cookie or check_token(cfg, m.get('token')))
                await send({'t': 'auth', 'ok': authed, 'err': None if authed else '要先登录。'})
                continue

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
    return ws


# 用 Google 登录（OpenID Connect，授权码流程 + PKCE）---------------------------
def cookie_opts(max_age):
    return {'max_age': max_age, 'httponly': True, 'secure': SECURE_COOKIE, 'samesite': 'Lax', 'path': '/'}


def to_login(err=None):
    raise web.HTTPFound('/login' + (f'?err={quote(err)}' if err else ''))


async def google_start(request):
    """第 1 步：带着随机的 state、nonce 和 PKCE，转去 Google 的登录页。"""
    cfg = request.app['cfg']
    verifier = secrets.token_urlsafe(48)
    flow = {'state': secrets.token_urlsafe(24), 'nonce': secrets.token_urlsafe(24), 'verifier': verifier,
            'next': request.query.get('next', '')[:200], 'exp': int(time.time()) + 600}
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).decode().rstrip('=')
    query = urlencode({
        'client_id': cfg['client_id'], 'redirect_uri': f"{cfg['public_url']}/auth/callback",
        'response_type': 'code', 'scope': 'openid email', 'state': flow['state'], 'nonce': flow['nonce'],
        'code_challenge': challenge, 'code_challenge_method': 'S256', 'prompt': 'select_account',
    })
    res = web.HTTPFound(f'{GOOGLE_AUTH}?{query}')
    res.set_cookie(FLOW_COOKIE, sign(cfg, flow), **cookie_opts(600))
    raise res


async def google_callback(request):
    """第 2 步：Google 转回来，拿授权码去换 ID token，检查是不是你本人。"""
    cfg = request.app['cfg']
    flow = unsign(cfg, request.cookies.get(FLOW_COOKIE))
    q = request.query
    if 'error' in q:
        to_login('Google 登录取消了。')
    if not flow or not hmac.compare_digest(str(q.get('state', '')), flow['state']):
        to_login('登录过程过期或不完整，请再试一次。')
    try:
        async with ClientSession(timeout=ClientTimeout(total=15)) as http:
            async with http.post(GOOGLE_TOKEN, data={
                'code': q.get('code', ''), 'client_id': cfg['client_id'], 'client_secret': cfg['client_secret'],
                'redirect_uri': f"{cfg['public_url']}/auth/callback", 'grant_type': 'authorization_code',
                'code_verifier': flow['verifier'],
            }) as r:
                body = await r.json(content_type=None)
        # ID token 是直接从 Google 的 HTTPS 接口拿到的，所以照 OpenID Connect 规范，可以靠 TLS 确认来源，不另外验签名
        part = body['id_token'].split('.')[1]
        claims = json.loads(base64.urlsafe_b64decode(part + '=' * (-len(part) % 4)))
    except Exception as e:
        log('Google 登录失败', who_of(request), repr(e)[:200])
        to_login('跟 Google 换登录资料失败，请再试一次。')
    email = str(claims.get('email', '')).lower()
    ok = (claims.get('iss') in GOOGLE_ISSUERS and claims.get('aud') == cfg['client_id']
          and claims.get('exp', 0) > time.time() and claims.get('nonce') == flow['nonce']
          and claims.get('email_verified') is True and email in cfg['allowed'])
    if not ok:
        log('拒绝登录', who_of(request), email or '（没有邮箱）')
        to_login(f'{email or "这个账号"} 不能登录这个网站。')
    log('登录成功', who_of(request), email)
    res = web.HTTPFound('/' + (flow['next'] if flow['next'].startswith('#') else ''))
    res.set_cookie(COOKIE, make_token(cfg, email), **cookie_opts(TOKEN_DAYS * 86400))
    res.del_cookie(FLOW_COOKIE, path='/')
    raise res


# 网站：登录页、登出、网站文件 ------------------------------------------------
def authed(request):
    return check_token(request.app['cfg'], request.cookies.get(COOKIE))


async def login_page(request):
    if authed(request):
        raise web.HTTPFound('/')
    return web.FileResponse(LOGIN_PAGE, headers={'Cache-Control': 'no-store'})


async def api_logout(request):
    res = web.json_response({'ok': True})
    res.del_cookie(COOKIE, path='/')
    return res


async def site_file(request):
    if not authed(request):
        raise web.HTTPFound('/login')
    rel = request.match_info.get('path', '')
    path = os.path.realpath(os.path.join(SITE, rel))
    # 不能用 ../ 跑出网站文件夹；也不送隐藏文件（例如 .git）
    if path != SITE and not path.startswith(SITE + os.sep):
        raise web.HTTPNotFound()
    if any(part.startswith('.') for part in rel.split('/')):
        raise web.HTTPNotFound()
    if os.path.isdir(path):
        path = os.path.join(path, 'index.html')
    if not os.path.isfile(path):
        raise web.HTTPNotFound()
    if path.endswith('index.html'):
        # 告诉网页：这是服务器送出来的（真终端机直接用同一个网址和这次登录）
        with open(path, encoding='utf-8') as f:
            html = f.read().replace('<head>', '<head>\n  <meta name="km-served" content="1">', 1)
        return web.Response(text=html, content_type='text/html', headers={'Cache-Control': 'no-cache'})
    return web.FileResponse(path, headers={'Cache-Control': 'no-cache'})


@web.middleware
async def safety_headers(request, handler):
    try:
        res = await handler(request)
    except web.HTTPException as e:
        res = e
    res.headers.setdefault('X-Content-Type-Options', 'nosniff')
    res.headers.setdefault('X-Frame-Options', 'DENY')
    res.headers.setdefault('Referrer-Policy', 'same-origin')
    if isinstance(res, web.HTTPException):
        raise res
    return res


async def on_start(app):
    app['reaper'] = asyncio.ensure_future(reaper())


def make_app():
    app = web.Application(middlewares=[safety_headers], client_max_size=64 * 1024)
    app['cfg'] = load_config()
    app.router.add_get('/login', login_page)
    app.router.add_get('/auth/google', google_start)
    app.router.add_get('/auth/callback', google_callback)
    app.router.add_post('/api/logout', api_logout)
    app.router.add_get('/ws', ws_handler)
    app.router.add_get('/{path:.*}', site_file)
    app.on_startup.append(on_start)
    return app


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'setup':
        setup()
    elif cmd in ('serve', 'token', 'logout-all') and not os.path.exists(CONFIG):
        sys.exit('还没设置：先运行 python3 km-bridge.py setup')
    elif cmd == 'serve':
        cfg = load_config()
        log(f"服务启动：http://127.0.0.1:{PORT} → {cfg['public_url']}，网站文件 {SITE}，镜像 {IMAGE}")
        log(f"可以登录的邮箱：{', '.join(cfg['allowed'])}")
        web.run_app(make_app(), host='127.0.0.1', port=PORT, print=None, access_log=None)
    elif cmd == 'token':
        cfg = load_config()
        print(make_token(cfg, cfg['allowed'][0]))
    elif cmd == 'logout-all':
        cfg = load_config()
        cfg['secret'] = secrets.token_hex(32)
        save_config(cfg)
        print('已经换掉签名密钥，所有设备都要重新登录。重启服务后生效：sudo systemctl restart km-bridge')
    else:
        print(__doc__)
