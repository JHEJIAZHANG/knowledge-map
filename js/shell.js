// 练习场的模拟终端机：在浏览器里跑的小 Shell
//
// 只做学过的命令，够做练习题用，不是真的 Linux。
// 互动时照 zsh 的规矩（变量不切开、通配符找不到会报错），运行脚本时照 bash 的规矩。
// 状态全部在 this.files（路径 → 节点）里，判题直接看这里。
(function () {
  const KM = window.KnowledgeMap;
  const HOST = '6af99ac568b2e3ec9acca849';
  const UNAME = { s: 'Linux', n: HOST, r: '6.8.0-111-generic', v: '#111-Ubuntu SMP PREEMPT_DYNAMIC Sat Apr 11 23:16:02 UTC 2026', m: 'x86_64' };
  const PY_BANNER = 'Python 3.10.12 (main, Mar 22 2024, 16:50:05) [GCC 11.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.\n';
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const ERR = {
    ENOENT: 'No such file or directory', EACCES: 'Permission denied', EISDIR: 'Is a directory', ENOTDIR: 'Not a directory',
    EEXIST: 'File exists', ENOTEMPTY: 'Directory not empty', EPERM: 'Operation not permitted',
  };
  class FsError extends Error { constructor(code) { super(ERR[code]); this.code = code; } }
  const fail = (code) => { throw new FsError(code); };
  class NeedInput extends Error { constructor(q) { super('input'); this.q = q; } }

  // 路径 ----------------------------------------------------------------------
  const base = (p) => p.split('/').filter(Boolean).pop() || '/';
  const parentOf = (p) => p.split('/').slice(0, -1).join('/') || '/';
  const join = (a, b) => (a === '/' ? `/${b}` : `${a}/${b}`);
  const under = (x, p) => x === p || x.startsWith(p === '/' ? '/' : `${p}/`);
  const byName = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
  function norm(cwd, p) {
    const out = [];
    for (const s of (p.startsWith('/') ? p : `${cwd}/${p}`).split('/')) {
      if (!s || s === '.') continue;
      if (s === '..') out.pop(); else out.push(s);
    }
    return `/${out.join('/')}`;
  }

  // 权限 ----------------------------------------------------------------------
  const RWX = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  // 数字（764）或符号（+x、u+x、go-w、a=r）；看不懂就返回 null
  function modeOf(spec, old) {
    if (/^0?[0-7]{3}$/.test(spec)) return Array.from(spec.slice(-3)).map((d) => RWX[+d]).join('');
    const m = Array.from(old);
    for (const part of spec.split(',')) {
      const hit = part.match(/^([ugoa]*)([+\-=])([rwx]*)$/);
      if (!hit) return null;
      const [, who, op, perms] = hit;
      const groups = (!who || who.includes('a') ? 'ugo' : who).split('').map((c) => 'ugo'.indexOf(c));
      groups.forEach((g) => ['r', 'w', 'x'].forEach((p, i) => {
        const at = g * 3 + i;
        if (op === '=') m[at] = perms.includes(p) ? p : '-';
        else if (perms.includes(p)) m[at] = op === '+' ? p : '-';
      }));
    }
    return m.join('');
  }
  const octal = (mode) => [0, 3, 6].map((i) => (mode[i] !== '-' ? 4 : 0) + (mode[i + 1] !== '-' ? 2 : 0) + (mode[i + 2] !== '-' ? 1 : 0)).join('');

  // 时间 ----------------------------------------------------------------------
  const two = (n) => String(n).padStart(2, '0');
  const lsDate = (t) => { const d = new Date(t); return `${MON[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${two(d.getHours())}:${two(d.getMinutes())}`; };
  const isoDate = (t) => { const d = new Date(t); return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}`; };
  const today = () => Math.floor(Date.now() / 864e5);

  // 文件内容的行：最后的换行不算一行
  const linesOf = (t) => { const a = t.split('\n'); if (a[a.length - 1] === '') a.pop(); return a; };
  const hash = (s) => { let x = 5381; for (const c of s) x = ((x * 33) ^ c.charCodeAt(0)) >>> 0; return x.toString(36); };

  // 系统里原本就有的东西 ------------------------------------------------------
  const PASSWD = [
    'root:x:0:0:root:/root:/bin/bash',
    'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin',
    'bin:x:2:2:bin:/bin:/usr/sbin/nologin',
    'sys:x:3:3:sys:/dev:/usr/sbin/nologin',
    'nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin',
    'labex:x:5000:5000::/home/labex:/usr/bin/zsh',
  ];
  const GROUP = ['root:x:0:', 'daemon:x:1:', 'bin:x:2:', 'sys:x:3:', 'sudo:x:27:labex', 'shadow:x:42:', 'ssl-cert:x:121:labex', 'nogroup:x:65534:', 'labex:x:5000:', 'public:x:5002:labex'];
  const SHADOW = ['root:*:19901:0:99999:7:::', 'daemon:*:19901:0:99999:7:::', 'bin:*:19901:0:99999:7:::', 'sys:*:19901:0:99999:7:::', 'nobody:*:19901:0:99999:7:::', 'labex:$y$j9T$sandbox$sandbox:20771:0:99999:7:::'];
  const SKEL = {
    '.bash_logout': '# ~/.bash_logout: executed by bash(1) when login shell exits.\n',
    '.bashrc': '# ~/.bashrc: executed by bash(1) for non-login shells.\n',
    '.profile': '# ~/.profile: executed by the command interpreter for login shells.\n',
  };
  const DMESG = [
    '[    0.000000] Linux version 6.8.0-111-generic (buildd@lcy02-amd64-031) (x86_64-linux-gnu-gcc-12 (Ubuntu 12.3.0-1ubuntu1~22.04) 12.3.0)',
    '[    0.412233] ACPI: PM-Timer IO Port: 0x608',
    '[    1.201552] EXT4-fs (vda1): mounted filesystem with ordered data mode',
    '[    2.318004] systemd[1]: Failed to mount /mnt/backup.',
    '[    2.913420] ata2: SATA link down (SStatus 0 SControl 300)',
    '[    3.104112] e1000: eth0 NIC Link is Up 1000 Mbps Full Duplex',
    '[    4.552310] blk_update_request: I/O error, dev sdb, sector 2048',
    '[   12.008811] audit: type=1400 apparmor="STATUS" operation="profile_load"',
  ].join('\n');

  // 命令行切成记号 ------------------------------------------------------------
  // 字：parts = [{ t:'s', s, q }（文字，q 代表在引号里）| { t:'v', name, q }（变量）| { t:'~' }]
  function lex(src) {
    const toks = [];
    let word = null;
    const lit = (s, q) => { word = word || { parts: [] }; word.parts.push({ t: 's', s, q }); };
    const end = () => { if (word) { toks.push({ word }); word = null; } };
    const varAt = (i, q) => {
      if (src[i + 1] === '{') {
        const close = src.indexOf('}', i);
        if (close < 0) return null;
        return { part: { t: 'v', name: src.slice(i + 2, close), q }, next: close + 1 };
      }
      const m = src.slice(i + 1).match(/^([A-Za-z_]\w*|[?$#0-9@])/);
      if (!m) return null;
      return { part: { t: 'v', name: m[1], q }, next: i + 1 + m[1].length };
    };
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { end(); i += 1; continue; }
      if (c === '#' && !word) break;
      if (!word && c === '2' && src[i + 1] === '>') { end(); const two2 = src[i + 2] === '>'; toks.push({ op: two2 ? '2>>' : '2>' }); i += two2 ? 3 : 2; continue; }
      if (c === '>' || c === '<' || c === '|' || c === '&' || c === ';') {
        end();
        const pair = src.slice(i, i + 2);
        if (['>>', '||', '&&', '&>'].includes(pair)) { toks.push({ op: pair }); i += 2; } else { toks.push({ op: c }); i += 1; }
        continue;
      }
      if (c === "'") {
        const close = src.indexOf("'", i + 1);
        if (close < 0) return { error: "'" };
        lit(src.slice(i + 1, close), true);
        i = close + 1;
        continue;
      }
      if (c === '"') {
        word = word || { parts: [] };
        let j = i + 1;
        let buf = '';
        let closed = false;
        while (j < src.length) {
          const d = src[j];
          if (d === '"') { closed = true; break; }
          if (d === '\\' && '$`"\\'.includes(src[j + 1])) { buf += src[j + 1]; j += 2; continue; }
          if (d === '$') {
            const v = varAt(j, true);
            if (v) { if (buf) { word.parts.push({ t: 's', s: buf, q: true }); buf = ''; } word.parts.push(v.part); j = v.next; continue; }
          }
          buf += d;
          j += 1;
        }
        if (!closed) return { error: '"' };
        word.parts.push({ t: 's', s: buf, q: true });
        i = j + 1;
        continue;
      }
      if (c === '\\') { if (i + 1 < src.length) lit(src[i + 1], true); i += 2; continue; }
      if (c === '$') {
        const v = varAt(i, false);
        if (v) { word = word || { parts: [] }; word.parts.push(v.part); i = v.next; continue; }
      }
      if (c === '~' && !word && (i + 1 === src.length || /[\s/]/.test(src[i + 1]))) { word = { parts: [{ t: '~' }] }; i += 1; continue; }
      let j = i;
      while (j < src.length && !/[\s'"\\$<>|&;]/.test(src[j])) j += 1;
      if (j === i) j = i + 1;
      lit(src.slice(i, j), false);
      i = j;
    }
    end();
    return { toks };
  }

  // 记号 → [{ cmds: [{ words, redirs }], op }]：op 是和前一段的关系（; && ||）
  function parse(toks) {
    const list = [];
    let pipe = [];
    let cmd = { words: [], redirs: [] };
    let op = ';';
    let dangling = false;
    const close = () => {
      if (!cmd.words.length && !cmd.redirs.length) return false;
      pipe.push(cmd);
      cmd = { words: [], redirs: [] };
      return true;
    };
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t.word) { cmd.words.push(t.word); dangling = false; continue; }
      if (['>', '>>', '<', '2>', '2>>', '&>'].includes(t.op)) {
        const target = toks[i + 1];
        if (!target || !target.word) return { error: target ? target.op : 'newline' };
        cmd.redirs.push({ op: t.op, word: target.word });
        i += 1;
        continue;
      }
      if (t.op === '|') { if (!close()) return { error: '|' }; dangling = true; continue; }
      if (t.op === '&') return { error: '&' };
      if (!close()) { if (pipe.length || t.op !== ';') return { error: t.op }; continue; }
      list.push({ cmds: pipe, op });
      pipe = [];
      op = t.op;
    }
    if (dangling) return { error: 'newline' };
    if (close() || pipe.length) list.push({ cmds: pipe, op });
    else if (op === '&&' || op === '||') return { error: 'newline' };
    return { list };
  }

  // 选项：-la、-n 2、-n2、-2、--help 都看得懂
  function options(name, argv, flags, vals, num) {
    const on = new Set();
    const val = {};
    const args = [];
    let rest = false;
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i];
      if (rest || a === '-' || !a.startsWith('-')) { args.push(a); continue; }
      if (a === '--') { rest = true; continue; }
      if (a.startsWith('--')) return { help: a };
      for (let k = 1; k < a.length; k++) {
        const ch = a[k];
        if (num && /\d/.test(ch) && k === 1) { val.n = a.slice(1); break; }
        if (vals.includes(ch)) {
          const v = a.slice(k + 1) || argv[++i];
          if (v === undefined) return { bad: `${name}: option requires an argument -- '${ch}'\nTry '${name} --help' for more information.\n` };
          val[ch] = v;
          break;
        }
        if (!flags.includes(ch)) return { bad: `${name}: invalid option -- '${ch}'\nTry '${name} --help' for more information.\n` };
        on.add(ch);
      }
    }
    return { has: (c) => on.has(c), val, args };
  }

  // 两份文本的差异（diff 的一般格式）
  function diffText(a, b) {
    const A = linesOf(a);
    const B = linesOf(b);
    const n = A.length;
    const m = B.length;
    const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const out = [];
    const range = (s, e) => (e - s === 1 ? `${s + 1}` : `${s + 1},${e}`);
    let i = 0;
    let j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && A[i] === B[j]) { i += 1; j += 1; continue; }
      const i0 = i;
      const j0 = j;
      while ((i < n || j < m) && !(i < n && j < m && A[i] === B[j])) {
        if (j >= m || (i < n && L[i + 1][j] >= L[i][j + 1])) i += 1; else j += 1;
      }
      const del = A.slice(i0, i);
      const ins = B.slice(j0, j);
      if (del.length && ins.length) out.push(`${range(i0, i)}c${range(j0, j)}`);
      else if (del.length) out.push(`${range(i0, i)}d${j0}`);
      else out.push(`${i0}a${range(j0, j)}`);
      del.forEach((x) => out.push(`< ${x}`));
      if (del.length && ins.length) out.push('---');
      ins.forEach((x) => out.push(`> ${x}`));
    }
    return out.length ? `${out.join('\n')}\n` : '';
  }

  // grep 的样式 → JavaScript 正规表达式
  function grepRe(pat, o) {
    let src = '';
    if (o.has('F')) src = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    else if (o.has('E')) src = pat.replace(/\\</g, '\\b').replace(/\\>/g, '\\b');
    else {
      for (let i = 0; i < pat.length; i++) {
        const c = pat[i];
        if (c === '\\' && i + 1 < pat.length) {
          const d = pat[++i];
          src += '|(){}+?'.includes(d) ? d : d === '<' || d === '>' ? '\\b' : `\\${d}`;
        } else src += '|(){}+?'.includes(c) ? `\\${c}` : c;
      }
    }
    if (o.has('w')) src = `(?<![A-Za-z0-9_])(?:${src})(?![A-Za-z0-9_])`;
    if (o.has('x')) src = `^(?:${src})$`;
    return new RegExp(src, o.has('i') ? 'i' : '');
  }

  // Python 的错误要像真的一样显示
  function pyTrace(err, line, where) {
    const [kind] = err.split(':');
    if (kind === 'SyntaxError') return `  File "${where.file}", line ${where.line}\n    ${line.trim()}\n    ^\n${err}\n`;
    return `Traceback (most recent call last):\n  File "${where.file}", line ${where.line}, in <module>\n${where.file === '<stdin>' ? '' : `    ${line.trim()}\n`}${err}\n`;
  }
  // 去掉 Python 一行里 # 后面的注释（引号里的 # 不算）
  function stripPyComment(line) {
    let q = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === q) q = ''; } else if (c === '"' || c === "'") q = c; else if (c === '#') return line.slice(0, i);
    }
    return line;
  }

  const fileNode = (content, who) => ({ dir: false, content, mode: who === 'root' ? 'rw-r--r--' : 'rw-rw-r--', owner: who, group: who, mtime: Date.now() });
  const dirNode = (who) => ({ dir: true, mode: who === 'root' ? 'rwxr-xr-x' : 'rwxrwxr-x', owner: who, group: who, mtime: Date.now() });

  // ===========================================================================
  class Shell {
    constructor(setup) {
      this.setup = setup || {};
      this.reset();
    }

    reset() {
      const s = this.setup;
      this.root = s.root || '/home/labex/project';
      this.files = {};
      this.user = 'labex';
      this.sudo = false;
      this.stack = [];
      this.vars = {};
      this.status = 0;
      this.mode = 'zsh';
      this.script = null;
      this.py = null;
      this.pyVars = {};
      this.pyOut = [];
      this.typed = [];
      this.pending = null;
      this.oldpwd = null;
      this.born = Date.now();
      const sys = (p, n) => { this.files[p] = n; };
      sys('/', dirNode('root'));
      ['/etc', '/home', '/root', '/usr', '/usr/bin', '/var', '/var/log', '/mnt'].forEach((p) => sys(p, dirNode('root')));
      this.files['/root'].mode = 'rwx------';
      sys('/tmp', { ...dirNode('root'), mode: 'rwxrwxrwt' });
      sys('/etc/passwd', fileNode(`${PASSWD.join('\n')}\n`, 'root'));
      sys('/etc/group', fileNode(`${GROUP.join('\n')}\n`, 'root'));
      sys('/etc/shadow', { ...fileNode(`${SHADOW.join('\n')}\n`, 'root'), mode: 'rw-r-----', group: 'shadow' });
      sys('/etc/hostname', fileNode(`${HOST}\n`, 'root'));
      sys('/home/labex', { ...dirNode('labex'), mode: 'rwxr-x---' });
      this.cwd = '/home/labex';
      (s.users || []).forEach((u) => {
        const o = typeof u === 'string' ? { name: u } : u;
        (o.groups || []).forEach((g) => { if (!this.groupList().some((x) => x.name === g)) this.addGroup(g); });
        this.addUser(o.name, { home: o.home !== false, shell: o.shell, groups: o.groups });
      });
      (s.groups || []).forEach((g) => { if (!this.groupList().some((x) => x.name === g)) this.addGroup(g); });
      // 题目的文件：tree 放在 root 底下；abs 是其他地方的绝对路径
      const plant = (path, v, who) => {
        if (v && typeof v === 'object') {
          if (!this.files[path]) this.files[path] = dirNode(who);
          Object.entries(v).forEach(([k, x]) => plant(join(path, k), x, who));
        } else this.files[path] = fileNode(v, who);
      };
      const mkdirs = (p) => { let cur = ''; p.split('/').filter(Boolean).forEach((seg) => { cur += `/${seg}`; if (!this.files[cur]) this.files[cur] = dirNode('labex'); }); };
      mkdirs(this.root);
      plant(this.root, s.tree || {}, 'labex');
      Object.entries(s.abs || {}).forEach(([p, v]) => { mkdirs(parentOf(p)); plant(p, v, 'labex'); });
      // meta：{ '路径': 'rwx------ root root' }，路径可以是相对 root 的
      Object.entries(s.meta || {}).forEach(([rel, v]) => {
        const [mode, owner, group] = v.split(' ');
        const p = norm(this.root, rel);
        if (this.files[p]) this.files[p] = { ...this.files[p], mode, owner: owner || this.files[p].owner, group: group || owner || this.files[p].group };
      });
      this.cwd = s.cwd ? norm(this.root, s.cwd) : this.root;
    }

    // 存档与复制 ---------------------------------------------------------------
    save() {
      const keys = ['files', 'cwd', 'user', 'stack', 'vars', 'status', 'py', 'pyVars', 'pyOut', 'typed', 'oldpwd'];
      return JSON.parse(JSON.stringify(Object.fromEntries(keys.map((k) => [k, this[k]]))));
    }
    load(data) {
      Object.assign(this, JSON.parse(JSON.stringify(data)));
      this.pending = null;
      this.sudo = false;
      this.mode = 'zsh';
      this.script = null;
    }
    clone() {
      const sh = new Shell(this.setup);
      sh.load(this.save());
      sh.py = null;
      sh.stack = [];
      sh.user = 'labex';
      sh.cwd = this.root;
      return sh;
    }

    // 用户与用户组：直接读 /etc/passwd、/etc/group --------------------------------
    userList() {
      return linesOf(this.files['/etc/passwd'].content).map((line) => {
        const [name, , uid, gid, , home, shell] = line.split(':');
        return { name, uid: +uid, gid: +gid, home, shell };
      });
    }
    groupList() {
      return linesOf(this.files['/etc/group'].content).map((line) => {
        const [name, , gid, members] = line.split(':');
        return { name, gid: +gid, members: members ? members.split(',') : [] };
      });
    }
    userOf(name) { return this.userList().find((u) => u.name === name); }
    groupsOf(name) {
      const u = this.userOf(name);
      if (!u) return [];
      const gs = this.groupList();
      const primary = gs.find((g) => g.gid === u.gid);
      return [primary, ...gs.filter((g) => g !== primary && g.members.includes(name))].filter(Boolean);
    }
    writeTable(path, rows) { this.files[path] = { ...this.files[path], content: rows.length ? `${rows.join('\n')}\n` : '', mtime: Date.now() }; }
    editTable(path, fn) { this.writeTable(path, linesOf(this.files[path].content).map(fn).filter((x) => x != null)); }
    addGroup(name) {
      const used = new Set(this.groupList().map((g) => g.gid));
      let gid = 1000;
      while (used.has(gid) || gid === 5000 || gid === 5002) gid += 1;
      this.writeTable('/etc/group', [...linesOf(this.files['/etc/group'].content), `${name}:x:${gid}:`]);
      return gid;
    }
    addUser(name, o = {}) {
      const users = this.userList();
      const uid = Math.max(4999, ...users.filter((u) => u.uid >= 1000 && u.uid < 60000).map((u) => u.uid)) + 1;
      const usedG = new Set(this.groupList().map((g) => g.gid));
      let gid = uid;
      while (usedG.has(gid)) gid += 1;
      const home = o.homeDir || `/home/${name}`;
      this.writeTable('/etc/passwd', [...linesOf(this.files['/etc/passwd'].content), `${name}:x:${uid}:${gid}::${home}:${o.shell || '/bin/sh'}`]);
      this.writeTable('/etc/group', [...linesOf(this.files['/etc/group'].content), `${name}:x:${gid}:`]);
      this.writeTable('/etc/shadow', [...linesOf(this.files['/etc/shadow'].content), `${name}:!:${today()}:0:99999:7:::`]);
      (o.groups || []).forEach((g) => this.editTable('/etc/group', (l) => {
        const [gn, x, id, m] = l.split(':');
        return gn === g ? `${gn}:${x}:${id}:${m ? `${m},${name}` : name}` : l;
      }));
      if (o.home) {
        this.files[home] = { ...dirNode(name), mode: 'rwxr-x---' };
        Object.entries(SKEL).forEach(([f, t]) => { this.files[join(home, f)] = { ...fileNode(t, name), mode: 'rw-r--r--' }; });
      }
    }

    // 文件系统（会检查权限）-----------------------------------------------------
    get who() { return this.sudo ? 'root' : this.user; }
    get home() { const u = this.userOf(this.user); return u ? u.home : '/'; }
    abs(p) { return norm(this.cwd, p === '~' || p.startsWith('~/') ? this.home + p.slice(1) : p); }
    can(node, bit) {
      const who = this.who;
      if (who === 'root') return bit !== 'x' || node.dir || /[xst]/.test(node.mode);
      const cls = node.owner === who ? 0 : this.groupsOf(who).some((g) => g.name === node.group) ? 1 : 2;
      return node.mode[cls * 3 + 'rwx'.indexOf(bit)] !== '-';
    }
    // 走到这个路径：路上每一层都要是目录、而且有 x。最后一层不在就返回 null
    walk(p) {
      const segs = p.split('/').filter(Boolean);
      let cur = '/';
      for (let i = 0; i < segs.length; i++) {
        const n = this.files[cur];
        if (!n) fail('ENOENT');
        if (!n.dir) fail('ENOTDIR');
        if (!this.can(n, 'x')) fail('EACCES');
        cur = join(cur, segs[i]);
      }
      return this.files[cur] || null;
    }
    need(p) { const n = this.walk(p); if (!n) fail('ENOENT'); return n; }
    read(p) {
      const n = this.need(p);
      if (n.dir) fail('EISDIR');
      if (!this.can(n, 'r')) fail('EACCES');
      if (n.archive) return '\u001f\u008b\b\u0000（压缩包是二进制内容）\n';
      return n.content || '';
    }
    parentFor(p) {
      const par = this.walk(parentOf(p));
      if (!par) fail('ENOENT');
      if (!par.dir) fail('ENOTDIR');
      if (!this.can(par, 'w')) fail('EACCES');
      return par;
    }
    write(p, text, append) {
      const n = this.walk(p);
      if (n) {
        if (n.dir) fail('EISDIR');
        if (!this.can(n, 'w')) fail('EACCES');
        this.files[p] = { ...n, content: append ? (n.content || '') + text : text, archive: undefined, mtime: Date.now() };
        return;
      }
      this.parentFor(p);
      this.files[p] = this.newNode(false, text);
    }
    newNode(dir, content) {
      const who = this.who;
      const u = this.userOf(who);
      const g = this.groupList().find((x) => u && x.gid === u.gid);
      const n = dir ? dirNode(who) : fileNode(content, who);
      n.group = g ? g.name : who;
      return n;
    }
    kids(p) { return Object.keys(this.files).filter((x) => x !== p && parentOf(x) === p).sort((a, b) => byName(base(a), base(b))); }
    subtree(p) { return Object.keys(this.files).filter((x) => under(x, p)); }
    dirSize(p) { return 6 + this.kids(p).reduce((n, k) => n + base(k).length + 8, 0); }
    sizeOf(p) {
      const n = this.files[p];
      if (n.dir) return this.dirSize(p);
      if (n.archive) return n.gz ? 120 + Math.round(n.archive.reduce((s, m) => s + (m.content || '').length, 0) / 3) : 10240;
      return (n.content || '').length;
    }

    // 输入一行（终端机按 Enter）--------------------------------------------------
    // 返回 { out: [{ t, err, note }], clear, edit, prompt, secret }
    input(text) {
      this.out = [];
      this.flags = {};
      if (this.pending) {
        const fn = this.pending;
        this.pending = null;
        fn(text);
      } else if (this.py) {
        this.typed.push(`>>> ${text}`);
        this.pyLine(text);
      } else {
        if (text.trim()) this.typed.push(text);
        this.runLine(text);
      }
      return { out: this.out, ...this.flags, prompt: this.prompt(), secret: Boolean(this.pending && this.pending.secret) };
    }
    // 判题时直接跑一行，拿到印出来的文字
    capture(text) {
      const r = this.input(text);
      return r.out.map((c) => c.t).join('');
    }
    prompt() {
      if (this.pending) return '';
      if (this.py) return '>>> ';
      if (this.user !== 'labex') {
        const u = this.userOf(this.user);
        if (u && /bash$/.test(u.shell)) return `${this.user}@${HOST.slice(0, 12)}:${this.cwd === u.home ? '~' : this.cwd}$ `;
        return '$ ';
      }
      return `labex:${this.cwd === '/home/labex' ? '~' : base(this.cwd)}/ $ `;
    }
    ask(q, fn, secret) {
      this.say(q);
      this.pending = fn;
      this.pending.secret = Boolean(secret);
    }
    say(t) { if (t) this.out.push({ t }); }
    yell(t) { if (t) this.out.push({ t, err: true }); }
    note(t) { this.out.push({ t: `${t}\n`, note: true }); }
    // 错误前面的抬头：zsh 是「zsh: 」，脚本里是「脚本名: line N: 」
    shellErr(msg) { this.yell(this.script ? `${this.script.name}: line ${this.script.line}: ${msg}\n` : `zsh: ${msg}\n`); }

    runLine(src) {
      const lx = lex(src);
      if (lx.error) {
        if (this.script) this.yell(`${this.script.name}: line ${this.script.line}: unexpected EOF while looking for matching \`${lx.error}'\n`);
        else this.yell(`zsh: unmatched ${lx.error}\n`);
        this.status = 1;
        return;
      }
      const ps = parse(lx.toks);
      if (ps.error) {
        if (this.script) this.yell(`${this.script.name}: line ${this.script.line}: syntax error near unexpected token \`${ps.error}'\n`);
        else this.yell(`zsh: parse error near \`${ps.error === 'newline' ? '\\n' : ps.error}'\n`);
        this.status = 1;
        return;
      }
      for (const item of ps.list) {
        if (item.op === '&&' && this.status !== 0) continue;
        if (item.op === '||' && this.status === 0) continue;
        this.runPipe(item.cmds);
        if (this.pending || this.flags.edit) return;
      }
    }

    // 变量 --------------------------------------------------------------------
    getVar(name) {
      if (name === '?') return String(this.status);
      if (name === '$') return '4242';
      if (name === '#') return String(this.script ? this.script.args.length : 0);
      if (name === '@') return this.script ? this.script.args.join(' ') : '';
      if (/^\d$/.test(name)) return name === '0' ? (this.script ? this.script.name : 'zsh') : (this.script ? this.script.args[+name - 1] || '' : '');
      if (name in this.vars) return this.vars[name];
      const env = { HOME: this.home, USER: this.user, LOGNAME: this.user, PWD: this.cwd, SHELL: '/usr/bin/zsh', HOSTNAME: HOST, PATH: '/usr/local/bin:/usr/bin:/bin' };
      return env[name] || '';
    }

    // 展开一个字：变量、~、切分（只有 bash 会切）、通配符；返回字的数组，或 null（出错）
    expand(word, noGlob) {
      const split = this.mode === 'bash';
      const chars = [];
      let quoted = false;
      for (const p of word.parts) {
        if (p.t === 's') { if (p.q) quoted = true; for (const c of p.s) chars.push({ c, q: p.q }); }
        else if (p.t === '~') { quoted = true; for (const c of this.home) chars.push({ c, q: true }); }
        else {
          if (p.q) quoted = true;
          for (const c of this.getVar(p.name)) chars.push({ c, q: p.q || !split, sep: !p.q && split && /\s/.test(c) });
        }
      }
      const fields = [];
      let cur = [];
      const push = () => { if (cur.length || (quoted && !fields.length)) fields.push(cur); cur = []; };
      chars.forEach((ch) => { if (ch.sep) { if (cur.length) { fields.push(cur); cur = []; } } else cur.push(ch); });
      push();
      const out = [];
      for (const f of fields) {
        const text = f.map((x) => x.c).join('');
        const glob = !noGlob && f.some((x) => !x.q && /[*?]/.test(x.c));
        if (!glob) { out.push(text); continue; }
        const hits = this.glob(f);
        if (hits.length) out.push(...hits);
        else if (this.mode === 'zsh') { this.yell(`zsh: no matches found: ${text}\n`); return null; }
        else out.push(text);
      }
      return out;
    }
    glob(f) {
      const text = f.map((x) => x.c).join('');
      const cut = text.lastIndexOf('/');
      const dirPart = cut >= 0 ? text.slice(0, cut + 1) : '';
      const pat = f.slice(cut + 1);
      const re = new RegExp(`^${pat.map((x) => (!x.q && x.c === '*' ? '.*' : !x.q && x.c === '?' ? '.' : x.c.replace(/[.+^${}()|[\]\\*?]/g, '\\$&'))).join('')}$`);
      const dir = this.abs(dirPart || '.');
      const node = this.files[dir];
      if (!node || !node.dir) return [];
      const dot = pat[0] && pat[0].c === '.';
      return this.kids(dir).map(base).filter((n) => (dot || !n.startsWith('.')) && re.test(n)).map((n) => dirPart + n);
    }

    // 管道：前一段的输出交给下一段 -------------------------------------------------
    runPipe(cmds) {
      let stdin = '';
      cmds.forEach((cmd, i) => {
        const last = i === cmds.length - 1;
        const r = this.runCmd(cmd, stdin, last);
        stdin = r;
      });
    }

    runCmd(cmd, stdin, last) {
      // 变量赋值：NAME=值（等号两边不能有空格）
      const assigns = [];
      let words = cmd.words;
      while (words.length) {
        const first = words[0].parts[0];
        const m = first && first.t === 's' && !first.q && first.s.match(/^([A-Za-z_]\w*)=(.*)$/s);
        if (!m) break;
        assigns.push({ name: m[1], word: { parts: [{ t: 's', s: m[2], q: false }, ...words[0].parts.slice(1)] } });
        words = words.slice(1);
      }
      for (const a of assigns) {
        const v = this.expand(a.word, true);
        if (!v) { this.status = 1; return ''; }
        this.vars[a.name] = v.join(' ');
      }
      const argv = [];
      for (const w of words) {
        const e = this.expand(w);
        if (!e) { this.status = 1; return ''; }
        argv.push(...e);
      }
      // 导向：先由 Shell（目前的身分，不是 sudo）打开文件
      const io = { stdin, tty: last, buf: [], toFile: null };
      for (const r of cmd.redirs) {
        const t = this.expand(r.word, true);
        if (!t) { this.status = 1; return ''; }
        const p = this.abs(t[0]);
        try {
          if (r.op === '<') { io.stdin = this.read(p); continue; }
          const n = this.walk(p);
          if (n && n.dir) fail('EISDIR');
          if (r.op === '>' || r.op === '&>') { this.write(p, ''); io.toFile = { p, append: true }; io.tty = false; if (r.op === '&>') io.errFile = p; }
          else if (r.op === '>>') { this.write(p, '', true); io.toFile = { p, append: true }; io.tty = false; }
          else { this.write(p, '', r.op === '2>>'); io.errFile = p; }
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          const msg = { ENOENT: 'no such file or directory', EACCES: 'permission denied', EISDIR: 'is a directory', ENOTDIR: 'not a directory' }[e.code] || e.message;
          if (this.script) this.shellErr(`${t[0]}: ${e.message}`); else this.yell(`zsh: ${msg}: ${t[0]}\n`);
          this.status = 1;
          return '';
        }
      }
      if (!argv.length) { if (!assigns.length) this.status = 0; return ''; }
      if (!last) io.tty = false;
      const outBefore = this.out;
      const piped = !last || io.toFile;
      if (piped) this.out = [];
      const errs = [];
      const realYell = this.yell.bind(this);
      if (io.errFile) this.yell = (t) => { if (t) errs.push(t); };
      this.io = io;
      let code = 0;
      try {
        code = this.exec(argv, io);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        this.yell(`${argv[0]}: ${e.message}\n`);
        code = 1;
      }
      this.yell = realYell;
      this.status = code == null ? 0 : code;
      if (io.errFile) { try { this.write(io.errFile, errs.join(''), true); } catch (e) { /* 忽略 */ } }
      if (!piped) return '';
      const text = this.out.filter((c) => !c.err && !c.note).map((c) => c.t).join('');
      const keep = this.out.filter((c) => c.err || c.note);
      this.out = outBefore;
      this.out.push(...keep);
      if (io.toFile) {
        try { this.write(io.toFile.p, text, true); } catch (e) { this.yell(`zsh: permission denied: ${io.toFile.p}\n`); }
        return '';
      }
      return text;
    }

    // 运行一个命令：sudo、内置命令、脚本 ------------------------------------------
    exec(argv, io) {
      let [name, ...args] = argv;
      if (name === 'sudo') {
        if (!args.length) { this.yell('usage: sudo command\n'); return 1; }
        if (['-i', '-s', 'su', '-u'].includes(args[0]) && !(args[0] === 'su' && args[1])) { this.note('（练习场不支持切换成 root 的交互模式，请在每个命令前面加 sudo）'); return 1; }
        if (!this.groupsOf(this.user).some((g) => g.name === 'sudo') && this.user !== 'root') { this.yell(`${this.user} is not in the sudoers file.  This incident will be reported.\n`); return 1; }
        const was = this.sudo;
        this.sudo = true;
        try { return this.exec(args, io); } finally { this.sudo = was; }
      }
      if (name.includes('/')) return this.runFile(name, args);
      const fn = CMDS[name];
      if (!fn) {
        if (this.script) this.yell(`${this.script.name}: line ${this.script.line}: ${name}: command not found\n`);
        else this.yell(`zsh: command not found: ${name}\n`);
        return 127;
      }
      return fn.call(this, args, io, name);
    }

    // ./脚本、/路径/脚本 -------------------------------------------------------
    runFile(name, args) {
      const p = this.abs(name);
      let n;
      try { n = this.walk(p); } catch (e) { n = null; }
      const whyNot = !n ? 'no such file or directory' : n.dir || !this.can(n, 'x') || !this.can(n, 'r') ? 'permission denied' : '';
      if (whyNot) {
        if (this.script) this.shellErr(`${name}: ${whyNot === 'permission denied' ? 'Permission denied' : 'No such file or directory'}`);
        else this.yell(`zsh: ${whyNot}: ${name}\n`);
        return whyNot === 'permission denied' ? 126 : 127;
      }
      const text = n.content || '';
      if (/^#!.*python/.test(text) || /\.py$/.test(p)) return this.runPython(p, name);
      return this.runScript(p, name, args);
    }

    runScript(p, name, args) {
      let text;
      try { text = this.read(p); } catch (e) { this.yell(`bash: ${name}: ${e.message}\n`); return 127; }
      const saved = { vars: this.vars, cwd: this.cwd, mode: this.mode, script: this.script };
      this.vars = { ...(this.exported || {}) };
      this.mode = 'bash';
      const lines = text.split('\n');
      this.script = { name, line: 0, args };
      try {
        for (let i = 0; i < lines.length; i++) {
          this.script.line = i + 1;
          const line = lines[i];
          if (!line.trim() || line.trim().startsWith('#')) continue;
          if (/^\s*(if|for|while|until|case|function)\b/.test(line)) {
            this.note(`（练习场的 bash 只会一行一行运行命令，还不支持第 ${i + 1} 行的 ${line.trim().split(/\s/)[0]}）`);
            break;
          }
          this.runLine(line);
          if (this.flags.edit) { this.flags.edit = null; }
          if (this.pending) { this.pending = null; this.note('（练习场的脚本不能停下来等你输入）'); break; }
        }
      } finally {
        Object.assign(this, saved);
      }
      return this.status;
    }

    // Python ------------------------------------------------------------------
    // 一行 Python；input() 需要回答时先停下来问，回答之后从头再跑一次这一行
    pyRun(line, vars, answers, where, done) {
      let k = 0;
      const answer = (q) => { if (k < answers.length) return answers[k++]; throw new NeedInput(q); };
      try {
        const r = KM.py.exec(stripPyComment(line), vars, answer);
        if (r.kind === 'error') { this.yell(pyTrace(r.error, line, where)); done(vars, true); return; }
        r.printed.forEach((x) => { this.say(`${x}\n`); this.pyOut.push(x); });
        if (where.file === '<stdin>' && r.echo) this.say(`${r.echo}\n`);
        done(r.vars, false);
      } catch (e) {
        if (!(e instanceof NeedInput)) throw e;
        this.ask(e.q, (a) => { this.say(`${a}\n`); this.pyRun(line, vars, [...answers, a], where, done); });
      }
    }
    pyLine(text) {
      if (/^\s*(exit|quit)\(\)\s*$/.test(text)) { this.py = null; return; }
      if (/^\s*(exit|quit)\s*$/.test(text)) { this.say('Use exit() or Ctrl-D (i.e. EOF) to exit\n'); return; }
      if (!stripPyComment(text).trim()) return;
      this.pyRun(text, this.py.vars, [], { file: '<stdin>', line: 1 }, (vars) => { if (this.py) { this.py.vars = vars; this.pyVars = vars; } });
    }
    runPython(p, name) {
      let text;
      try { text = this.read(p); } catch (e) { this.yell(`python3: can't open file '${p}': [Errno ${e.code === 'ENOENT' ? 2 : 13}] ${e.message}\n`); return 2; }
      const lines = text.split('\n');
      // 一行跑完才接下一行；遇到 input() 会停下来等回答，回答后从这里接着跑
      const step = (i, vars) => {
        while (i < lines.length && (!stripPyComment(lines[i]).trim() || /^#!/.test(lines[i]))) i += 1;
        if (i >= lines.length) { this.status = 0; return; }
        this.pyRun(lines[i], vars, [], { file: name, line: i + 1 }, (v, err) => {
          if (err) { this.status = 1; return; }
          this.pyVars = v;
          step(i + 1, v);
        });
      };
      this.pyVars = {};
      step(0, {});
      return this.status;
    }
  }

  // 命令 ---------------------------------------------------------------------
  // 每个命令：function (args, io, name) { … return 退出码 }，this 是 Shell
  const fsErr = (sh, prefix, e) => { if (!(e instanceof FsError)) throw e; sh.yell(`${prefix}: ${e.message}\n`); };
  const helpNote = (sh, o) => { if (o.help) { sh.note(`（练习场没有 ${o.help} 说明，可以看网站的「命令速查」）`); return true; } if (o.bad) { sh.yell(o.bad); return true; } return false; };

  function lsRow(sh, p, shown, w) {
    const n = sh.files[p];
    const links = n.dir ? 2 + sh.kids(p).filter((k) => sh.files[k].dir).length : 1;
    const size = sh.sizeOf(p);
    return { cells: [`${n.dir ? 'd' : '-'}${n.mode}`, String(links), n.owner, n.group, w && w.h ? human(size, n.dir) : String(size), lsDate(n.mtime), shown] };
  }
  const human = (s) => (s < 1024 ? String(s) : s < 1048576 ? `${(s / 1024).toFixed(1)}K` : `${(s / 1048576).toFixed(1)}M`);
  function lsTable(rows) {
    const w = [1, 2, 3, 4].map((i) => Math.max(...rows.map((r) => r.cells[i].length)));
    return rows.map((r) => [r.cells[0], r.cells[1].padStart(w[0]), r.cells[2].padEnd(w[1]), r.cells[3].padEnd(w[2]), r.cells[4].padStart(w[3]), r.cells[5], r.cells[6]].join(' ')).join('\n');
  }

  const CMDS = {
    pwd() { this.say(`${this.cwd}\n`); return 0; },
    cd(args) {
      const arg = args[0];
      const target = !arg || arg === '~' ? this.home : arg === '-' ? this.oldpwd : this.abs(arg);
      const err = (why) => {
        if (this.script) this.shellErr(`cd: ${arg}: ${why}`);
        else this.yell(`cd: ${why.toLowerCase()}: ${arg}\n`);
        return 1;
      };
      if (!target) { this.yell('cd: OLDPWD not set\n'); return 1; }
      let n;
      try { n = this.walk(target); } catch (e) { return err(e.message); }
      if (!n) return err('No such file or directory');
      if (!n.dir) return err('Not a directory');
      if (!this.can(n, 'x')) return err('Permission denied');
      if (arg === '-') this.say(`${target}\n`);
      this.oldpwd = this.cwd;
      this.cwd = target;
      return 0;
    },
    echo(args) {
      let nl = true;
      let esc = this.mode === 'zsh';
      while (args.length && /^-[neE]+$/.test(args[0])) {
        if (args[0].includes('n')) nl = false;
        if (args[0].includes('e')) esc = true;
        if (args[0].includes('E')) esc = false;
        args = args.slice(1);
      }
      let text = args.join(' ');
      if (esc) text = text.replace(/\\([ntb\\])/g, (m, c) => ({ n: '\n', t: '\t', b: '\b', '\\': '\\' }[c]));
      this.say(text + (nl ? '\n' : ''));
      return 0;
    },
    ls(argv, io) {
      const o = options('ls', argv, 'alRdh1rAF', '', false);
      if (helpNote(this, o)) return 2;
      const all = o.has('a');
      const long = o.has('l');
      const list = o.args.length ? o.args : ['.'];
      let code = 0;
      const files = [];
      const dirs = [];
      list.forEach((a) => {
        const p = this.abs(a);
        try {
          const n = this.need(p);
          if (n.dir && !o.has('d')) dirs.push([a, p]); else files.push([a, p]);
        } catch (e) { this.yell(`ls: cannot access '${a}': ${e.message}\n`); code = 2; }
      });
      const names = (rows) => {
        if (long) return lsTable(rows.map(([shown, p]) => lsRow(this, p, shown, { h: o.has('h') })));
        const ns = rows.map(([shown]) => shown);
        return io.tty && !o.has('1') ? ns.join('  ') : ns.join('\n');
      };
      const blocks = [];
      if (files.length) blocks.push(`${names(files.sort((a, b) => byName(a[0], b[0])))}\n`);
      const showDir = (shown, p, header) => {
        const n = this.files[p];
        if (!this.can(n, 'r')) { this.yell(`ls: cannot open directory '${shown}': Permission denied\n`); code = 2; return; }
        let kids = this.kids(p).filter((k) => all || o.has('A') || !base(k).startsWith('.')).map((k) => [base(k), k]);
        if (all) kids = [['.', p], ['..', parentOf(p)], ...kids];
        if (o.has('r')) kids.reverse();
        let body = '';
        if (long) {
          const blocksUsed = kids.reduce((s, [, k]) => s + (this.files[k].dir ? 0 : Math.ceil(this.sizeOf(k) / 4096) * 4), 0);
          body = `total ${blocksUsed}\n${kids.length ? `${names(kids)}\n` : ''}`;
        } else if (kids.length) body = `${names(kids)}\n`;
        blocks.push((header ? `${shown}:\n` : '') + body);
        if (o.has('R')) {
          kids.filter(([nm, k]) => nm !== '.' && nm !== '..' && this.files[k].dir).forEach(([nm, k]) => showDir(shown === '/' ? `/${nm}` : `${shown}/${nm}`, k, true));
        }
      };
      const many = list.length > 1 || o.has('R');
      dirs.sort((a, b) => byName(a[0], b[0])).forEach(([shown, p]) => showDir(shown, p, many));
      this.say(blocks.join('\n'));
      return code;
    },
    cat(argv) {
      const o = options('cat', argv, 'nAE', '', false);
      if (helpNote(this, o)) return 1;
      let code = 0;
      let n = 0;
      const show = (t) => (o.has('n') ? t.split(/(?<=\n)/).map((l) => `${String(++n).padStart(6)}\t${l}`).join('') : t);
      if (!o.args.length) { this.say(show(this.io.stdin)); return 0; }
      o.args.forEach((a) => {
        if (a === '-') { this.say(show(this.io.stdin)); return; }
        try { this.say(show(this.read(this.abs(a)))); } catch (e) { fsErr(this, `cat: ${a}`, e); code = 1; }
      });
      return code;
    },
    head(argv, io, name) {
      const o = options(name, argv, 'qv', 'nc', true);
      if (helpNote(this, o)) return 1;
      const cnt = o.val.c != null ? +o.val.c : +(o.val.n != null ? o.val.n : 10);
      const byte = o.val.c != null;
      const tail = name === 'tail';
      const cut = (t) => {
        if (byte) return tail ? t.slice(Math.max(0, t.length - cnt)) : t.slice(0, cnt);
        const parts = t.split(/(?<=\n)/).filter((x) => x !== '');
        return (tail ? parts.slice(Math.max(0, parts.length - cnt)) : parts.slice(0, cnt)).join('');
      };
      if (Number.isNaN(cnt)) { this.yell(`${name}: invalid number of lines: '${o.val.n || o.val.c}'\n`); return 1; }
      if (!o.args.length) { this.say(cut(this.io.stdin)); return 0; }
      let code = 0;
      const many = o.args.length > 1;
      o.args.forEach((a, i) => {
        try {
          const t = this.read(this.abs(a));
          this.say((many ? `${i ? '\n' : ''}==> ${a} <==\n` : '') + cut(t));
        } catch (e) {
          if (!(e instanceof FsError)) throw e;
          this.yell(e.code === 'EISDIR' ? `${name}: error reading '${a}': Is a directory\n` : `${name}: cannot open '${a}' for reading: ${e.message}\n`);
          code = 1;
        }
      });
      return code;
    },
    wc(argv) {
      const o = options('wc', argv, 'lwc', '', false);
      if (helpNote(this, o)) return 1;
      const pick = ['l', 'w', 'c'].filter((c) => o.has(c));
      const cols = pick.length ? pick : ['l', 'w', 'c'];
      const count = (t) => ({ l: (t.match(/\n/g) || []).length, w: (t.match(/\S+/g) || []).length, c: t.length });
      const rows = [];
      let code = 0;
      if (!o.args.length) rows.push([count(this.io.stdin), '']);
      o.args.forEach((a) => { try { rows.push([count(this.read(this.abs(a))), a]); } catch (e) { fsErr(this, `wc: ${a}`, e); code = 1; } });
      if (rows.length > 1) rows.push([{ l: rows.reduce((s, r) => s + r[0].l, 0), w: rows.reduce((s, r) => s + r[0].w, 0), c: rows.reduce((s, r) => s + r[0].c, 0) }, 'total']);
      const w = rows.length === 1 && cols.length === 1 ? 0 : Math.max(...rows.flatMap((r) => cols.map((c) => String(r[0][c]).length)));
      rows.forEach(([n, a]) => this.say(`${[...cols.map((c) => String(n[c]).padStart(w)), a].filter((x) => x !== '').join(' ')}\n`));
      return code;
    },
    grep(argv) {
      const o = options('grep', argv, 'ivwnclEFrRxHhsoq', 'e', false);
      if (helpNote(this, o)) return 2;
      const args = [...o.args];
      const pat = o.val.e != null ? o.val.e : args.shift();
      if (pat == null) { this.yell("Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n"); return 2; }
      let re;
      try { re = grepRe(pat, o); } catch (e) { this.yell('grep: Invalid regular expression\n'); return 2; }
      const rec = o.has('r') || o.has('R');
      const targets = [];
      let code = 1;
      let trouble = false;
      if (!args.length) targets.push(['', this.io.stdin, rec ? '' : null]);
      args.forEach((a) => {
        const p = this.abs(a);
        try {
          const n = this.need(p);
          if (n.dir) {
            if (!rec) { this.yell(`grep: ${a}: Is a directory\n`); trouble = true; return; }
            this.subtree(p).filter((x) => !this.files[x].dir).sort().forEach((x) => {
              try { targets.push([a.replace(/\/$/, '') + x.slice(p.length), this.read(x)]); } catch (e) { fsErr(this, `grep: ${x}`, e); trouble = true; }
            });
          } else targets.push([a, this.read(p)]);
        } catch (e) { if (!o.has('s')) fsErr(this, `grep: ${a}`, e); trouble = true; }
      });
      const tag = (targets.length > 1 || rec || o.has('H')) && !o.has('h');
      targets.forEach(([nm, text]) => {
        const hits = [];
        linesOf(text).forEach((line, i) => { if (re.test(line) !== o.has('v')) hits.push([i + 1, line]); });
        if (hits.length) code = 0;
        if (o.has('q')) return;
        if (o.has('l')) { if (hits.length) this.say(`${nm || '(standard input)'}\n`); return; }
        if (o.has('c')) { this.say(`${tag ? `${nm}:` : ''}${hits.length}\n`); return; }
        hits.forEach(([n, line]) => {
          const shown = o.has('o') ? (line.match(new RegExp(re.source, `g${re.flags}`)) || []).join('\n') : line;
          this.say(`${tag ? `${nm}:` : ''}${o.has('n') ? `${n}:` : ''}${shown}\n`);
        });
      });
      return trouble && code ? 2 : code;
    },
    diff(argv) {
      const o = options('diff', argv, 'rqu', '', false);
      if (helpNote(this, o)) return 2;
      if (o.args.length !== 2) { this.yell(`diff: ${o.args.length < 2 ? 'missing operand after' : 'extra operand'} '${o.args[o.args.length - 1] || 'diff'}'\ndiff: Try 'diff --help' for more information.\n`); return 2; }
      const [a, b] = o.args;
      const pa = this.abs(a);
      const pb = this.abs(b);
      let na;
      let nb;
      try { na = this.need(pa); } catch (e) { fsErr(this, `diff: ${a}`, e); return 2; }
      try { nb = this.need(pb); } catch (e) { fsErr(this, `diff: ${b}`, e); return 2; }
      let code = 0;
      const sub = (dir, nm) => (dir.endsWith('/') ? dir + nm : `${dir}/${nm}`);
      const cmp = (sa, sb, x, y, top) => {
        const nx = this.files[x];
        const ny = this.files[y];
        if (!nx.dir && !ny.dir) {
          let ta;
          let tb;
          try { ta = this.read(x); tb = this.read(y); } catch (e) { fsErr(this, `diff: ${sa}`, e); code = 2; return; }
          const d = diffText(ta, tb);
          if (!d) return;
          code = Math.max(code, 1);
          if (o.has('q')) { this.say(`Files ${sa} and ${sb} differ\n`); return; }
          if (!top) this.say(`diff ${o.has('r') ? '-r ' : ''}${sa} ${sb}\n`);
          this.say(d);
          return;
        }
        if (nx.dir && ny.dir) {
          const ka = this.kids(x).map(base);
          const kb = this.kids(y).map(base);
          [...new Set([...ka, ...kb])].sort(byName).forEach((nm) => {
            if (!kb.includes(nm)) { this.say(`Only in ${sa}: ${nm}\n`); code = Math.max(code, 1); return; }
            if (!ka.includes(nm)) { this.say(`Only in ${sb}: ${nm}\n`); code = Math.max(code, 1); return; }
            const cx = join(x, nm);
            const cy = join(y, nm);
            if (this.files[cx].dir && this.files[cy].dir && !o.has('r')) { this.say(`Common subdirectories: ${sub(sa, nm)} and ${sub(sb, nm)}\n`); return; }
            cmp(sub(sa, nm), sub(sb, nm), cx, cy, false);
          });
          return;
        }
        this.say(`File ${nx.dir ? sa : sb} is a directory while file ${nx.dir ? sb : sa} is a regular file\n`);
        code = Math.max(code, 1);
      };
      if (na.dir !== nb.dir) {
        // diff 目录 文件：拿目录里同名的文件来比
        const [dirP, dirS, fileS] = na.dir ? [pa, a, b] : [pb, b, a];
        const inner = join(dirP, base(fileS));
        if (!this.files[inner]) { this.yell(`diff: ${sub(dirS, base(fileS))}: No such file or directory\n`); return 2; }
        return na.dir ? (cmp(sub(a, base(b)), b, inner, pb, true), code) : (cmp(a, sub(b, base(a)), pa, inner, true), code);
      }
      cmp(a, b, pa, pb, true);
      return code;
    },
    touch(argv) {
      const o = options('touch', argv, 'c', '', false);
      if (helpNote(this, o)) return 1;
      if (!o.args.length) { this.yell("touch: missing file operand\nTry 'touch --help' for more information.\n"); return 1; }
      let code = 0;
      o.args.forEach((a) => {
        const p = this.abs(a);
        try {
          const n = this.walk(p);
          if (n) { if (!n.dir && !this.can(n, 'w') && n.owner !== this.who) fail('EACCES'); this.files[p] = { ...n, mtime: Date.now() }; } else if (!o.has('c')) this.write(p, '');
        } catch (e) { fsErr(this, `touch: cannot touch '${a}'`, e); code = 1; }
      });
      return code;
    },
    mkdir(argv) {
      const o = options('mkdir', argv, 'pv', 'm', false);
      if (helpNote(this, o)) return 1;
      if (!o.args.length) { this.yell("mkdir: missing operand\nTry 'mkdir --help' for more information.\n"); return 1; }
      let code = 0;
      o.args.forEach((a) => {
        const p = this.abs(a);
        try {
          if (o.has('p')) {
            let cur = '';
            p.split('/').filter(Boolean).forEach((seg) => {
              cur += `/${seg}`;
              const n = this.walk(cur);
              if (n) { if (!n.dir) fail('EEXIST'); return; }
              this.parentFor(cur);
              this.files[cur] = this.newNode(true);
            });
            return;
          }
          if (this.walk(p)) fail('EEXIST');
          this.parentFor(p);
          this.files[p] = this.newNode(true);
          if (o.val.m) this.files[p].mode = modeOf(o.val.m, this.files[p].mode) || this.files[p].mode;
          if (o.has('v')) this.say(`mkdir: created directory '${a}'\n`);
        } catch (e) { fsErr(this, `mkdir: cannot create directory '${a}'`, e); code = 1; }
      });
      return code;
    },
    rmdir(argv) {
      const o = options('rmdir', argv, 'p', '', false);
      if (helpNote(this, o)) return 1;
      if (!o.args.length) { this.yell("rmdir: missing operand\nTry 'rmdir --help' for more information.\n"); return 1; }
      let code = 0;
      o.args.forEach((a) => {
        const p = this.abs(a);
        try {
          const n = this.need(p);
          if (!n.dir) fail('ENOTDIR');
          if (this.kids(p).length) fail('ENOTEMPTY');
          this.parentFor(p);
          delete this.files[p];
        } catch (e) { fsErr(this, `rmdir: failed to remove '${a}'`, e); code = 1; }
      });
      return code;
    },
    rm(argv) {
      const o = options('rm', argv, 'rRfivd', '', false);
      if (helpNote(this, o)) return 1;
      if (!o.args.length) { if (o.has('f')) return 0; this.yell("rm: missing operand\nTry 'rm --help' for more information.\n"); return 1; }
      const rec = o.has('r') || o.has('R');
      let code = 0;
      const todo = [];
      o.args.forEach((a) => {
        const p = this.abs(a);
        try {
          if (p === '/') { this.yell("rm: it is dangerous to operate recursively on '/'\nrm: use --no-preserve-root to override this failsafe\n"); code = 1; return; }
          const n = this.need(p);
          if (n.dir && !rec && !(o.has('d') && !this.kids(p).length)) fail('EISDIR');
          this.parentFor(p);
          todo.push([a, p, n]);
        } catch (e) {
          if (o.has('f') && e.code === 'ENOENT') return;
          fsErr(this, `rm: cannot remove '${a}'`, e); code = 1;
        }
      });
      const kill = ([a, p]) => { this.subtree(p).forEach((x) => delete this.files[x]); if (o.has('v')) this.say(`removed '${a}'\n`); };
      if (!o.has('i')) { todo.forEach(kill); return code; }
      // -i：一个一个问
      const next = (i) => {
        if (i >= todo.length) return;
        const [a, p, n] = todo[i];
        const what = n.dir ? 'directory' : n.content ? 'regular file' : 'regular empty file';
        this.ask(`rm: remove ${what} '${a}'? `, (ans) => { this.say(`${ans}\n`); if (/^y/i.test(ans.trim())) kill([a, p]); next(i + 1); });
      };
      next(0);
      return code;
    },
    cp(argv) { return copyMove.call(this, argv, 'cp'); },
    mv(argv) { return copyMove.call(this, argv, 'mv'); },
    chmod(argv) {
      // -x 这种写法也是模式，不是选项
      const modeAt = argv.findIndex((a) => !a.startsWith('-') || /^-[rwx]+$/.test(a));
      const flags = argv.filter((a, i) => i !== modeAt && a.startsWith('-'));
      const rest = argv.filter((a, i) => i !== modeAt && !a.startsWith('-'));
      const o = options('chmod', flags, 'Rv', '', false);
      if (helpNote(this, o)) return 1;
      const spec = argv[modeAt];
      if (!spec) { this.yell("chmod: missing operand\nTry 'chmod --help' for more information.\n"); return 1; }
      if (!rest.length) { this.yell(`chmod: missing operand after '${spec}'\nTry 'chmod --help' for more information.\n`); return 1; }
      if (!modeOf(spec, 'rw-rw-r--')) { this.yell(`chmod: invalid mode: '${spec}'\nTry 'chmod --help' for more information.\n`); return 1; }
      let code = 0;
      rest.forEach((a) => {
        const p = this.abs(a);
        try {
          this.need(p);
          (o.has('R') ? this.subtree(p) : [p]).forEach((x) => {
            const n = this.files[x];
            if (this.who !== 'root' && n.owner !== this.who) { this.yell(`chmod: changing permissions of '${x === p ? a : a + x.slice(p.length)}': Operation not permitted\n`); code = 1; return; }
            this.files[x] = { ...n, mode: modeOf(spec, n.mode) };
          });
        } catch (e) { fsErr(this, `chmod: cannot access '${a}'`, e); code = 1; }
      });
      return code;
    },
    chown(argv, io, name) {
      const o = options(name, argv, 'Rv', '', false);
      if (helpNote(this, o)) return 1;
      const [spec, ...rest] = o.args;
      if (!spec) { this.yell(`${name}: missing operand\nTry '${name} --help' for more information.\n`); return 1; }
      if (!rest.length) { this.yell(`${name}: missing operand after '${spec}'\nTry '${name} --help' for more information.\n`); return 1; }
      let owner = null;
      let group = null;
      if (name === 'chgrp') group = spec;
      else [owner, group] = spec.includes(':') ? spec.split(':') : [spec, null];
      if (owner && !this.userOf(owner)) { this.yell(`${name}: invalid user: '${spec}'\n`); return 1; }
      if (group === '' && owner) group = this.groupList().find((g) => g.gid === this.userOf(owner).gid).name;
      if (group && !this.groupList().some((g) => g.name === group)) { this.yell(name === 'chgrp' ? `chgrp: invalid group: '${spec}'\n` : `chown: invalid group: '${spec}'\n`); return 1; }
      let code = 0;
      rest.forEach((a) => {
        const p = this.abs(a);
        try {
          this.need(p);
          (o.has('R') ? this.subtree(p) : [p]).forEach((x) => {
            const n = this.files[x];
            const mine = n.owner === this.who && !owner && this.groupsOf(this.who).some((g) => g.name === group);
            if (this.who !== 'root' && !mine) { this.yell(`${name}: changing ${name === 'chgrp' ? 'group' : 'ownership'} of '${x === p ? a : a + x.slice(p.length)}': Operation not permitted\n`); code = 1; return; }
            this.files[x] = { ...n, owner: owner || n.owner, group: group || n.group };
          });
        } catch (e) { fsErr(this, `${name}: cannot access '${a}'`, e); code = 1; }
      });
      return code;
    },
    tree(argv) {
      const o = options('tree', argv, 'ad', '', false);
      if (helpNote(this, o)) return 1;
      const list = o.args.length ? o.args : ['.'];
      let dirs = 0;
      let files = 0;
      const lines = [];
      const walk = (p, pre) => {
        const kids = this.kids(p).filter((k) => o.has('a') || !base(k).startsWith('.')).filter((k) => !o.has('d') || this.files[k].dir);
        kids.forEach((k, i) => {
          const lastOne = i === kids.length - 1;
          lines.push(`${pre}${lastOne ? '`-- ' : '|-- '}${base(k)}`);
          if (this.files[k].dir) { dirs += 1; if (this.can(this.files[k], 'r')) walk(k, pre + (lastOne ? '    ' : '|   ')); } else files += 1;
        });
      };
      list.forEach((a) => {
        const p = this.abs(a);
        const n = this.files[p];
        if (!n || !n.dir) { lines.push(`${a}  [error opening dir]`); return; }
        lines.push(a);
        walk(p, '');
      });
      const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
      this.say(`${lines.join('\n')}\n\n${plural(dirs, 'directory', 'directories')}${o.has('d') ? '' : `, ${plural(files, 'file', 'files')}`}\n`);
      return 0;
    },
    tar(argv) {
      let list = [...argv];
      if (list[0] && !list[0].startsWith('-') && /^[ctxzvfC]+$/.test(list[0])) list[0] = `-${list[0]}`;
      const o = options('tar', list, 'ctxzvj', 'fC', false);
      if (helpNote(this, o)) return 2;
      const modes = ['c', 't', 'x'].filter((c) => o.has(c));
      if (modes.length !== 1) { this.yell("tar: You must specify one of the '-Acdtrux', '--delete' or '--test-label' options\nTry 'tar --help' or 'tar --usage' for more information.\n"); return 2; }
      if (o.val.f == null) { this.yell('tar: Refusing to read archive contents from terminal (missing -f option?)\ntar: Error is not recoverable: exiting now\n'); return 2; }
      const box = this.abs(o.val.f);
      if (o.has('c')) {
        if (!o.args.length) { this.yell("tar: Cowardly refusing to create an empty archive\nTry 'tar --help' or 'tar --usage' for more information.\n"); return 2; }
        const members = [];
        let bad = false;
        o.args.forEach((a) => {
          const p = this.abs(a);
          const n = this.files[p];
          if (!n) { this.yell(`tar: ${a}: Cannot stat: No such file or directory\n`); bad = true; return; }
          const rel = (x) => a.replace(/^\/+/, '').replace(/\/$/, '') + x.slice(p.length);
          this.subtree(p).sort().forEach((x) => {
            const m = this.files[x];
            members.push({ name: rel(x) + (m.dir ? '/' : ''), dir: m.dir, content: m.dir ? null : m.content, mode: m.mode, owner: m.owner, group: m.group, mtime: m.mtime });
            if (o.has('v')) this.say(`${rel(x)}${m.dir ? '/' : ''}\n`);
          });
          if (a.startsWith('/')) this.yell("tar: Removing leading `/' from member names\n");
        });
        try { this.write(box, ''); } catch (e) { fsErr(this, `tar: ${o.val.f}`, e); return 2; }
        this.files[box] = { ...this.files[box], content: null, archive: members, gz: o.has('z') };
        if (bad) { this.yell('tar: Exiting with failure status due to previous errors\n'); return 2; }
        return 0;
      }
      let n;
      try { n = this.need(box); this.read(box); } catch (e) { this.yell(`tar: ${o.val.f}: Cannot open: ${e.message}\ntar: Error is not recoverable: exiting now\n`); return 2; }
      if (!n.archive) { this.yell('tar: This does not look like a tar archive\ntar: Exiting with failure status due to previous errors\n'); return 2; }
      if (o.has('t')) {
        n.archive.forEach((m) => this.say(o.has('v') ? `${m.dir ? 'd' : '-'}${m.mode} ${m.owner}/${m.group} ${String(m.dir ? 0 : (m.content || '').length).padStart(5)} ${isoDate(m.mtime)} ${m.name}\n` : `${m.name}\n`));
        return 0;
      }
      const into = o.val.C ? this.abs(o.val.C) : this.cwd;
      n.archive.forEach((m) => {
        const p = norm(into, m.name);
        try {
          if (m.dir) { if (!this.files[p]) { this.parentFor(p); this.files[p] = this.newNode(true); } } else this.write(p, m.content || '');
          this.files[p] = { ...this.files[p], mode: m.mode };
          if (o.has('v')) this.say(`${m.name}\n`);
        } catch (e) { fsErr(this, `tar: ${m.name}`, e); }
      });
      return 0;
    },
    whoami() { this.say(`${this.who}\n`); return 0; },
    id(argv) {
      const o = options('id', argv, 'ugGnr', '', false);
      if (helpNote(this, o)) return 1;
      const name = o.args[0] || this.who;
      const u = this.userOf(name);
      if (!u) { this.yell(`id: '${name}': no such user\n`); return 1; }
      const gs = this.groupsOf(name);
      const nm = o.has('n');
      if (o.has('u')) this.say(`${nm ? u.name : u.uid}\n`);
      else if (o.has('g')) this.say(`${nm ? gs[0].name : gs[0].gid}\n`);
      else if (o.has('G')) this.say(`${gs.map((g) => (nm ? g.name : g.gid)).join(' ')}\n`);
      else this.say(`uid=${u.uid}(${u.name}) gid=${gs[0].gid}(${gs[0].name}) groups=${gs.map((g) => `${g.gid}(${g.name})`).join(',')}\n`);
      return 0;
    },
    groups(args) {
      if (!args.length) { this.say(`${this.groupsOf(this.who).map((g) => g.name).join(' ')}\n`); return 0; }
      let code = 0;
      args.forEach((a) => {
        if (!this.userOf(a)) { this.yell(`groups: '${a}': no such user\n`); code = 1; return; }
        this.say(`${a} : ${this.groupsOf(a).map((g) => g.name).join(' ')}\n`);
      });
      return code;
    },
    hostname() { this.say(`${HOST}\n`); return 0; },
    uname(argv) {
      const o = options('uname', argv, 'asnrvmpio', '', false);
      if (helpNote(this, o)) return 1;
      if (o.has('a')) { this.say(`${UNAME.s} ${UNAME.n} ${UNAME.r} ${UNAME.v} ${UNAME.m} ${UNAME.m} ${UNAME.m} GNU/Linux\n`); return 0; }
      const keys = ['s', 'n', 'r', 'v', 'm'].filter((k) => o.has(k));
      const extra = { p: UNAME.m, i: UNAME.m, o: 'GNU/Linux' };
      const parts = [...(keys.length || ['p', 'i', 'o'].some((k) => o.has(k)) ? keys : ['s']).map((k) => UNAME[k]), ...['p', 'i', 'o'].filter((k) => o.has(k)).map((k) => extra[k])];
      this.say(`${parts.join(' ')}\n`);
      return 0;
    },
    uptime() {
      const now = new Date();
      const mins = 6 * 60 + 39 + Math.floor((Date.now() - this.born) / 6e4);
      this.say(` ${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())} up 186 days, ${String(Math.floor(mins / 60) % 24).padStart(2)}:${two(mins % 60)},  0 users,  load average: 0.19, 0.29, 0.22\n`);
      return 0;
    },
    date() {
      const d = new Date();
      const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
      this.say(`${day} ${MON[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2)} ${two(d.getUTCHours())}:${two(d.getUTCMinutes())}:${two(d.getUTCSeconds())} UTC ${d.getUTCFullYear()}\n`);
      return 0;
    },
    dmesg() {
      if (this.who !== 'root') { this.yell('dmesg: read kernel buffer failed: Operation not permitted\n'); return 1; }
      this.say(`${DMESG}\n`);
      return 0;
    },
    clear() { this.flags.clear = true; return 0; },
    history() { this.typed.filter((t) => !t.startsWith('>>> ')).forEach((t, i) => this.say(`${String(i + 1).padStart(5)}  ${t}\n`)); return 0; },
    export(args) {
      args.forEach((a) => { const [k, ...v] = a.split('='); if (v.length) this.vars[k] = v.join('='); this.exported = { ...(this.exported || {}), [k]: this.vars[k] || '' }; });
      return 0;
    },
    unset(args) { args.forEach((a) => { delete this.vars[a]; }); return 0; },
    exit() {
      if (this.stack.length) {
        const back = this.stack.pop();
        this.say('logout\n');
        this.user = back.user;
        this.cwd = back.cwd;
        return 0;
      }
      this.note('（练习场里不需要 exit；想重来可以按「重置」）');
      return 0;
    },
    help() {
      this.note('（练习场支持的命令：pwd cd ls cat head tail echo touch mkdir rmdir rm cp mv tree tar diff grep wc chmod chown chgrp whoami id groups uname uptime hostname date useradd usermod userdel groupadd passwd su sudo dmesg history clear python3 nano；脚本用 ./名称 或 bash 名称 运行）');
      return 0;
    },
    python(args) {
      if (args.length) {
        if (args[0] === '--version' || args[0] === '-V') { this.say('Python 3.10.12\n'); return 0; }
        return this.runPython(this.abs(args[0]), args[0]);
      }
      this.say(PY_BANNER);
      this.py = { vars: {} };
      this.pyVars = {};
      return 0;
    },
    bash(args, io, name) {
      if (!args.length) { this.note(`（练习场不能开新的 ${name}，要运行脚本请写成 ${name} 文件名）`); return 1; }
      const p = this.abs(args[0]);
      try { this.need(p); } catch (e) { this.yell(`${name}: ${args[0]}: ${e.message}\n`); return 127; }
      return this.runScript(p, args[0], args.slice(1));
    },
    nano(args, io, name) {
      if (!args.length) { this.note(`（请写成 ${name} 文件名）`); return 1; }
      const p = this.abs(args[0]);
      try {
        const n = this.walk(p);
        if (n && n.dir) fail('EISDIR');
        if (n && !this.can(n, 'r')) fail('EACCES');
      } catch (e) { this.yell(`${name}: ${args[0]}: ${e.message}\n`); return 1; }
      if (this.script) { this.note('（脚本里不能打开编辑器）'); return 1; }
      this.flags.edit = { path: p, shown: args[0], as: this.who };
      return 0;
    },
    useradd(argv) {
      if (this.who !== 'root') { this.yell('useradd: Permission denied.\nuseradd: cannot lock /etc/passwd; try again later.\n'); return 1; }
      const o = options('useradd', argv, 'mM', 'sdGg', false);
      if (helpNote(this, o)) return 2;
      const name = o.args[0];
      if (!name) { this.yell('Usage: useradd [options] LOGIN\n'); return 2; }
      if (this.userOf(name)) { this.yell(`useradd: user '${name}' already exists\n`); return 9; }
      if (this.groupList().some((g) => g.name === name)) { this.yell(`useradd: group ${name} exists - if you want to add this user to that group, use -g.\n`); return 9; }
      const groups = o.val.G ? o.val.G.split(',') : [];
      const missing = groups.find((g) => !this.groupList().some((x) => x.name === g));
      if (missing) { this.yell(`useradd: group '${missing}' does not exist\n`); return 6; }
      this.addUser(name, { home: o.has('m'), shell: o.val.s, homeDir: o.val.d, groups });
      return 0;
    },
    groupadd(argv) {
      if (this.who !== 'root') { this.yell('groupadd: Permission denied.\ngroupadd: cannot lock /etc/group; try again later.\n'); return 10; }
      const name = argv.find((a) => !a.startsWith('-'));
      if (!name) { this.yell('Usage: groupadd [options] GROUP\n'); return 2; }
      if (this.groupList().some((g) => g.name === name)) { this.yell(`groupadd: group '${name}' already exists\n`); return 9; }
      this.addGroup(name);
      return 0;
    },
    userdel(argv) {
      if (this.who !== 'root') { this.yell('userdel: Permission denied.\nuserdel: cannot lock /etc/passwd; try again later.\n'); return 1; }
      const o = options('userdel', argv, 'rf', '', false);
      if (helpNote(this, o)) return 2;
      const name = o.args[0];
      const u = name && this.userOf(name);
      if (!u) { this.yell(`userdel: user '${name || ''}' does not exist\n`); return 6; }
      this.editTable('/etc/passwd', (l) => (l.split(':')[0] === name ? null : l));
      this.editTable('/etc/shadow', (l) => (l.split(':')[0] === name ? null : l));
      this.editTable('/etc/group', (l) => {
        const [gn, x, id, m] = l.split(':');
        if (gn === name) return null;
        return `${gn}:${x}:${id}:${(m ? m.split(',') : []).filter((v) => v !== name).join(',')}`;
      });
      if (o.has('r')) this.subtree(u.home).forEach((x) => { if (u.home !== '/') delete this.files[x]; });
      return 0;
    },
    usermod(argv) {
      if (this.who !== 'root') { this.yell('usermod: Permission denied.\nusermod: cannot lock /etc/passwd; try again later.\n'); return 1; }
      const o = options('usermod', argv, 'amLU', 'sdGgl', false);
      if (helpNote(this, o)) return 2;
      const name = o.args[0];
      const u = name && this.userOf(name);
      if (!u) { this.yell(`usermod: user '${name || ''}' does not exist\n`); return 6; }
      if (o.val.G != null) {
        const want = o.val.G.split(',').filter(Boolean);
        const missing = want.find((g) => !this.groupList().some((x) => x.name === g));
        if (missing) { this.yell(`usermod: group '${missing}' does not exist\n`); return 6; }
        this.editTable('/etc/group', (l) => {
          const [gn, x, id, m] = l.split(':');
          let mem = m ? m.split(',') : [];
          if (!o.has('a')) mem = mem.filter((v) => v !== name);
          if (want.includes(gn) && !mem.includes(name) && +id !== u.gid) mem.push(name);
          return `${gn}:${x}:${id}:${mem.join(',')}`;
        });
      } else if (o.has('a')) { this.yell("usermod: -a flag is ONLY allowed with the -G flag\n"); return 2; }
      const set = (i, v) => this.editTable('/etc/passwd', (l) => { const f = l.split(':'); if (f[0] !== name) return l; f[i] = v; return f.join(':'); });
      if (o.val.s) set(6, o.val.s);
      if (o.val.d) {
        if (o.has('m') && this.files[u.home]) {
          this.subtree(u.home).forEach((x) => { this.files[o.val.d + x.slice(u.home.length)] = this.files[x]; delete this.files[x]; });
        }
        set(5, o.val.d);
      }
      if (o.has('L') || o.has('U')) this.editTable('/etc/shadow', (l) => { const f = l.split(':'); if (f[0] !== name) return l; f[1] = o.has('L') ? (f[1].startsWith('!') ? f[1] : `!${f[1]}`) : f[1].replace(/^!/, ''); return f.join(':'); });
      return 0;
    },
    passwd(argv) {
      const o = options('passwd', argv, 'lud', '', false);
      if (helpNote(this, o)) return 1;
      const name = o.args[0] || this.who;
      if (this.who !== 'root' && name !== this.who) { this.yell(`passwd: You may not view or modify password information for ${name}.\n`); return 1; }
      if (!this.userOf(name)) { this.yell(`passwd: user '${name}' does not exist\n`); return 1; }
      const setHash = (fn) => this.editTable('/etc/shadow', (l) => { const f = l.split(':'); if (f[0] !== name) return l; f[1] = fn(f[1]); return f.join(':'); });
      if (o.has('l') || o.has('u')) {
        if (this.who !== 'root') { this.yell('passwd: Permission denied.\n'); return 1; }
        setHash((h) => (o.has('l') ? (h.startsWith('!') ? h : `!${h}`) : h.replace(/^!/, '')));
        this.say('passwd: password expiry information changed.\n');
        return 0;
      }
      if (this.who !== 'root') { this.note('（练习场不能改 labex 自己的密码）'); return 1; }
      this.ask('New password: ', (a) => {
        this.say('\n');
        this.ask('Retype new password: ', (b) => {
          this.say('\n');
          if (a !== b) { this.yell('Sorry, passwords do not match.\npasswd: Authentication token manipulation error\npasswd: password unchanged\n'); return; }
          setHash(() => `$y$j9T$${hash(a)}`);
          this.say('passwd: password updated successfully\n');
        }, true);
      }, true);
      return 0;
    },
    su(argv) {
      const login = argv.includes('-') || argv.includes('-l');
      const name = argv.find((a) => !a.startsWith('-')) || 'root';
      const u = this.userOf(name);
      if (!u) { this.yell(`su: user ${name} does not exist or the user entry does not contain all the required fields\n`); return 1; }
      if (name === 'root') { this.note('（练习场不支持切换成 root，请在命令前面加 sudo）'); return 1; }
      const enter = () => {
        this.stack.push({ user: this.user, cwd: this.cwd });
        this.user = name;
        if (login) {
          if (this.files[u.home] && this.files[u.home].dir) this.cwd = u.home;
          else this.yell(`su: warning: cannot change directory to ${u.home}: No such file or directory\n`);
        }
      };
      if (this.who === 'root') { enter(); return 0; }
      this.ask('Password: ', (pw) => {
        this.say('\n');
        const line = linesOf(this.files['/etc/shadow'].content).find((l) => l.startsWith(`${name}:`));
        const h = line ? line.split(':')[1] : '!';
        if (h.startsWith('!') || h === '*' || h !== `$y$j9T$${hash(pw)}`) { this.yell('su: Authentication failure\n'); this.status = 1; return; }
        enter();
      }, true);
      return 0;
    },
  };
  CMDS.tail = CMDS.head;
  CMDS.chgrp = CMDS.chown;
  CMDS.python3 = CMDS.python;
  CMDS.sh = CMDS.bash;
  CMDS.logout = CMDS.exit;
  ['vim', 'vi', 'code', 'gedit'].forEach((k) => { CMDS[k] = CMDS.nano; });
  ['top', 'htop', 'less', 'more', 'man', 'watch'].forEach((k) => {
    CMDS[k] = function () { this.note(`（练习场不支持 ${k} 这种全屏程序${k === 'man' ? '，可以看网站的「命令速查」' : ''}）`); return 1; };
  });

  // cp 和 mv
  function copyMove(argv, name) {
    const o = options(name, argv, name === 'cp' ? 'rRivfa' : 'ivf', '', false);
    if (helpNote(this, o)) return 1;
    if (o.args.length < 2) { this.yell(o.args.length ? `${name}: missing destination file operand after '${o.args[0]}'\nTry '${name} --help' for more information.\n` : `${name}: missing file operand\nTry '${name} --help' for more information.\n`); return 1; }
    const srcs = o.args.slice(0, -1);
    const dstArg = o.args[o.args.length - 1];
    const dst = this.abs(dstArg);
    let dn = null;
    try { dn = this.walk(dst); } catch (e) { dn = null; }
    const intoDir = dn && dn.dir;
    if (srcs.length > 1 && !intoDir) { this.yell(`${name}: target '${dstArg}' is not a directory\n`); return 1; }
    let code = 0;
    srcs.forEach((a) => {
      const sp = this.abs(a);
      try {
        const sn = this.need(sp);
        if (name === 'cp' && sn.dir && !(o.has('r') || o.has('R') || o.has('a'))) { this.yell(`cp: -r not specified; omitting directory '${a}'\n`); code = 1; return; }
        if (name === 'cp' && !sn.dir) this.read(sp);
        const to = intoDir ? join(dst, base(sp)) : dst;
        if (to === sp) { this.yell(`${name}: '${a}' and '${intoDir ? `${dstArg.replace(/\/$/, '')}/${base(sp)}` : dstArg}' are the same file\n`); code = 1; return; }
        if (under(to, sp)) { this.yell(`${name}: cannot ${name === 'cp' ? 'copy a directory' : 'move'} '${a}'${name === 'cp' ? ', into itself' : ' to a subdirectory of itself'}, '${to}'\n`); code = 1; return; }
        const tn = this.walk(to);
        if (tn && tn.dir && !sn.dir) { this.yell(`${name}: cannot overwrite directory '${to}' with non-directory\n`); code = 1; return; }
        if (tn && !tn.dir && sn.dir) { this.yell(`${name}: cannot overwrite non-directory '${to}' with directory '${a}'\n`); code = 1; return; }
        if (name === 'mv') this.parentFor(sp);
        if (!tn) this.parentFor(to); else if (!tn.dir && !this.can(tn, 'w') && name === 'cp') fail('EACCES');
        const moved = this.subtree(sp).sort().map((x) => [x, to + x.slice(sp.length), this.files[x]]);
        if (tn && tn.dir) this.subtree(to).filter((x) => x !== to).forEach((x) => { if (!moved.some(([, t]) => t === x)) delete this.files[x]; });
        if (name === 'mv') moved.forEach(([x]) => delete this.files[x]);
        moved.forEach(([, t, v]) => {
          if (name === 'mv') this.files[t] = v;
          else {
            const fresh = this.newNode(v.dir, v.content);
            this.files[t] = { ...fresh, mode: v.mode, archive: v.archive, gz: v.gz };
          }
        });
        if (o.has('v')) this.say(name === 'mv' ? `renamed '${a}' -> '${to}'\n` : `'${a}' -> '${to}'\n`);
      } catch (e) {
        if (!(e instanceof FsError)) throw e;
        this.yell(e.code === 'ENOENT' && !this.files[sp] ? `${name}: cannot stat '${a}': ${e.message}\n` : `${name}: cannot ${name === 'cp' ? `create regular file '${dstArg}'` : `move '${a}' to '${dstArg}'`}: ${e.message}\n`);
        code = 1;
      }
    });
    return code;
  }

  // 判题 ----------------------------------------------------------------------
  // 每一条检查：{ say: '给人看的说明', …条件 }。路径都是相对题目的 root。
  // real：真终端机判题时，same 和 run 要跑的命令已经先在容器里跑好，放在 real.same[命令]、real.run[i]
  function judge(sh, checks, real) {
    return checks.map((c) => {
      const p = (x) => norm(sh.root, x);
      const n = (x) => sh.files[p(x)];
      let ok = true;
      let got = '';
      const target = c.file || c.dir || c.path;
      if (c.file) ok = ok && Boolean(n(c.file)) && !n(c.file).dir;
      if (c.dir) ok = ok && Boolean(n(c.dir)) && n(c.dir).dir;
      if (c.path) ok = ok && Boolean(n(c.path));
      if (c.gone) ok = ok && !n(c.gone);
      if (ok && target) {
        const node = n(target);
        const text = node.content || '';
        if (c.content != null) ok = text === c.content;
        if (c.has != null) ok = ok && [].concat(c.has).every((s) => text.includes(s));
        if (c.hasNot != null) ok = ok && [].concat(c.hasNot).every((s) => !text.includes(s));
        if (c.lines) ok = ok && JSON.stringify(linesOf(text).map((l) => l.trimEnd())) === JSON.stringify(c.lines);
        if (c.match) ok = ok && c.match.test(text);
        if (c.mode) { ok = ok && node.mode === c.mode; got = `现在是 ${node.mode}（${octal(node.mode)}）`; }
        if (c.owner) { ok = ok && node.owner === c.owner; got = `现在是 ${node.owner}:${node.group}`; }
        if (c.group) ok = ok && node.group === c.group;
        // 压缩包里的文件：只比文件名，不管打包时站在哪一层
        if (c.members) ok = ok && Boolean(node.archive) && JSON.stringify(node.archive.filter((m) => !m.dir).map((m) => base(m.name)).sort()) === JSON.stringify([...c.members].sort());
        // 文件内容要和「某个命令的输出」一模一样
        if (c.same) { const want = real ? real.same[c.same] : sh.clone().capture(c.same); ok = ok && text === want; }
        if (c.kids) ok = ok && JSON.stringify(sh.kids(p(target)).map(base).sort()) === JSON.stringify([...c.kids].sort());
      }
      if (c.user) {
        const u = sh.userOf(c.user);
        ok = ok && Boolean(u);
        if (u && c.shell) ok = ok && u.shell === c.shell;
        if (u && c.home) ok = ok && u.home === c.home;
        if (u && c.inGroups) ok = ok && c.inGroups.every((g) => sh.groupsOf(c.user).some((x) => x.name === g));
        if (u && c.homeDir) ok = ok && Boolean(sh.files[u.home]) && sh.files[u.home].dir;
        if (u && c.locked != null) { const l = linesOf(sh.files['/etc/shadow'].content).find((x) => x.startsWith(`${c.user}:`)); ok = ok && Boolean(l) && l.split(':')[1].startsWith('!') === c.locked; }
      }
      if (c.nouser) ok = ok && !sh.userOf(c.nouser);
      if (c.groupExists) ok = ok && sh.groupList().some((g) => g.name === c.groupExists);
      if (c.run) {
        let want = c.out;
        if (real) {
          // 真的程序从 stdin 读回答，画面上不会出现打进去的字，所以期望的输出要拿掉回答那一段
          got = real.run[checks.indexOf(c)] || '';
          if (typeof want === 'string') (c.input || []).forEach((a) => { want = want.replace(`${a}\n`, ''); });
        } else {
          const t = sh.clone();
          got = t.capture(c.run);
          (c.input || []).forEach((a) => { got += t.capture(a); });
        }
        got = got.replace(/\n+$/, '');
        ok = ok && (want instanceof RegExp ? want.test(got) : got === want);
      }
      if (c.py) {
        const v = sh.pyVars[c.py];
        ok = ok && Boolean(v);
        if (v && c.value != null) ok = ok && v.v === c.value;
        if (v && c.type) ok = ok && v.t === c.type;
      }
      if (c.printed) ok = ok && sh.pyOut.some((x) => c.printed.test(x));
      if (c.ran) ok = ok && sh.typed.some((x) => c.ran.test(x));
      if (c.test) ok = ok && Boolean(c.test(sh));
      return { say: c.say, ok, got };
    });
  }

  // 用参考解答跑一次，确认它真的能通过（主控台检查用）
  function verify(problem) {
    const sh = new Shell(problem.setup);
    const shown = [];
    problem.answer.forEach((step) => {
      if (typeof step === 'object') {
        const p = norm(sh.cwd, step.edit);
        sh.input(`nano ${step.edit}`);
        sh.files[p] = { ...(sh.files[p] || sh.newNode(false, '')), content: step.text, mtime: Date.now() };
        return;
      }
      const r = sh.input(step);
      shown.push(...r.out.map((c) => c.t));
    });
    return { results: judge(sh, problem.checks), shown: shown.join('') };
  }

  // 编辑器存档：照打开编辑器时的身分检查权限
  Shell.prototype.saveFile = function (path, text, as) {
    const was = this.sudo;
    this.sudo = as === 'root';
    try {
      this.write(path, text.endsWith('\n') || text === '' ? text : `${text}\n`);
      return null;
    } catch (e) {
      if (!(e instanceof FsError)) throw e;
      return e.message;
    } finally { this.sudo = was; }
  };

  // Tab 补全：第一个字补命令，其他补文件名
  Shell.prototype.complete = function (line) {
    if (this.py || this.pending) return null;
    const m = line.match(/(\S*)$/);
    const word = m[1];
    const first = !line.slice(0, line.length - word.length).trim() || /(\||&&|;|sudo)\s*$/.test(line.slice(0, line.length - word.length));
    let pool;
    let dirPart = '';
    if (first && !word.includes('/')) pool = Object.keys(CMDS).filter((k) => k.startsWith(word));
    else {
      const cut = word.lastIndexOf('/');
      dirPart = cut >= 0 ? word.slice(0, cut + 1) : '';
      const dir = this.abs(dirPart || '.');
      const node = this.files[dir];
      if (!node || !node.dir) return null;
      const stem = word.slice(cut + 1);
      pool = this.kids(dir).filter((k) => base(k).startsWith(stem) && (stem.startsWith('.') || !base(k).startsWith('.'))).map((k) => base(k) + (this.files[k].dir ? '/' : ''));
    }
    if (!pool.length) return null;
    let common = pool[0];
    pool.forEach((x) => { while (!x.startsWith(common)) common = common.slice(0, -1); });
    const done = pool.length === 1 && !common.endsWith('/') ? `${common} ` : common;
    return { line: line.slice(0, line.length - word.length) + dirPart + done, options: pool.length > 1 ? pool : null };
  };

  Shell.judge = judge;
  Shell.verify = verify;
  Shell.norm = norm;
  Shell.octal = octal;
  Shell.DMESG = DMESG;
  KM.Shell = Shell;
})();
