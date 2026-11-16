// 命令重播：左边终端机、右边文件树，每一步直接标出「打之前和打之后差在哪」
//
// 文件的变化由命令算出来，不是手动摆的。写法见 content/topics.js 的 run 区块。
(function () {
  const KM = window.KnowledgeMap;
  const { h, rich, icon, tag, halo, reduced } = KM.ui;

  const HOME = '/home/labex';
  const under = (x, p) => x === p || x.startsWith(p === '/' ? '/' : `${p}/`);
  const base = (p) => p.split('/').filter(Boolean).pop() || '/';
  const parentOf = (p) => p.split('/').slice(0, -1).join('/') || '/';
  const unquote = (t) => t.replace(/^["']|["']$/g, '');
  const prefixes = (p) => {
    const s = p.split('/').filter(Boolean);
    return ['/', ...s.map((_, i) => `/${s.slice(0, i + 1).join('/')}`)];
  };
  // 进了 Python 交互模式，提示字符变成 >>>
  const promptOf = (st) => (st.py ? '>>> ' : `labex:${st.cwd === HOME ? '~' : base(st.cwd)}/ $ `);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function resolve(cwd, arg) {
    let p = arg;
    if (p === '~' || p.startsWith('~/')) p = HOME + p.slice(1);
    if (!p.startsWith('/')) p = `${cwd}/${p}`;
    const out = [];
    for (const s of p.split('/')) {
      if (!s || s === '.') continue;
      if (s === '..') out.pop(); else out.push(s);
    }
    return `/${out.join('/')}`;
  }

  // 权限：mode 是 9 个字符，例如 rw-rw-r--
  const fileNode = (content) => ({ dir: false, content, mode: 'rw-rw-r--', owner: 'labex', group: 'labex' });
  const dirNode = () => ({ dir: true, mode: 'rwxrwxr-x', owner: 'labex', group: 'labex' });
  const RWX = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
  // 数字（764）或符号（+x、u+x、go-w、a=r）都可以
  function modeOf(spec, old) {
    if (/^[0-7]{3}$/.test(spec)) return Array.from(spec).map((d) => RWX[+d]).join('');
    const m = Array.from(old);
    spec.split(',').forEach((part) => {
      const [, who, op, perms] = part.match(/^([ugoa]*)([+\-=])([rwx]*)$/) || [];
      if (!op) return;
      const groups = (!who || who.includes('a') ? 'ugo' : who).split('').map((c) => 'ugo'.indexOf(c));
      groups.forEach((g) => ['r', 'w', 'x'].forEach((p, i) => {
        const at = g * 3 + i;
        if (op === '=') m[at] = perms.includes(p) ? p : '-';
        else if (perms.includes(p)) m[at] = op === '+' ? p : '-';
      }));
    });
    return m.join('');
  }

  // 仿真器：状态是 { files: { 路径: { dir, content, mode, owner, group } }, cwd } ----------
  function initial(scene) {
    const files = {};
    const add = (path, v) => {
      if (v && typeof v === 'object') {
        files[path] = dirNode();
        Object.entries(v).forEach(([k, x]) => add(path === '/' ? `/${k}` : `${path}/${k}`, x));
      } else {
        files[path] = fileNode(v);
      }
    };
    prefixes(scene.root).forEach((p) => { files[p] = dirNode(); });
    add(scene.root, scene.tree || {});
    // meta：{ '相对路径': 'rwx------ root root' }
    Object.entries(scene.meta || {}).forEach(([rel, v]) => {
      const [mode, owner, group] = v.split(' ');
      const p = resolve(scene.root, rel);
      files[p] = { ...files[p], mode, owner, group };
    });
    return { files, cwd: scene.cwd, py: false, vars: {} };
  }

  // Python 交互模式的一行：名字表的变化由 js/py.js 算出来
  function pyStep(prev, item, res) {
    const line = item.cmd.trim();
    if (/^(exit|quit)\(\)$/.test(line)) {
      Object.assign(res, { py: false, vars: {}, ev: { kind: 'exit' } });
      return res;
    }
    // input() 的回答：输出里「问题」后面接的就是当时打的字
    const outLines = (item.out || '').split('\n');
    const answer = (q) => { const l = outLines.find((x) => x.startsWith(q)); return l ? l.slice(q.length) : (item.answer || ''); };
    const r = KM.py.exec(line, prev.vars, answer);
    res.vars = r.vars;
    res.ev = { ...r, line };
    if (r.kind !== 'error') {
      const shown = [...r.asked.map(([q, a]) => q + a), ...r.printed, ...(r.echo ? [r.echo] : [])].join('\n');
      if (shown !== (item.out || '')) console.warn('仿真结果和实际输出不同：', item.cmd, { want: item.out, got: shown });
    }
    return res;
  }

  // 返回运行后的状态，以及要标在文件树上的提示
  function apply(prev, item) {
    const files = { ...prev.files };
    const res = { files, cwd: prev.cwd, py: prev.py, vars: prev.vars, labels: {}, moveFrom: new Set(), moveTo: new Set(), from: {}, shake: false };
    // 在编辑器里改文件（不是命令）：edit: { file, content }
    if (!item.cmd && item.edit) {
      const p = resolve(prev.cwd, item.edit.file);
      files[p] = { ...(files[p] || fileNode('')), content: item.edit.content };
      res.edited = p;
      return res;
    }
    if (!item.cmd) return res;
    if (prev.py) return pyStep(prev, item, res);
    if (/^python3?$/.test(item.cmd.trim())) {
      Object.assign(res, { py: true, vars: {}, ev: { kind: 'enter' } });
      return res;
    }
    let raw = item.cmd.match(/"[^"]*"|'[^']*'|>>|>|\S+/g);
    if (raw[0] === 'sudo') raw = raw.slice(1);
    // 管道：文件的变化只看最后一段，例如 `dmesg | grep … > 文件`
    if (raw.includes('|')) raw = raw.slice(raw.lastIndexOf('|') + 1);
    const cmd = raw[0];
    const opts = raw.slice(1).filter((t) => t.startsWith('-')).join('');
    const has = (c) => opts.includes(c);
    const args = raw.slice(1).filter((t) => !t.startsWith('-'));
    const here = (a) => resolve(prev.cwd, a);
    const subtree = (p) => Object.keys(files).filter((x) => under(x, p));
    const kidsOf = (p) => Object.keys(files).filter((x) => x !== p && parentOf(x) === p);

    // 通配符：和 Shell 一样，先把 * 和 ? 换成符合的文件名，找不到就照原样留着
    const expand = (a) => {
      if (!/[*?]/.test(a)) return [here(a)];
      const dir = a.includes('/') ? here(a.slice(0, a.lastIndexOf('/')) || '/') : prev.cwd;
      const pat = a.split('/').pop();
      const re = new RegExp(`^${pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
      const hits = kidsOf(dir).filter((k) => !base(k).startsWith('.') && re.test(base(k))).sort();
      return hits.length ? hits : [here(a)];
    };
    const many = () => args.flatMap(expand);

    const owned = (list, label, fn) => list.forEach((x) => { files[x] = { ...files[x], ...fn(files[x]) }; res.labels[x] = label; });

    if (cmd === 'echo' && (raw.includes('>') || raw.includes('>>'))) {
      const at = raw.findIndex((t) => t === '>' || t === '>>');
      const p = here(raw[at + 1]);
      const line = `${unquote(raw.slice(1, at).join(' '))}\n`;
      const old = files[p] && !files[p].dir ? files[p] : null;
      files[p] = raw[at] === '>>' && old ? { ...old, content: old.content + line } : { ...(old || fileNode('')), content: line };
    } else if (item.put != null && (raw.includes('>') || raw.includes('>>'))) {
      // 其他命令的输出导向文件：写进去的内容由 put 提供
      const at = raw.findIndex((t) => t === '>' || t === '>>');
      const p = here(raw[at + 1]);
      raw.slice(1, at).filter((t) => !t.startsWith('-') && !/^['"]/.test(t)).map(here).forEach((x) => { if (files[x] && x !== p) res.labels[x] = '读取'; });
      const line = `${item.put}\n`;
      const old = files[p] && !files[p].dir ? files[p] : null;
      files[p] = raw[at] === '>>' && old ? { ...old, content: old.content + line } : { ...(old || fileNode('')), content: line };
    } else if (cmd === 'touch') {
      args.map(here).forEach((p) => { if (!files[p]) files[p] = fileNode(''); });
    } else if (cmd === 'mkdir') {
      args.map(here).forEach((p) => (has('p') ? prefixes(p) : [p]).forEach((x) => { if (!files[x]) files[x] = dirNode(); }));
    } else if (cmd === 'chown') {
      const [owner, group] = args[0].split(':');
      const p = here(args[1]);
      owned(has('R') ? subtree(p) : [p], '换拥有者', () => ({ owner, group: group || owner }));
    } else if (cmd === 'chmod') {
      const p = here(args[1]);
      owned(has('R') ? subtree(p) : [p], '改权限', (n) => ({ mode: modeOf(args[0], n.mode) }));
    } else if (cmd.startsWith('./') || cmd.startsWith('/')) {
      const p = here(cmd);
      res.labels[p] = item.err ? '被拒绝' : '运行';
      if (item.err) res.shake = true;
    } else if (cmd === 'cp' || cmd === 'mv') {
      const src = here(args[0]);
      let dst = here(args[1]);
      if ((files[dst] && files[dst].dir) || args[1].endsWith('/')) dst = dst === '/' ? `/${base(src)}` : `${dst}/${base(src)}`;
      const list = subtree(src);
      const moved = list.map((x) => [x, dst + x.slice(src.length), files[x]]);
      if (cmd === 'mv') {
        list.forEach((x) => { delete files[x]; res.moveFrom.add(x); });
      } else {
        res.labels[src] = '来源';
      }
      moved.forEach(([was, to, v]) => {
        files[to] = v;
        res.from[to] = was;
        if (cmd === 'mv') res.moveTo.add(to);
      });
    } else if (cmd === 'rm') {
      many().forEach((p) => subtree(p).forEach((x) => delete files[x]));
    } else if (cmd === 'tar') {
      // -c 创建：第一个参数是压缩包，后面是要装进去的东西；-t 只看清单
      const box = here(args[0]);
      if (has('c')) {
        args.slice(1).flatMap(expand).forEach((p) => { res.labels[p] = '装箱'; });
        files[box] = fileNode(null); // 压缩后的内容看不懂，不显示大小
        res.labels[box] = '新的压缩包';
      } else {
        res.labels[box] = has('t') ? '看清单' : '读取';
      }
    } else if (cmd === 'tree') {
      const dir = here(args[0] || '.');
      subtree(dir).filter((x) => x !== dir && !base(x).startsWith('.')).forEach((x) => { res.labels[x] = '列出'; });
    } else if (cmd === 'rmdir') {
      const p = here(args[0]);
      const kids = kidsOf(p);
      if (kids.length) {
        res.shake = true;
        res.labels[p] = '不是空的';
        kids.forEach((k) => { res.labels[k] = '还在里面'; });
      } else {
        delete files[p];
      }
    } else if (cmd === 'cat' || cmd === 'head' || cmd === 'tail') {
      res.labels[here(args[args.length - 1])] = '读取';
    } else if (cmd === 'diff') {
      args.forEach((a) => { res.labels[here(a)] = '比较'; });
    } else if (cmd === 'cd') {
      res.cwd = here(args[0] || '~');
    } else if (cmd === 'pwd') {
      prefixes(prev.cwd).forEach((p) => { res.labels[p] = '路径'; });
    } else if (cmd === 'ls') {
      const dir = here(args[0] || '.');
      const all = has('a');
      if (has('d') || (files[dir] && !files[dir].dir)) {
        res.labels[dir] = '列出';
        return res;
      }
      const visit = (d) => kidsOf(d).forEach((k) => {
        const hide = base(k).startsWith('.') && !all;
        res.labels[k] = hide ? '略过' : '列出';
        if (has('R') && files[k].dir) visit(k);
      });
      visit(dir);
      if (!kidsOf(dir).length) res.labels[dir] = '空的';
      if (!has('l') && !has('R') && item.out !== undefined) {
        const want = item.out.trim().split(/\s+/).filter((x) => x && x !== '.' && x !== '..').sort().join(' ');
        const got = kidsOf(dir).map(base).filter((n) => all || !n.startsWith('.')).sort().join(' ');
        if (want !== got) console.warn('仿真结果和实际输出不同：', item.cmd, { want, got });
      }
    }
    return res;
  }

  // 终端机上色：命令、选项、其他
  function colored(line) {
    return line.split(/(\s+)/).map((t, i) => {
      if (/^\s*$/.test(t)) return t;
      if (i === 0) return `<span class="c-cmd">${esc(t)}</span>`;
      if (t.startsWith('-')) return `<span class="c-opt">${esc(t)}</span>`;
      if (t === '>' || t === '>>') return `<span class="c-red">${esc(t)}</span>`;
      return esc(t);
    }).join('');
  }

  // Python 代码上色：函数名、文本和数字、等号
  const pyColored = (line) => line.replace(/("[^"]*"?|'[^']*'?)|(\b\d+(?:\.\d*)?)|([A-Za-z_]\w*)(?=\()|(=)|[^"'\w=]+|\w+/g,
    (m, str, num, fn, eq) => (str || num ? `<span class="c-opt">${esc(m)}</span>` : fn ? `<span class="c-cmd">${esc(m)}</span>` : eq ? `<span class="c-red">${esc(m)}</span>` : esc(m)));
  const paint = (line, prompt) => (prompt === '>>> ' ? pyColored(line) : colored(line));
  const langOf = (prompt) => (prompt === '>>> ' ? ' data-lang="py"' : '');
  const TYPE = { int: 'int 整数', float: 'float 小数', str: 'str 文本', NoneType: 'None' };

  const contentHTML = (t) => {
    if (t === '') return '<span class="ct-nil">（空文件）</span>';
    const lines = t.split('\n');
    return lines.map((ln, i) => (i < lines.length - 1 ? `${esc(ln)}<span class="nl">↵</span>` : esc(ln)))
      .filter((x, i) => !(i === lines.length - 1 && x === '')).join('\n');
  };

  // 像 ls -l 一样显示「类型+权限 拥有者 用户组」，和上一步不同的字符会亮起来
  function permHTML(was, now) {
    // 改变的字符：旧的翻走，新的翻出来
    const flip = (a, b, i) => `<b data-was="${esc(a)}" style="--i:${i}"><i>${esc(b)}</i></b>`;
    const mark = (a, b) => Array.from(b).map((ch, i) => (ch !== a[i] ? flip(a[i], ch, i) : esc(ch))).join('');
    const type = now.dir ? 'd' : '-';
    const ow = (a, b, i) => (a === b ? esc(b) : flip(a, b, i));
    return `<span class="fs-perm"><span class="pm">${type}${mark(was.mode, now.mode)}</span> ${ow(was.owner, now.owner, 0)} ${ow(was.group, now.group, 2)}</span>`;
  }

  class Run {
    constructor(scene) {
      this.scene = scene;
      this.steps = scene.commands;
      this.last = this.steps.length;
      this.pos = 0; // 0 是起始状态，1 是第一步
      this.token = 0;
      this.playing = false;
      this.maxH = 0;

      this.states = [initial(scene)];
      this.steps.forEach((s, i) => this.states.push(apply(this.states[i], s)));

      const stopGo = (p, animate) => { this.stop(); this.go(p, animate); };

      this.term = h('div', { class: 'run-term' });
      this.panel = h('div', { class: 'run-panel' });
      this.body = h('div', { class: 'run-body' }, this.term, this.panel);
      this.note = h('div', { class: 'run-note', 'aria-live': 'polite' });

      this.segs = [0, ...this.steps.map((_, i) => i + 1)].map((p) => {
        const fill = h('b');
        const bad = p > 0 && this.steps[p - 1].err;
        const btn = h('button', {
          class: `seg${bad ? ' bad' : ''}`, type: 'button', 'aria-label': p ? `第 ${p} 步` : '起始状态',
          onclick: () => stopGo(p, p !== 0),
        }, h('i', {}, fill));
        btn.bar = btn.firstChild;
        return btn;
      });
      const ctl = (label, name, fn, extra) =>
        h('button', { type: 'button', class: `ctl elastic ${extra || ''}`, 'aria-label': label, html: icon(name), onclick: fn });
      this.btnPrev = ctl('上一步', 'stepBack', () => stopGo(this.pos - 1, false));
      this.btnPlay = ctl('播放', 'play', () => this.toggle(), 'primary');
      this.btnNext = ctl('下一步', 'stepNext', () => stopGo(this.pos + 1, true));
      this.btnRestart = ctl('回到起点', 'replay', () => stopGo(0, false), 'restart');
      this.count = h('span', { class: 'bar-count' });
      this.btnCmp = ctl('对照上一步', 'eye', () => this.compare(!this.cmp), 'cmp');
      const bar = h('div', { class: 'bar' }, this.btnPrev, this.btnPlay, this.btnNext, h('div', { class: 'segs' }, this.segs), this.count, this.btnCmp, this.btnRestart);

      this.el = h('section', { class: 'run cell reveal lit', style: '--span:12', tabindex: '0', 'aria-label': `动画演示：${scene.title}` },
        h('header', { class: 'run-head' }, tag('动画演示', 'film'), h('h3', { html: rich(scene.title) }), h('span', { class: 'run-hint', html: icon('search') }, '光标移到命令上看解剖，按 B 对照上一步')),
        this.body,
        this.note,
        bar);

      this.el.addEventListener('keydown', (e) => {
        if (e.target.closest('button')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); stopGo(this.pos + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); stopGo(this.pos - 1, false); }
        if (e.key === ' ') { e.preventDefault(); this.toggle(); }
        if ((e.key === 'b' || e.key === 'B') && !this.btnCmp.disabled) { e.preventDefault(); this.compare(!this.cmp); }
      });
      this.onVisible = () => { if (document.hidden) this.stop(); };
      document.addEventListener('visibilitychange', this.onVisible);
      this.io = new IntersectionObserver(([e]) => { if (!e.isIntersecting) this.stop(); }, { threshold: 0.1 });
      this.io.observe(this.el);
      this.onResize = () => { this.maxH = 0; this.body.style.minHeight = ''; this.settle(); };
      addEventListener('resize', this.onResize);

      this.render(false);
    }

    // 版面只长不缩，播放时画面不会跳
    settle() {
      this.body.style.minHeight = '';
      const now = this.body.offsetHeight;
      if (now > this.maxH) this.maxH = now;
      this.body.style.minHeight = `${this.maxH}px`;
    }

    // 画面组件 -----------------------------------------------------------------
    termLine(st, prompt, cls) {
      return `<div class="ln cmd-line ${cls || ''}" data-cmd="${esc(st.cmd)}"${langOf(prompt)}><span class="ps">${esc(prompt)}</span>${paint(st.cmd, prompt)}</div>`
        + (st.out ? `<div class="ln out ${cls || ''} ${st.err ? 'err' : ''}">${esc(st.out)}</div>` : '');
    }

    history(upto) {
      let out = '';
      for (let i = Math.max(1, upto - 5); i < upto; i++) {
        const st = this.steps[i - 1];
        if (st.cmd) out += this.termLine(st, promptOf(this.states[i - 1]), 'hist');
      }
      return out;
    }

    drawInfo(info) {
      const rows = (info.rows || []).map((r, i) => {
        const em = String(r[1]).startsWith('!');
        const v = em ? String(r[1]).slice(1) : r[1];
        return `<div class="ic-row" style="animation-delay:${i * 60}ms"><span class="k">${esc(r[0])}</span><span class="v ${em ? 'em' : ''}">${esc(v)}${r[2] ? `<small>${esc(r[2])}</small>` : ''}</span></div>`;
      }).join('');
      this.panel.className = 'run-panel';
      this.panel.innerHTML = `<div class="ic-h">${icon(info.icon || 'book')}${esc(info.title || '')}</div>${info.bytes ? this.bytesHTML(info.bytes) : ''}<div class="ic-grid">${rows}</div>`;
    }

    // 把文件内容一个字节一格排出来，亮起被取到的部分
    bytesHTML({ text, pick }) {
      const [from, to] = pick;
      let i = 0;
      const lines = text.split(/(?<=\n)/).map((line) => {
        const cells = Array.from(line).map((ch) => {
          const on = i >= from && i < to;
          const delay = on ? (i - from) * 24 : 0;
          i += 1;
          const shown = ch === '\n' ? '↵' : ch === ' ' ? '␠' : esc(ch);
          return `<span class="byte${on ? ' on' : ''}${ch === '\n' || ch === ' ' ? ' mark' : ''}" style="animation-delay:${delay}ms">${shown}</span>`;
        }).join('');
        return `<div class="byte-line">${cells}</div>`;
      }).join('');
      return `<div class="bytes">${lines}</div>`;
    }

    // 在 Python 里（或刚离开）画名字表，其他时候画文件树
    drawState(after, before, marks) {
      if (after.py || before.py) this.drawVars(after, before, marks);
      else this.drawTree(after, before, marks);
    }

    drawVars(after, before, marks) {
      const ev = marks && marks.ev;
      const names = [...new Set([...Object.keys(before.vars), ...Object.keys(after.vars)])];
      const rows = names.map((n, i) => {
        const was = before.vars[n];
        const now = after.vars[n];
        let cls = '';
        let bd = '';
        if (marks && !was) { cls = 'added'; bd = '新名字'; }
        else if (marks && !now) { cls = 'gone'; bd = '清掉'; }
        else if (marks && was !== now) { cls = 'mod'; bd = was.t === now.t && was.v === now.v ? '重新挂上，值一样' : '换了值'; }
        else if (marks && ev && ev.reads && ev.reads.has(n)) { cls = 'hl'; bd = '读取'; }
        const v = now || was;
        const twins = now ? names.filter((o) => o !== n && after.vars[o] && after.vars[o].id === now.id) : [];
        return `<div class="fs-row py-var ${cls}" style="animation-delay:${i * 16}ms">${icon('tag')}<span class="nm">${esc(n)}</span><span class="py-arrow">→</span><span class="py-val">${esc(KM.py.repr(v))}</span><span class="py-type">${TYPE[v.t] || v.t}</span>${bd ? `<span class="bd">${esc(bd)}</span>` : ''}${twins.length ? `<span class="py-twin">和 ${esc(twins.join('、'))} 挂在同一个值上</span>` : ''}</div>`;
      }).join('');
      this.panel.className = 'run-panel py-panel';
      this.panel.innerHTML = `${ev ? this.evHTML(ev) : ''}<div class="py-h">${icon('tag')}Python 记住的名字</div>${rows || '<div class="py-empty">还没有任何名字</div>'}`;
    }

    // 名字表上方：这一行做了什么
    evHTML(ev) {
      const code = (x) => `<code>${esc(x)}</code>`;
      let big = '';
      let small = '';
      if (ev.kind === 'enter') { big = '进入 Python 交互模式'; small = '提示字符变成 >>>，名字表从空的开始。'; }
      else if (ev.kind === 'exit') { big = '离开 Python，回到 Shell'; small = '刚刚记住的名字全部清掉。'; }
      else if (ev.kind === 'error') { big = esc(ev.error); small = '这一行没有运行成功，名字表不变。'; }
      else if (ev.kind === 'assign') {
        big = `${code(ev.name)} → ${code(KM.py.repr(ev.value))}`;
        small = ev.alias ? `没有复制出新的值，只是在 ${esc(ev.alias)} 挂着的那个值上，多挂一个名牌。`
          : ev.asked.length ? '先印出问题、等你输入，再把你打的字（文本）挂上名牌。'
            : '右边先算出来，再挂上名牌。画面上不显示任何东西。';
      } else if (ev.printed.length) { big = `印出 ${code(ev.printed.join(' / '))}`; small = 'print 印出来的文本不带引号。'; }
      else if (ev.echo) {
        big = `显示 ${code(ev.echo)}`;
        small = /^[A-Za-z_]\w*$/.test(ev.line) ? '打名字，就显示它目前挂着的值。文本会带引号。' : '交互模式会把算出的结果直接显示出来，但没有存起来。';
      }
      return `<div class="py-ev"><small>这一行</small><b>${big}</b>${small ? `<span>${small}</span>` : ''}</div>`;
    }

    drawTree(after, before, marks) {
      const root = this.scene.root;
      const inScope = (p) => under(p, root);
      const paths = [...new Set([...Object.keys(before.files), ...Object.keys(after.files)])].filter(inScope);
      const segs = (x) => x.split('/').filter(Boolean);
      paths.sort((a, b) => {
        const A = segs(a);
        const B = segs(b);
        for (let i = 0; i < Math.min(A.length, B.length); i++) {
          if (A[i] !== B[i]) return A[i] < B[i] ? -1 : 1;
        }
        return A.length - B.length;
      });
      const rootDepth = segs(root).length;
      const rows = paths.map((p, i) => {
        const inB = p in before.files;
        const inA = p in after.files;
        const node = after.files[p] || before.files[p];
        const name = base(p);
        let cls = '';
        let bd = '';
        const was = before.files[p];
        if (marks && !inB) { cls = marks.moveTo.has(p) ? 'moved' : 'added'; bd = marks.moveTo.has(p) ? '移入' : '添加'; }
        else if (marks && !inA) { cls = 'gone'; bd = marks.moveFrom.has(p) ? '移走' : '删除'; }
        else if (marks && marks.edited === p) { cls = 'mod'; bd = '编辑器存档'; }
        else if (marks && !node.dir && was.content !== node.content) {
          cls = 'mod';
          bd = was.content && node.content.startsWith(was.content) ? '接在后面' : '覆写';
        }
        else if (marks && marks.labels[p]) {
          const l = marks.labels[p];
          cls = l === '略过' ? 'skip' : l === '换拥有者' || l === '改权限' ? 'mod' : l === '被拒绝' ? 'deny' : 'hl';
          bd = l;
        }
        const isCwd = node.dir && p === after.cwd;
        if (isCwd) { cls += ' cwd'; if (!bd) bd = '目前位置'; }
        const hidden = name.startsWith('.');
        const ic = node.dir ? 'folder' : 'file';
        const shown = p === '/' ? '/' : node.dir ? `${name}/` : name;
        const size = !node.dir && typeof node.content === 'string' ? `<span class="fs-size">${node.content.length} B</span>` : '';
        const content = !node.dir && typeof node.content === 'string' ? `<div class="fs-ct">${contentHTML(node.content)}</div>` : '';
        const depth = segs(p).length - rootDepth;
        const perm = this.scene.perms && p !== root ? permHTML(was && inA ? was : node, node) : '';
        return `<div class="fs-row ${cls} ${node.dir ? 'dir' : ''} ${hidden ? 'hid' : ''}" data-p="${esc(p)}" style="padding-left:${8 + depth * 18}px;animation-delay:${i * 16}ms">${icon(ic)}<span class="nm">${esc(shown)}</span>${perm}${size}${bd ? `<span class="bd">${esc(bd)}</span>` : ''}${content}</div>`;
      }).join('');
      this.panel.className = `run-panel${marks && marks.shake ? ' shake' : ''}`;
      this.panel.innerHTML = rows;
      if (marks && this.live) this.slide(marks.from);
    }

    // 搬移和复制：新的那一列从来源的位置滑过去
    slide(from) {
      const rowOf = (p) => [...this.panel.children].find((r) => r.dataset.p === p);
      Object.entries(from).forEach(([to, was]) => {
        const a = rowOf(was);
        const b = rowOf(to);
        if (!a || !b) return;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        b.classList.add('fly');
        b.animate(
          [{ transform: `translate(${ra.left - rb.left}px, ${ra.top - rb.top}px)`, opacity: 0.55 }, { transform: 'none', opacity: 1 }],
          { duration: 680, easing: 'cubic-bezier(.3, 1.18, .4, 1)' },
        ).finished.then(() => b.classList.remove('fly'), () => {});
      });
    }

    // 对照：右边暂时换回「这一步之前」的样子
    compare(on) {
      this.stop();
      this.cmp = on;
      this.live = false;
      this.drawPanel(this.pos);
      this.paint();
    }

    drawPanel(p) {
      const st = p > 0 ? this.steps[p - 1] : null;
      if (st && st.info) this.drawInfo(st.info);
      else if (!st && this.scene.startInfo) this.drawInfo(this.scene.startInfo);
      else if (!st) this.drawState(this.states[0], this.states[0], null);
      else if (this.cmp) {
        this.drawState(this.states[p - 1], this.states[p - 1], null);
        this.panel.classList.add('ghost');
        this.panel.insertAdjacentHTML('afterbegin', `<div class="ghost-tag">${icon('eye')}这一步之前的样子</div>`);
      }
      else this.drawState(this.states[p], this.states[p - 1], this.states[p]);
      this.settle();
    }

    paint() {
      this.count.textContent = this.pos === 0 ? '起始' : `${this.pos} / ${this.last}`;
      this.segs.forEach((s, p) => s.classList.toggle('full', p <= this.pos));
      this.btnPrev.disabled = this.pos === 0;
      this.btnNext.disabled = this.pos === this.last;
      this.btnRestart.disabled = this.pos === 0;
      this.btnCmp.disabled = this.pos === 0 || Boolean(this.steps[this.pos - 1].info);
      this.btnCmp.classList.toggle('on', Boolean(this.cmp));
      this.btnCmp.setAttribute('aria-pressed', String(Boolean(this.cmp)));
      const atEnd = this.pos === this.last && !this.playing;
      const name = this.playing ? 'pause' : atEnd ? 'replay' : 'play';
      if (name !== this.playIcon) {
        this.playIcon = name;
        this.btnPlay.innerHTML = icon(name);
      }
      this.btnPlay.setAttribute('aria-label', this.playing ? '暂停' : atEnd ? '从头播放' : '播放');
    }

    async render(animate) {
      const my = ++this.token;
      const stale = () => my !== this.token;
      const p = this.pos;
      this.cmp = false;
      this.live = false;
      this.paint();
      const caret = '<span class="term-caret"></span>';
      if (p === 0) {
        this.term.innerHTML = `<div class="ln muted"># 按播放，或用左右键一步步看</div><div class="ln"><span class="ps">${esc(promptOf(this.states[0]))}</span>${caret}</div>`;
        this.note.className = 'run-note';
        this.note.innerHTML = `${icon('bulb')}<span>开始之前的状态。</span>`;
        this.drawPanel(0);
        return;
      }
      const st = this.steps[p - 1];
      this.note.className = `run-note${st.err ? ' err' : ''}`;
      this.note.innerHTML = `${icon('forward')}<span>${rich(st.note || '')}</span>`;
      const hist = this.history(p);
      const before = promptOf(this.states[p - 1]);
      const after = promptOf(this.states[p]);

      if (!st.cmd) {
        this.term.innerHTML = `${hist}<div class="ln"><span class="ps">${esc(after)}</span>${caret}</div>`;
        this.term.scrollTop = this.term.scrollHeight;
        this.drawPanel(p);
        return;
      }

      this.term.innerHTML = `${hist}<div class="ln cur cmd-line" data-cmd="${esc(st.cmd)}"${langOf(before)}><span class="ps">${esc(before)}</span><span class="typed"></span>${caret}</div>`;
      this.term.scrollTop = this.term.scrollHeight;
      const typed = this.term.querySelector('.typed');
      if (animate && !reduced()) {
        // 打字时右边维持「打之前」的样子
        if (!st.info) this.drawState(this.states[p - 1], this.states[p - 1], null);
        const step = Math.min(38, 700 / st.cmd.length);
        for (let i = 1; i <= st.cmd.length; i++) {
          typed.textContent = st.cmd.slice(0, i);
          await new Promise((r) => setTimeout(r, step / Run.rate));
          if (stale()) return;
        }
        await new Promise((r) => setTimeout(r, 180 / Run.rate));
        if (stale()) return;
      }
      typed.innerHTML = paint(st.cmd, before);
      this.term.querySelector('.ln.cur .term-caret')?.remove();
      if (st.out) this.term.insertAdjacentHTML('beforeend', `<div class="ln out ${st.err ? 'err' : ''}">${esc(st.out)}</div>`);
      this.term.insertAdjacentHTML('beforeend', `<div class="ln"><span class="ps">${esc(after)}</span>${caret}</div>`);
      this.term.scrollTop = this.term.scrollHeight;
      this.live = Boolean(animate) && !reduced();
      this.drawPanel(p);
      this.live = false;
      halo(this.segs[p].bar);
    }

    go(p, animate) {
      const next = Math.max(0, Math.min(this.last, p));
      this.pos = next;
      return this.render(animate);
    }

    toggle() {
      if (this.playing) this.stop(); else this.play();
    }

    async play() {
      const my = ++this.playToken || (this.playToken = 1);
      this.playing = true;
      if (this.pos === this.last) {
        await this.go(0, false);
        await new Promise((r) => setTimeout(r, 400 / Run.rate));
      }
      while (this.playing && my === this.playToken && this.pos < this.last) {
        await this.go(this.pos + 1, true);
        if (!this.playing || my !== this.playToken || this.pos >= this.last) break;
        const note = this.steps[this.pos - 1].note || '';
        await new Promise((r) => setTimeout(r, Math.max(2400, note.length * 70) / Run.rate));
      }
      if (my === this.playToken) this.stop();
    }

    stop() {
      this.playing = false;
      this.paint();
    }

    destroy() {
      this.token++;
      this.playing = false;
      this.io.disconnect();
      removeEventListener('resize', this.onResize);
      document.removeEventListener('visibilitychange', this.onVisible);
    }
  }

  Run.rate = 1;
  KM.Run = Run;
})();
