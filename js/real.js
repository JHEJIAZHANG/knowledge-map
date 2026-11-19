// 真终端机：连到服务器上的桥接服务（server/km-bridge.py），在真的 Ubuntu 22.04 容器里作答
//
// 只有网站放在服务器上（km-bridge.py 送出来的，页面有 km-served 标记）时才有：直接连同一个网址的 /ws，
// 共用网站的 Google 登录。用 file:// 打开时只有模拟终端机。km-real-on 记住要不要用真终端机。
// 每次打开题目都开一台全新的容器（km-p-题目 id），关掉网页就删掉。开好后照模拟终端机算出来的起始状态把文件、用户建好；
// 判题时把容器里的文件、用户拍一张快照，变成模拟终端机的格式，再用同一套 judge 检查。
(function () {
  const KM = window.KnowledgeMap;
  const { h, memory } = KM.ui;
  const XTERM = 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0';
  const FIT = 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0';

  const served = typeof document !== 'undefined' && Boolean(document.querySelector('meta[name="km-served"]'));
  const wanted = () => served && memory.get('km-real-on', true);
  const setWanted = (on) => memory.set('km-real-on', on);

  // xterm.js：用到才加载 -----------------------------------------------------
  let loading = null;
  function loadXterm() {
    if (window.Terminal && window.FitAddon) return Promise.resolve();
    if (!loading) {
      const script = (src) => new Promise((ok, bad) => {
        document.head.append(h('script', { src, onload: ok, onerror: () => bad(new Error('xterm.js 加载失败（要能上网）')) }));
      });
      document.head.append(h('link', { rel: 'stylesheet', href: `${XTERM}/css/xterm.css` }));
      loading = script(`${XTERM}/lib/xterm.js`).then(() => script(`${FIT}/lib/addon-fit.js`));
      loading.catch(() => { loading = null; });
    }
    return loading;
  }

  // 一条连接 ----------------------------------------------------------------
  class Conn {
    constructor(url) {
      this.url = url;
      this.waiters = [];
      this.calls = new Map();
      this.seq = 0;
      this.onOut = () => {};
      this.onExit = () => {};
      this.onClose = () => {};
    }

    open() {
      return new Promise((ok, bad) => {
        let ws;
        try { ws = new WebSocket(this.url); } catch (e) { bad(new Error('网址的格式不对')); return; }
        this.ws = ws;
        const why = '连不上服务器';
        const timer = setTimeout(() => { ws.close(); bad(new Error(why)); }, 8000);
        ws.onopen = () => { clearTimeout(timer); ok(); };
        ws.onerror = () => { clearTimeout(timer); bad(new Error(why)); };
        ws.onclose = () => {
          this.closed = true;
          this.waiters.splice(0).forEach((w) => w.bad(new Error('连接中断了')));
          this.calls.forEach((c) => c.bad(new Error('连接中断了')));
          this.calls.clear();
          if (!this.quiet) this.onClose();
        };
        ws.onmessage = (e) => {
          let m;
          try { m = JSON.parse(e.data); } catch (err) { return; }
          if (m.t === 'out') { this.onOut(m.d); return; }
          if (m.t === 'exit') { this.onExit(); return; }
          if (m.t === 'exec') {
            const c = this.calls.get(m.id);
            if (c) { this.calls.delete(m.id); c.ok(m); }
            return;
          }
          const w = this.waiters.shift();
          if (!w) return;
          if (m.t === 'error') w.bad(new Error(m.err));
          else w.ok(m);
        };
      });
    }

    send(m) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m)); }

    // 送出一个请求，等下一个回复（box、auth、reset）
    ask(m) {
      return new Promise((ok, bad) => { this.waiters.push({ ok, bad }); this.send(m); });
    }

    exec(argv, o = {}) {
      const id = ++this.seq;
      return new Promise((ok, bad) => {
        this.calls.set(id, { ok, bad });
        this.send({ t: 'exec', id, argv, user: o.user || 'labex', cwd: o.cwd, stdin: o.stdin });
      });
    }

    close() { this.quiet = true; if (this.ws) this.ws.close(); }
  }

  // 连到同一个网址的 /ws，靠网站登录的 Cookie；登录过期就回登录页
  async function connect() {
    const conn = new Conn(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`);
    await conn.open();
    const r = await conn.ask({ t: 'auth' });
    if (r.ok) return conn;
    conn.close();
    location.replace(`/login${location.hash}`);
    throw new Error('登录过期了');
  }

  // 起始状态：照模拟终端机算出来的文件和用户，写成一段 bash 在容器里用 root 跑 -----------
  const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;
  const b64 = (text) => btoa(unescape(encodeURIComponent(text)));
  const write = (path, text) => `printf %s ${b64(text)} | base64 -d > ${q(path)}`;
  const parentOf = (p) => p.replace(/\/[^/]*$/, '') || '/';

  // Python 交互模式：每次显示 >>> 之前，把变量和打过的行存到 /tmp/.km-py.json，判题时读
  const PYSTART = `import sys
def _km_dump():
    try:
        import __main__, json, readline
        vs = {k: {'v': v, 't': type(v).__name__} for k, v in list(vars(__main__).items())
              if not k.startswith('_') and type(v) in (int, float, str, bool)}
        n = readline.get_current_history_length()
        typed = ['>>> ' + (readline.get_history_item(i) or '') for i in range(max(1, n - 499), n + 1)]
        with open('/tmp/.km-py.json', 'w') as f:
            json.dump({'vars': vs, 'typed': typed}, f)
    except Exception:
        pass
class _KmPrompt:
    def __str__(self):
        _km_dump()
        return '>>> '
sys.ps1 = _KmPrompt()
del sys
`;
  // 提示字符照 LabEx：labex:project/ $
  const ZSHRC = `umask 002
PROMPT='%n:%1~/ $ '
export PYTHONSTARTUP=/opt/km/pystart.py
`;

  const DMESG_SH = `#!/bin/sh
# 练习用：容器读不到真正的开机日志，改印题目准备好的日志
if [ "$(id -u)" != 0 ]; then echo 'dmesg: read kernel buffer failed: Operation not permitted' >&2; exit 1; fi
cat /opt/km/dmesg.log
`;

  function setupScript(p) {
    const s = p.setup || {};
    const sh = new KM.Shell(s);
    const L = ['set -e'];
    const users = (s.users || []).map((u) => (typeof u === 'string' ? { name: u } : u));
    const groups = new Set([...users.flatMap((u) => u.groups || []), ...(s.groups || [])]);
    groups.forEach((g) => L.push(`getent group ${q(g)} >/dev/null || groupadd ${q(g)}`));
    users.forEach((u) => L.push(`id -u ${q(u.name)} >/dev/null 2>&1 || useradd ${u.home !== false ? '-m ' : ''}${u.shell ? `-s ${q(u.shell)} ` : ''}${u.groups && u.groups.length ? `-G ${q(u.groups.join(','))} ` : ''}${q(u.name)}`));
    const homes = new Set(users.map((u) => `/home/${u.name}`));
    const abs = Object.keys(s.abs || {});
    const keep = (path) => path === sh.root || path.startsWith(`${sh.root}/`)
      || abs.some((k) => path === k || (k.startsWith(`${path}/`) && !homes.has(path) && !['/', '/home', '/home/labex'].includes(path)));
    Object.keys(sh.files).filter(keep).sort().forEach((path) => {
      const n = sh.files[path];
      if (n.dir) L.push(`mkdir -p ${q(path)}`);
      else { L.push(`mkdir -p ${q(parentOf(path))}`); L.push(write(path, n.content || '')); }
      L.push(`chown ${q(`${n.owner}:${n.group}`)} ${q(path)}`, `chmod ${KM.Shell.octal(n.mode)} ${q(path)}`);
    });
    L.push('mkdir -p /opt/km', write('/opt/km/pystart.py', PYSTART), 'chmod 644 /opt/km/pystart.py');
    // 不能上网的容器，/etc/hosts 里没有自己的名字，sudo 会抱怨 unable to resolve host
    L.push('grep -q "$(hostname)" /etc/hosts || echo "127.0.1.1 $(hostname)" >> /etc/hosts');
    // 容器读不到服务器真正的开机日志：dmesg 换成练习用的日志（和模拟终端机一样，只有 root 能看）
    L.push(write('/opt/km/dmesg.log', `${KM.Shell.DMESG}\n`), write('/usr/local/bin/dmesg', DMESG_SH), 'chmod 755 /usr/local/bin/dmesg');
    L.push(write('/home/labex/.zshrc', ZSHRC), 'chown labex:labex /home/labex/.zshrc');
    return `${L.join('\n')}\n`;
  }

  // 快照：容器里的文件、用户，变成模拟终端机的 files 格式 --------------------------
  const SNAP = `import os, sys, json, stat, pwd, grp, tarfile
files = {}
def who(f, i):
    try:
        return f(i)[0]
    except KeyError:
        return str(i)
def add(p):
    try:
        st = os.lstat(p)
    except OSError:
        return False
    d = stat.S_ISDIR(st.st_mode)
    n = {'dir': d, 'mode': stat.filemode(st.st_mode)[1:], 'owner': who(pwd.getpwuid, st.st_uid),
         'group': who(grp.getgrgid, st.st_gid), 'mtime': int(st.st_mtime * 1000), 'size': st.st_size}
    if stat.S_ISREG(st.st_mode):
        if p.endswith(('.tar', '.tar.gz', '.tgz')):
            try:
                with tarfile.open(p) as t:
                    n['archive'] = [{'name': m.name, 'dir': m.isdir()} for m in t.getmembers()]
                n['gz'] = p.endswith('gz')
            except Exception:
                pass
        if 'archive' not in n and st.st_size <= 65536:
            try:
                with open(p, 'rb') as f:
                    n['content'] = f.read().decode('utf-8', 'replace')
            except OSError:
                pass
    files[p] = n
    return d
def walk(p, depth):
    if len(files) > 4000:
        return
    if add(p) and depth > 0:
        try:
            kids = sorted(os.listdir(p))
        except OSError:
            return
        for k in kids:
            walk(os.path.join(p, k), depth - 1)
for r, depth in json.loads(sys.argv[1]):
    walk(r, depth)
py = None
try:
    with open('/tmp/.km-py.json') as f:
        py = json.load(f)
except Exception:
    pass
print(json.dumps({'files': files, 'py': py}))
`;

  async function snapshot(conn, p) {
    const s = p.setup || {};
    const view = new KM.Shell(s);
    const roots = [['/home', 3], [view.root, 12], ['/etc/passwd', 0], ['/etc/group', 0], ['/etc/shadow', 0],
      ...Object.keys(s.abs || {}).map((k) => [parentOf(k), 3])];
    const r = await conn.exec(['python3', '-c', SNAP, JSON.stringify(roots)], { user: 'root', cwd: '/' });
    if (r.code !== 0) throw new Error(`读不到容器里的文件：${r.err.trim()}`);
    const snap = JSON.parse(r.out);
    view.files = snap.files;
    view.cwd = view.root;
    view.pyVars = (snap.py && snap.py.vars) || {};
    view.typed = (snap.py && snap.py.typed) || [];
    view.pyOut = [];
    return view;
  }

  async function judge(conn, p) {
    const view = await snapshot(conn, p);
    const real = { same: {}, run: {} };
    for (const [i, c] of p.checks.entries()) {
      if (c.same && !(c.same in real.same)) real.same[c.same] = (await conn.exec(['bash', '-c', `{ ${c.same}\n} 2>&1`], { cwd: view.root })).out;
      if (c.run) real.run[i] = (await conn.exec(['bash', '-c', `{ ${c.run}\n} 2>&1`], { cwd: view.root, stdin: c.input ? `${c.input.join('\n')}\n` : '' })).out;
    }
    return { results: KM.Shell.judge(view, p.checks, real), view };
  }

  // 作答页用的一个真终端机 ----------------------------------------------------
  // hooks：onFiles(view) 文件变了、onState(文字, 'ok'|'busy'|'bad') 状态、onTyped() 打了命令
  async function session(p, hooks) {
    await loadXterm();
    const el = h('div', { class: 'sx-xterm' });
    const term = new window.Terminal({
      fontFamily: '"JetBrains Mono", ui-monospace, Menlo, monospace',
      fontSize: 14, lineHeight: 1.25, cursorBlink: true, scrollback: 3000, allowProposedApi: false,
      theme: { background: '#0c0d10', foreground: '#e8e9ec', cursor: '#ec4f84', cursorAccent: '#0c0d10', selectionBackground: '#3a3b42', black: '#17181d', brightBlack: '#6f737d', blue: '#6b9bff', brightBlue: '#8fb2ff', magenta: '#a99cff', green: '#5fd38d', red: '#ff7b7b', yellow: '#f5c26b' },
    });
    const fit = new window.FitAddon.FitAddon();
    term.loadAddon(fit);
    const box = KM.real.boxOf(p);
    const cwd = p.setup && p.setup.cwd ? KM.Shell.norm(new KM.Shell(p.setup).root, p.setup.cwd) : new KM.Shell(p.setup).root;
    let conn = null;
    let gone = false;   // 离开 Shell 或断线：按 Enter 重开
    let dead = false;   // 页面已经换掉了
    let view = null;
    let timer = 0;
    const dim = (t) => term.write(`\x1b[90m${t}\x1b[0m\r\n`);

    const refresh = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        if (!conn || conn.closed) return;
        try { view = await snapshot(conn, p); hooks.onFiles(view); } catch (e) { /* 下次再试 */ }
      }, 500);
    };

    async function start() {
      hooks.onState('连接中…', 'busy');
      conn = await connect();
      conn.onOut = (d) => term.write(d);
      conn.onExit = () => { gone = true; dim('\r\n[已经离开 Shell，按 Enter 重新打开]'); };
      conn.onClose = () => { if (dead) return; gone = true; hooks.onState('连接中断', 'bad'); dim('\r\n[连接中断了，按 Enter 重新连接]'); };
      const r = await conn.ask({ t: 'box', box });
      if (r.fresh) {
        hooks.onState('准备题目…', 'busy');
        const s = await conn.exec(['bash', '-s'], { user: 'root', cwd: '/', stdin: setupScript(p) });
        if (s.code !== 0) throw new Error(`准备题目失败：${(s.err || s.out).trim().split('\n').pop()}`);
      }
      gone = false;
      fit.fit();
      conn.send({ t: 'shell', cwd, cols: term.cols, rows: term.rows });
      hooks.onState('真终端机', 'ok');
      refresh();
    }

    term.onData((d) => {
      if (gone) {
        if (!d.includes('\r')) return;
        gone = false;
        if (conn && !conn.closed) { term.write('\r\n'); fit.fit(); conn.send({ t: 'shell', cwd, cols: term.cols, rows: term.rows }); return; }
        start().catch((e) => { gone = true; hooks.onState('连接失败', 'bad'); dim(`[${e.message}，按 Enter 再试]`); });
        return;
      }
      if (conn) conn.send({ t: 'in', d });
      if (d.includes('\r')) { hooks.onTyped(); refresh(); }
    });
    const ro = new ResizeObserver(() => {
      if (!el.isConnected || !el.offsetWidth) return;
      fit.fit();
      if (conn) conn.send({ t: 'size', cols: term.cols, rows: term.rows });
    });

    return {
      el,
      async open() {
        term.open(el);
        ro.observe(el);
        fit.fit();
        dim('# 这是真的 Ubuntu 22.04（服务器上的容器），命令照 LabEx 的环境跑。做完按「提交」检查。');
        dim('# 和 LabEx 一样：关掉或重新整理网页，这台容器就会删掉，下次打开是全新的。');
        if (JSON.stringify(p).includes('dmesg')) dim('# 补充：容器读不到服务器真正的开机日志，这里的 dmesg 印的是练习用的日志。');
        await start();
        term.focus();
      },
      focus() { term.focus(); },
      view: () => view,
      refresh,
      async judge() {
        const r = await judge(conn, p);
        view = r.view;
        hooks.onFiles(view);
        return r.results;
      },
      async reset() {
        hooks.onState('重置中…', 'busy');
        await conn.ask({ t: 'reset' });
        conn.close();
        term.reset();
        dim('# 已经把容器删掉，照题目一开始的样子重开一台。');
        await start();
        term.focus();
      },
      // 文件面板的编辑器：用 labex（或 root）的身分写回去，权限照真的系统
      async save(path, text, as) {
        const r = await conn.exec(['bash', '-c', 'cat > "$1"', '_', path], { user: as === 'root' ? 'root' : 'labex', cwd: '/', stdin: text.endsWith('\n') || text === '' ? text : `${text}\n` });
        refresh();
        return r.code === 0 ? null : (r.err.trim().split(': ').pop() || '保存失败');
      },
      destroy() {
        dead = true;
        clearTimeout(timer);
        ro.disconnect();
        if (conn) conn.close();
        term.dispose();
      },
    };
  }

  KM.real = { served, wanted, setWanted, session, setupScript, Conn, snapshot, judge, boxOf: (p) => `p-${p.id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`.slice(0, 38) };
})();
