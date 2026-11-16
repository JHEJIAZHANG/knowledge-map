// 命令解剖：光标移到终端机的命令上，拆解每个部分的意思
(function () {
  const KM = window.KnowledgeMap;
  const { h, icon } = KM.ui;

  // 新命令加在这里。opts：选项说明；vals：后面会接数字的选项；roles：参数的角色
  const DOC = {
    echo: { d: '把后面的文本印出来', args: '要输出的文本' },
    whoami: { d: '显示目前的用户名' },
    id: { d: '显示用户的 UID、GID 与所属用户组', opts: { u: '只显示用户 ID', n: '显示名称而不是数字' }, args: '要查找的用户' },
    pwd: { d: '印出目前所在位置的完整路径' },
    cd: { d: '切换目前所在的目录', args: '要前往的目录' },
    ls: { d: '列出目录内容', opts: { a: '包含 . 开头的隐藏文件', l: '详细信息：权限、拥有者、大小、时间', R: '一层层列出所有子目录', d: '只看目录本身，不列出里面' }, args: '要列出的目录或文件' },
    touch: { d: '创建空文件（已存在则更新时间）', args: '文件' },
    mkdir: { d: '创建目录', opts: { p: '中间缺的目录一起创建' }, args: '要创建的目录' },
    cp: { d: '复制文件或目录', opts: { r: '递归：连目录内容一起复制', i: '要覆盖前先询问' }, roles: 'srcdst' },
    mv: { d: '移动或改名', opts: { i: '要覆盖前先询问' }, roles: 'srcdst' },
    rm: { d: '删除文件（没有资源回收桶）', opts: { i: '每个都先询问', r: '递归：连目录内容一起删', f: '强制：不询问、不报错' }, args: '要删除的项目' },
    rmdir: { d: '删除「空的」目录', args: '要删除的目录' },
    cat: { d: '印出文件内容', opts: { n: '每行加上行号' }, args: '要读的文件' },
    head: { d: '显示文件开头（默认 10 行）', opts: { n: '要取几行', c: '要取几个字节' }, args: '要读的文件' },
    tail: { d: '显示文件结尾（默认 10 行）', opts: { n: '要取几行', c: '要取几个字节', f: '持续显示新写入的内容' }, args: '要读的文件' },
    diff: { d: '比较两个文件或目录的差异', opts: { r: '递归比较两个目录' }, roles: 'pair' },
    chown: { d: '更换拥有者与用户组（change owner）', opts: { R: '递归：连目录里的所有东西一起换' }, roles: 'owner', args: '要过户的文件或目录' },
    chmod: { d: '更改权限（change mode）', opts: { R: '递归：连目录里的所有东西一起改' }, roles: 'mode', args: '要改权限的文件或目录' },
    sudo: { d: '用管理员（root）的身分运行后面的命令' },
    useradd: { d: '创建新的用户账号', opts: { m: '顺便创建家目录（make home）' }, args: '新账号的名称' },
    passwd: { d: '设置或更改密码', opts: { l: '锁定（lock）：密码暂时不能用', u: '解锁（unlock）：恢复密码' }, args: '要设置的账号' },
    usermod: { d: '修改现有账号的设置（user modify）', opts: { d: '改家目录的纪录', s: '改登录用的 Shell', a: '附加（append）：保留原本的用户组', G: '指定要加入的用户组' }, takes: { d: '新的家目录', s: '新的 Shell', G: '要加入的用户组' }, args: '要修改的账号' },
    userdel: { d: '删除用户账号', opts: { r: '连家目录一起删（remove）' }, args: '要删除的账号' },
    groups: { d: '列出用户加入的所有用户组', args: '要查找的账号' },
    su: { d: '切换成另一个用户（switch user）', args: '要切换成的账号' },
    exit: { d: '离开目前的 Shell，回到上一个身分' },
    uname: { d: '显示系统信息（unix name）', opts: { a: '全部（all）：主机名称、内核版本、硬件架构一起印', r: '只印内核版本（release）', n: '只印主机名称（nodename）', m: '只印硬件架构（machine）' } },
    uptime: { d: '显示已经开机多久、几人登录、平均负载', opts: { p: '只印开机多久，用好读的格式（pretty）', s: '印出是从什么时候开机的（since）' } },
    top: { d: '即时显示正在运行的程序，按 q 离开' },
    tree: { d: '把目录里的东西画成树状图，一层一层展开', opts: { L: '最多往下展开几层（level）', d: '只列目录，不列文件', a: '连隐藏文件也列出来' }, args: '要画的目录（不写就是目前位置）' },
    tar: { d: '把很多文件打包成一个文件（tape archive）', opts: { c: '创建新的压缩包（create）', z: '用 gzip 压缩，文件名通常是 .tar.gz', f: '后面紧接着压缩包的文件名（file）', t: '列出压缩包里有哪些文件（list）', x: '解开压缩包（extract）', v: '把处理到的每个文件名印出来（verbose）' }, takes: { f: '压缩包的文件名' }, args: '要装进去的文件' },
    grep: { d: '在文件里找出含有指定文本的那几行', opts: { w: '整个单字相符才算（whole word）', i: '忽略大小写（ignore case）', E: '高端样式：可以用 | 表示「或」', n: '每行前面加上行号', c: '只算有几行符合（count）', v: '反过来：只留下不符合的行', r: '连子目录里的文件一起找' }, roles: 'find' },
    dmesg: { d: '显示系统内核的消息，包括开机过程和硬件驱动的纪录' },
    python: { d: '打开 Python 交互模式：提示字符变成 >>>，之后打的是 Python 代码，exit() 离开', args: '要运行的 .py 文件（不写就进交互模式）' },
  };

  // Python 的内置函数
  const PYDOC = {
    print: { d: '把括号里的东西印在画面上。逗号隔开的几个值，中间会自动补一个空格', args: '要印出的值' },
    input: { d: '先印出括号里的问题，再停下来等你打字，按 Enter 后把打的内容交回来（一定是文本 str）', args: '要显示的问题' },
    int: { d: '把值换成整数（integer）。文本里必须只有数字，例如 "25"', args: '要换成整数的值' },
    float: { d: '把值换成小数（浮点数）', args: '要换成小数的值' },
    str: { d: '把值换成文本（string）', args: '要换成文本的值' },
    type: { d: '查出一个值是什么类型，例如 int、float、str', args: '要查的值' },
    len: { d: '算出长度，例如文本有几个字', args: '要量的值' },
    exit: { d: '离开 Python 交互模式，回到 Shell。括号不能省' },
    quit: { d: '和 exit() 一样，离开 Python 交互模式' },
    help: { d: '查说明文件' },
  };
  const PYOP = {
    '=': ['赋值', '先把右边算出来，再把左边的名字挂到这个值上'],
    '+': ['加', '数字相加；两边都是文本时是接起来'],
    '-': ['减', ''],
    '*': ['乘', '数字相乘；文本 * 整数是重复几次'],
    '/': ['除', '结果一定是小数（float），就算刚好整除也一样'],
    '//': ['整除', '只留商的整数部分'],
    '%': ['余数', '除完剩下多少'],
    '**': ['次方', ''],
    ',': ['逗号', '分隔括号里的几个值'],
  };

  // Python 代码：一个一个记号说明，括号不另外列
  function parsePy(line) {
    const toks = line.match(/"[^"]*"?|'[^']*'?|\d+\.\d*|\d+|[A-Za-z_]\w*|\/\/|\*\*|==|[=+\-*/%,()]/g) || [];
    const out = [];
    toks.forEach((t, i) => {
      const next = toks[i + 1];
      if (t === '(' || t === ')') return;
      if (/^["']/.test(t)) {
        const ok = t.length > 1 && t.endsWith(t[0]);
        out.push({ t, k: 'arg', label: '文本（str）', desc: ok ? '引号里的内容原样保存；引号本身不算内容' : '少了结尾的引号，Python 会报 SyntaxError' });
      } else if (/^\d+\.\d*$/.test(t)) {
        out.push({ t, k: 'arg', label: '小数（float）', desc: '有小数点的数字' });
      } else if (/^\d+$/.test(t)) {
        out.push({ t, k: 'arg', label: '整数（int）', desc: '' });
      } else if (/^[A-Za-z_]/.test(t) && next === '(') {
        const doc = PYDOC[t];
        out.push({ t: `${t}()`, k: 'cmd', label: doc ? '内置函数' : '函数', desc: doc ? doc.d : '名字后面接括号，就是请它做事（调用）' });
      } else if (/^[A-Za-z_]/.test(t)) {
        const assign = next === '=' && i === 0;
        out.push({ t, k: assign ? 'opt' : 'arg', label: assign ? '变量名' : '变量', desc: assign ? '名牌：之后打这个名字，就会拿到右边的值' : 'Python 会换成这个名字目前挂着的值' });
      } else if (PYOP[t]) {
        out.push({ t, k: 'op', label: PYOP[t][0], desc: PYOP[t][1] });
      }
    });
    return out;
  }

  const RWX = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  const WHO = ['拥有者', '用户组', '其他人'];

  function pathHint(t) {
    if (/^"/.test(t) && /\$[A-Za-z_{]/.test(t)) {
      const notes = ['双引号：里面的 $变量 会先换成值，空格原样保留'];
      if (/\\\$/.test(t)) notes.push('\\$ 是转义：$ 当成普通字符印出来，反斜线自己不印');
      if (/\$\{/.test(t)) notes.push('${名字}：大括号框出变量名到哪里结束');
      return notes.join('；');
    }
    if (/^'/.test(t) && t.includes('$')) return '单引号：里面的东西原样保留，$ 也不会被换成值';
    if (/^\$[A-Za-z_{]/.test(t)) return '变量：Shell 先换成它的值。没加引号时，值里连续的空格会被压成一个';
    if (/^["']/.test(t)) return '文本内容（引号让含空格的文本算同一个参数）';
    if (/^['"].*\|.*['"]$/.test(t)) return '引号里的 | 是「或」，不是管道';
    if (/[*?]/.test(t)) return '通配符：Shell 会先把它换成所有符合的文件名，再交给命令';
    if (t === '~') return '家目录 /home/labex';
    if (t.startsWith('~/')) return `家目录底下的 ${t.slice(2)}`;
    if (t === '..') return '上一层目录';
    if (t === '.') return '目前所在的目录';
    if (t.startsWith('./')) return `目前目录里的 ${t.slice(2)}`;
    if (t.startsWith('/')) return '绝对路径：从最上层 / 开始';
    if (t.endsWith('/')) return '结尾的 / 表示这是目录';
    if (t.includes('/')) return '相对路径：从目前位置往下找';
    return '';
  }

  function parse(line) {
    const toks = line.match(/(?:"[^"]*"|'[^']*'|[^\s"'|<>]+)+|>>|>|\|/g) || [];
    if (!toks.length) return [];
    // 设置变量：名字=值（等号两边不能有空格）
    const set = toks[0].match(/^([A-Za-z_]\w*)=(.*)$/);
    if (set && toks.length === 1) {
      return [{ t: toks[0], k: 'cmd', label: '设置变量', desc: `把 ${set[2] || '（空的）'} 存进变量 ${set[1]}。等号两边不能有空格；要用的时候写 $${set[1]}` }];
    }
    // 管道：左右两边各自是一个完整的命令
    const bar = toks.indexOf('|');
    if (bar > 0) {
      return [...parse(toks.slice(0, bar).join(' ')),
        { t: '|', k: 'op', label: '管道', desc: '把左边命令的输出，直接交给右边的命令当输入' },
        ...parse(toks.slice(bar + 1).join(' '))];
    }
    const name = toks[0];
    if (name === 'sudo' && toks.length > 1) {
      return [{ t: 'sudo', k: 'op', label: '管理员身分', desc: DOC.sudo.d }, ...parse(line.replace(/^\s*sudo\s+/, ''))];
    }
    const doc = DOC[name];
    const script = /^\.?\.?\//.test(name) ? '运行这个文件（需要运行权限 x）' : '';
    const out = [{ t: name, k: 'cmd', label: script ? '运行脚本' : '命令', desc: doc ? doc.d : script }];
    const args = [];
    let redirect = false;
    let taking = '';
    toks.slice(1).forEach((t) => {
      if (taking) {
        out.push({ t, k: 'arg', label: taking, desc: pathHint(t) });
        taking = '';
        return;
      }
      if (t === '-' && name === 'su') {
        out.push({ t, k: 'opt', label: '选项', desc: '完整登录：连家目录和环境设置一起换' });
        return;
      }
      if (t === '>' || t === '>>') {
        out.push({ t, k: 'op', label: '重新导向', desc: t === '>' ? '把输出写进右边的文件（覆写原本内容）' : '把输出接在右边文件的最后' });
        redirect = true;
        return;
      }
      if (redirect) {
        out.push({ t, k: 'arg', label: '写入的文件', desc: pathHint(t) });
        redirect = false;
        return;
      }
      if (/^-\w/.test(t) && doc) {
        if (doc.takes && doc.takes[t.slice(-1)]) taking = doc.takes[t.slice(-1)];
        const num = t.match(/^-([a-zA-Z])(\d+)$/);
        if (num && doc.opts && doc.opts[num[1]]) {
          out.push({ t, k: 'opt', label: `选项 -${num[1]} ${num[2]}`, desc: `${doc.opts[num[1]]}：${num[2]}` });
        } else if (doc.opts && doc.opts[t.slice(1)]) {
          out.push({ t, k: 'opt', label: '选项', desc: doc.opts[t.slice(1)] });
        } else {
          out.push({ t, k: 'opt', label: '组合选项', desc: [...t.slice(1)].map((c) => `-${c} ${(doc.opts && doc.opts[c]) || ''}`).join('；') });
        }
        return;
      }
      const a = { t, k: 'arg', label: (doc && doc.args) || '参数', desc: pathHint(t) };
      out.push(a);
      args.push(a);
    });
    if (doc && doc.roles === 'srcdst' && args.length >= 2) {
      args.forEach((a, i) => { a.label = i === args.length - 1 ? '目的地' : '来源'; });
      const dst = args[args.length - 1];
      if (!dst.desc) dst.desc = '不存在就当新名字；是目录就放进去';
    }
    if (doc && doc.roles === 'find' && args.length) {
      args[0].label = '要找的文本';
      args[0].desc = '引号可以省略，加上比较保险';
      args.slice(1).forEach((x) => { x.label = '到哪个文件找'; });
    }
    if (doc && doc.roles === 'pair') args.forEach((a, i) => { a.label = `比较对象 ${i + 1}`; });
    if (doc && doc.roles === 'owner' && args.length >= 2) {
      const [o, g] = args[0].t.split(':');
      args[0].label = '新的拥有者:用户组';
      args[0].desc = g === undefined ? `拥有者换成 ${o}，用户组不变` : `拥有者换成 ${o || '（不变）'}，用户组换成 ${g}`;
    }
    if (doc && doc.roles === 'mode' && args.length >= 2 && /^[0-7]{3}$/.test(args[0].t)) {
      args[0].label = '权限数字';
      args[0].desc = Array.from(args[0].t).map((d, i) => `${WHO[i]} ${d}=${RWX[+d]}`).join('、');
    } else if (doc && doc.roles === 'mode' && args.length >= 2 && /^[ugoa]*[+\-=][rwx]+$/.test(args[0].t)) {
      const [, who, op, perms] = args[0].t.match(/^([ugoa]*)([+\-=])([rwx]+)$/);
      const names = !who || who.includes('a') ? '三组（拥有者、用户组、其他人）' : who.split('').map((c) => WHO['ugo'.indexOf(c)]).join('、');
      const verb = { '+': '加上', '-': '拿掉', '=': '设成只有' }[op];
      args[0].label = '权限变化';
      args[0].desc = `给${names}${verb} ${perms.split('').join('、')}（u 拥有者、g 用户组、o 其他人；+ 加、- 拿掉）`;
    }
    return out;
  }

  // 浮动面板 -----------------------------------------------------------------
  const panel = h('div', { class: 'anat glass', role: 'tooltip' });
  document.body.append(panel);
  let current = null;
  let closing = 0;

  function hide() {
    clearTimeout(closing);
    current = null;
    panel.classList.remove('show');
  }
  // 光标离开后晚一点才关，移到面板上就留着
  function hideSoon() {
    clearTimeout(closing);
    closing = setTimeout(hide, 260);
  }

  function place() {
    const r = current.getBoundingClientRect();
    const w = panel.offsetWidth;
    const ph = panel.offsetHeight;
    let top = r.bottom + 10;
    if (top + ph > innerHeight - 12) top = Math.max(12, r.top - ph - 10);
    panel.style.left = `${Math.min(Math.max(12, r.left), innerWidth - w - 12)}px`;
    panel.style.top = `${top}px`;
  }

  function show(target) {
    const py = target.dataset.lang === 'py';
    const parts = py ? parsePy(target.dataset.cmd) : parse(target.dataset.cmd);
    if (!parts.length || (parts.length === 1 && !parts[0].desc)) { hide(); return; }
    current = target;
    panel.replaceChildren(
      h('div', { class: 'an-head', html: icon('search') }, py ? '代码解剖' : '命令解剖'),
      h('div', { class: 'an-line' }, parts.map((p, i) => h('span', { class: `an-chip k-${p.k}`, 'data-i': i, style: `animation-delay:${i * 45}ms` }, p.t))),
      h('div', { class: 'an-list' }, parts.map((p, i) =>
        h('div', { class: 'an-row', 'data-i': i },
          h('span', { class: `an-chip sm k-${p.k}` }, p.t),
          h('div', {}, h('b', {}, p.label), p.desc ? h('span', {}, p.desc) : null)))));
    clearTimeout(closing);
    panel.style.visibility = 'hidden';
    panel.classList.add('show');
    place();
    panel.style.visibility = '';
  }

  document.addEventListener('mouseover', (e) => {
    if (!e.target.closest) return;
    const t = e.target.closest('[data-cmd]');
    if (t && t !== current) show(t);
    else if (t || e.target.closest('.anat')) clearTimeout(closing);
    else if (current) hideSoon();
    const chip = e.target.closest('.anat [data-i]');
    panel.querySelectorAll('[data-i]').forEach((x) => x.classList.toggle('hot', Boolean(chip) && x.dataset.i === chip.dataset.i));
  });
  // 触摸设备没有光标，改用点的
  document.addEventListener('click', (e) => {
    if (!e.target.closest) return;
    const t = e.target.closest('[data-cmd]');
    if (t && matchMedia('(hover: none)').matches) { if (current === t) hide(); else show(t); }
    else if (!t && !e.target.closest('.anat')) hide();
  });
  // 卷动时跟着命令走；命令离开画面或被换掉才关
  let queued = false;
  addEventListener('scroll', () => {
    if (!current || queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      if (!current) return;
      const r = current.getBoundingClientRect();
      if (!current.isConnected || r.bottom < 0 || r.top > innerHeight) hide();
      else place();
    });
  }, { passive: true, capture: true });

  KM.anatomy = { DOC, PYDOC, parse, parsePy };
})();
