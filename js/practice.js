// 练习场：题目列表（#/practice）和作答页（#/p/题目 id）
//
// 作答页左边是题目，右边是模拟终端机（js/shell.js）。按「提交」用题目的 checks 判对错。
// 通过记录存在 km-practice，每题的终端机状态存在 km-sbx-题目 id。
(function () {
  const KM = window.KnowledgeMap;
  const { h, rich, icon, tag, memory } = KM.ui;
  const { chapterUrl } = KM.store;
  const problems = KM.problems || [];
  const LEVELS = { 1: { name: '简单', cls: 'lv-1' }, 2: { name: '中等', cls: 'lv-2' }, 3: { name: '困难', cls: 'lv-3' } };
  const topicOf = (p) => KM.topics.find((t) => t.id === p.topic);
  const numberOf = (p) => problems.indexOf(p) + 1;
  const urlOf = (p) => `#/p/${encodeURIComponent(p.id)}`;
  const record = () => memory.get('km-practice', {});
  const solved = (p) => Boolean(record()[p.id] && record()[p.id].solved);
  const tried = (p) => Boolean(record()[p.id]);
  const mark = (p, patch) => { const r = record(); r[p.id] = { ...(r[p.id] || {}), ...patch }; memory.set('km-practice', r); };
  const levelTag = (p) => h('span', { class: `lv ${LEVELS[p.level].cls}` }, LEVELS[p.level].name);

  // 题目用到的单元：从 uses 的文章找出来，去掉重复
  function unitsOf(p) {
    const seen = new Map();
    (p.uses || []).forEach((id) => {
      const c = KM.chapters.find((x) => x.id === id);
      if (!c) return;
      const t = topicOf(c);
      const g = t.groups.find((x) => x.id === c.group);
      seen.set(g.id, { t, g });
    });
    return [...seen.values()];
  }

  // 参考解答在加载时跑一次，没通过就在主控台警告
  let checked = false;
  function selfCheck() {
    if (checked) return;
    checked = true;
    problems.forEach((p) => {
      try {
        const { results } = KM.Shell.verify(p);
        const bad = results.filter((r) => !r.ok);
        if (bad.length) console.warn(`练习题的参考解答没有通过：${p.id}`, bad.map((r) => r.say));
      } catch (e) { console.warn(`练习题的参考解答跑不起来：${p.id}`, e); }
      (p.uses || []).forEach((id) => { if (!KM.chapters.some((c) => c.id === id)) console.warn(`练习题 ${p.id} 用到的文章不存在：${id}`); });
    });
  }

  // 题目列表 ---------------------------------------------------------------
  function list() {
    document.title = '练习场｜知识地图';
    setTimeout(selfCheck, 300);
    const total = problems.length;
    const done = problems.filter(solved).length;
    const byLevel = [1, 2, 3].map((lv) => {
      const all = problems.filter((p) => p.level === lv);
      return { lv, all: all.length, done: all.filter(solved).length };
    });
    const next = problems.find((p) => !solved(p));

    const ring = h('div', { class: 'px-ring', style: `--p:${total ? done / total : 0}`, 'aria-label': `已通过 ${done} 题，共 ${total} 题` },
      h('b', {}, String(done)), h('small', {}, `/ ${total}`));
    const stats = h('section', { class: 'px-stats card reveal' },
      ring,
      h('div', { class: 'px-levels' }, byLevel.map(({ lv, all, done: d }) => h('div', { class: `px-level ${LEVELS[lv].cls}` },
        h('span', {}, LEVELS[lv].name),
        h('b', {}, `${d}`, h('small', {}, ` / ${all}`)),
        h('i', { style: `--p:${all ? d / all : 0}` })))),
      next ? h('a', { class: 'px-next elastic', href: urlOf(next), draggable: 'false' },
        h('small', {}, done ? '下一题' : '从第一题开始'),
        h('b', {}, `${numberOf(next)}. ${next.title}`),
        h('span', { class: 'path-go', html: icon('arrow') }))
        : h('div', { class: 'px-next all-done' }, h('small', {}, '全部通过'), h('b', {}, '新的题目会跟着新文章一起加进来。')));

    // 筛选：主题、难度
    const topicIds = [...new Set(problems.map((p) => p.topic))];
    let onTopic = memory.get('km-px-topic', 'all');
    if (onTopic !== 'all' && !topicIds.includes(onTopic)) onTopic = 'all';
    let onLevel = 0;
    const body = h('div', { class: 'px-list card' });
    const topicTabs = [['all', '全部', 'list'], ...topicIds.map((id) => { const t = KM.topics.find((x) => x.id === id); return [id, t.name, t.icon || 'folder']; })]
      .map(([id, name, ic]) => h('button', {
        class: 'course-tab elastic', type: 'button', role: 'tab', 'data-id': id,
        html: `${icon(ic)}<span>${rich(name)}</span><small>${id === 'all' ? total : problems.filter((p) => p.topic === id).length}</small>`,
        onclick: () => { onTopic = id; memory.set('km-px-topic', id); paint(); },
      }));
    const levelChips = [0, 1, 2, 3].map((lv) => h('button', {
      class: `px-chip elastic ${lv ? LEVELS[lv].cls : ''}`, type: 'button', 'data-lv': lv,
      onclick: () => { onLevel = lv; paint(); },
    }, lv ? LEVELS[lv].name : '全部难度'));

    const row = (p) => h('a', { class: `px-row${solved(p) ? ' solved' : tried(p) ? ' tried' : ''}`, href: urlOf(p), draggable: 'false' },
      h('span', { class: 'px-state', html: solved(p) ? icon('check') : '', title: solved(p) ? '已通过' : tried(p) ? '做过，还没通过' : '还没做' }),
      h('span', { class: 'px-n' }, String(numberOf(p))),
      h('span', { class: 'px-title' },
        h('b', {}, p.title),
        h('span', { class: 'px-units' }, unitsOf(p).map(({ t, g }) => h('span', { class: `px-unit ${KM.store.hueOf(t, g)}` }, g.name)))),
      levelTag(p),
      h('span', { class: 'lesson-go', html: icon('forward') }));

    function paint() {
      topicTabs.forEach((b) => { const on = b.dataset.id === onTopic; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); });
      levelChips.forEach((b) => b.classList.toggle('on', +b.dataset.lv === onLevel));
      const shown = problems.filter((p) => (onTopic === 'all' || p.topic === onTopic) && (!onLevel || p.level === onLevel));
      body.replaceChildren(...(shown.length ? shown.map(row) : [h('div', { class: 'empty' }, '这个条件下没有题目。')]));
    }
    paint();

    return [
      h('header', { class: 'hero hero-home px-hero' },
        h('h1', {}, '练习', h('span', { class: 'grad' }, '场')),
        h('p', {}, '把学过的命令串起来解题。每一题都在网页里的模拟终端机作答，按「提交」自动检查。')),
      stats,
      h('section', { class: 'home-sec' },
        h('div', { class: 'home-head course-head' },
          h('h2', { class: 'with-i', html: `${icon('target')}<span>题目</span>` }),
          h('div', { class: 'course-tabs', role: 'tablist' }, topicTabs)),
        h('div', { class: 'px-chips' }, levelChips),
        body),
      h('p', { class: 'px-foot' }, '补充：终端机是模拟的，只认得学过的命令，输出照 LabEx 的格式写；遇到不支持的写法会用黄字说明。'),
    ];
  }

  // 作答页 -----------------------------------------------------------------
  let live = null;
  function page(p) {
    document.title = `${numberOf(p)}. ${p.title}｜练习场`;
    if (live) live.destroy();
    const sh = new KM.Shell(p.setup);
    const key = `km-sbx-${p.id}`;
    const saved = memory.get(key, null);
    let screen = [];
    if (saved && saved.state) {
      try { sh.load(saved.state); screen = saved.screen || []; } catch (e) { screen = []; }
    }

    // 左边：题目 --------------------------------------------------------------
    const reqs = p.checks.map((c) => h('li', { class: 'px-req' }, h('i', { html: icon('check') }), h('span', { html: rich(c.say) }), h('small', {})));
    const paintReqs = (results) => results.forEach((r, i) => {
      reqs[i].className = `px-req ${r.ok ? 'ok' : 'bad'}`;
      reqs[i].querySelector('small').textContent = !r.ok && r.got ? r.got : '';
    });
    let hintAt = 0;
    const hintList = h('ol', { class: 'px-hints' });
    const hintBtn = h('button', { class: 'px-btn soft elastic', type: 'button', html: icon('bulb') }, h('span'));
    const paintHint = () => {
      hintBtn.querySelector('span').textContent = hintAt >= p.hints.length ? '提示都打开了' : `看提示（${hintAt + 1}/${p.hints.length}）`;
      hintBtn.disabled = hintAt >= p.hints.length;
    };
    hintBtn.addEventListener('click', () => {
      if (hintAt >= p.hints.length) return;
      hintList.append(h('li', { class: 'in', html: rich(p.hints[hintAt]) }));
      hintAt += 1;
      paintHint();
    });
    paintHint();

    const answerBox = h('div', { class: 'px-answer', hidden: true },
      h('h3', {}, '参考解答'),
      h('pre', { class: 'px-code' }, p.answer.map((s) => (typeof s === 'string'
        ? h('div', {}, h('span', { class: 'ps' }, '$ '), s)
        : h('div', { class: 'px-edit' }, h('span', { class: 'px-edit-h' }, `# 用编辑器把 ${s.edit} 写成：`), s.text.replace(/\n$/, ''))))),
      h('ul', { class: 'px-why' }, p.why.map((w) => h('li', { html: rich(w) }))),
      h('p', { class: 'px-note' }, '参考解答不是唯一写法，只要检查都通过就算对。'));
    const answerBtn = h('button', {
      class: 'px-btn soft elastic', type: 'button', html: icon('eye'),
      onclick: () => {
        if (!solved(p) && !answerBtn.dataset.sure) {
          answerBtn.dataset.sure = '1';
          answerBtn.querySelector('span').textContent = '确定要看？再按一次';
          return;
        }
        showAnswer();
      },
    }, h('span', {}, '看参考解答'));
    const showAnswer = () => { answerBox.hidden = false; answerBtn.hidden = true; mark(p, { peeked: true }); };

    const units = unitsOf(p);
    const uses = (p.uses || []).map((id) => KM.chapters.find((c) => c.id === id)).filter(Boolean);
    const prev = problems[numberOf(p) - 2];
    const next = problems[numberOf(p)];
    const navLink = (x, dir) => (x ? h('a', { class: `px-nav ${dir} elastic`, href: urlOf(x), draggable: 'false', html: icon(dir === 'prev' ? 'back' : 'forward') },
      h('span', {}, h('small', {}, dir === 'prev' ? '上一题' : '下一题'), h('b', {}, `${numberOf(x)}. ${x.title}`))) : h('span'));

    const side = h('aside', { class: 'px-side' },
      h('div', { class: 'px-card card' },
        h('a', { class: 'px-back elastic', href: '#/practice', draggable: 'false', html: icon('back') }, '练习场'),
        h('div', { class: 'px-meta' },
          h('span', { class: 'px-num' }, `第 ${numberOf(p)} 题`),
          levelTag(p),
          units.map(({ t, g }) => h('span', { class: `px-unit ${KM.store.hueOf(t, g)}` }, g.name)),
          solved(p) ? tag('已通过', 'checkCircle', 'px-done') : null),
        h('h1', {}, p.title),
        h('div', { class: 'px-story' }, p.story.split('\n').map((l) => h('p', { html: rich(l) }))),
        h('h2', {}, '要求'),
        h('ul', { class: 'px-reqs' }, reqs),
        h('div', { class: 'px-tools' }, hintBtn, answerBtn),
        hintList,
        answerBox,
        uses.length ? h('div', { class: 'px-uses' }, h('h2', {}, '用到的文章'),
          uses.map((c) => h('a', { class: 'px-use elastic', href: chapterUrl(c), draggable: 'false', html: icon(KM.store.kindOf(c).icon) }, h('span', { html: rich(c.title) })))) : null),
      h('div', { class: 'px-navs' }, navLink(prev, 'prev'), navLink(next, 'next')));

    // 右边：终端机 ------------------------------------------------------------
    const out = h('div', { class: 'sx-out', 'aria-live': 'polite' });
    const ps = h('span', { class: 'sx-ps' });
    const field = h('input', { class: 'sx-in', type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': '输入命令' });
    const inputRow = h('label', { class: 'sx-line' }, ps, field);
    const scroller = h('div', { class: 'sx-screen' }, out, inputRow);
    const add = (t, cls) => {
      if (!t) return;
      screen.push([t, cls || '']);
      if (screen.length > 400) screen = screen.slice(-300);
      out.append(h('span', { class: cls || '' }, t));
    };
    const repaint = () => { out.replaceChildren(...screen.map(([t, cls]) => h('span', { class: cls }, t))); };
    const syncPrompt = () => {
      const r = sh.pending ? '' : sh.prompt();
      ps.textContent = r;
      field.classList.toggle('secret', Boolean(sh.pending && sh.pending.secret));
      scroller.scrollTop = scroller.scrollHeight;
    };
    const persist = () => memory.set(key, { state: sh.save(), screen: screen.slice(-300) });

    const status = h('div', { class: 'sx-status' });
    const files = h('div', { class: 'sx-files' });
    const editor = makeEditor(sh, (msg) => { add(`${msg}\n`, 'note'); persist(); paintFiles(); syncPrompt(); field.focus({ preventScroll: true }); });

    // 按 Enter：在等回答（密码、input()、rm -i）时不重印提示字符，回答由 Shell 自己印
    function run(text) {
      if (!sh.pending) add(`${ps.textContent}${text}\n`, 'cmd');
      const r = sh.input(text);
      if (r.clear) { screen = []; repaint(); }
      r.out.forEach((c) => add(c.t, c.err ? 'err' : c.note ? 'note' : ''));
      if (r.edit) editor.open(r.edit);
      mark(p, { tried: true });
      persist();
      paintFiles();
      syncPrompt();
    }
    // ↑↓ 历史（Shell 和 Python 各自的）
    let at = 0;
    const history = () => (sh.py ? sh.typed.filter((t) => t.startsWith('>>> ')).map((t) => t.slice(4)) : sh.typed.filter((t) => !t.startsWith('>>> ')));
    field.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      if (e.key === 'Enter') { e.preventDefault(); const t = field.value; field.value = ''; run(t); at = history().length; return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (sh.pending) return;
        e.preventDefault();
        const list = history();
        at = Math.max(0, Math.min(list.length, (at > list.length ? list.length : at) + (e.key === 'ArrowUp' ? -1 : 1)));
        field.value = list[at] || '';
        requestAnimationFrame(() => field.setSelectionRange(field.value.length, field.value.length));
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const c = sh.complete(field.value);
        if (!c) return;
        if (c.options) add(`${ps.textContent}${field.value}\n${c.options.join('  ')}\n`, 'dim');
        field.value = c.line;
        syncPrompt();
        return;
      }
      if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        add(`${ps.textContent}${field.value}^C\n`, 'cmd');
        field.value = '';
        sh.pending = null;
        syncPrompt();
        return;
      }
      if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); screen = []; repaint(); persist(); }
    });
    scroller.addEventListener('click', () => { if (!getSelection().toString()) field.focus({ preventScroll: true }); });

    // 文件面板：题目目录底下的东西，像 ls -l 一样列出来；点文件可以打开编辑器
    function paintFiles() {
      const root = sh.root;
      const rows = [];
      const walk = (dir, depth) => {
        sh.kids(dir).forEach((k) => {
          const n = sh.files[k];
          const name = k.split('/').pop();
          const isDir = n.dir;
          const row = h(isDir ? 'div' : 'button', {
            class: `sx-file${isDir ? ' dir' : ''}${name.startsWith('.') ? ' hid' : ''}${sh.cwd === k ? ' here' : ''}`,
            style: `--d:${depth}`, type: isDir ? null : 'button',
            title: isDir ? null : `用编辑器打开 ${name}`,
            onclick: isDir ? null : () => editor.open({ path: k, shown: k.slice(root.length + 1), as: 'labex' }),
          },
            h('span', { class: 'sx-f-name', html: icon(isDir ? 'folder' : 'file') }, h('span', {}, isDir ? `${name}/` : name)),
            h('span', { class: 'sx-f-perm' }, `${isDir ? 'd' : '-'}${n.mode}`),
            h('span', { class: 'sx-f-own' }, `${n.owner}:${n.group}`),
            h('span', { class: 'sx-f-size' }, isDir ? '' : n.archive ? '压缩包' : `${(n.content || '').length} B`));
          rows.push(row);
          if (isDir) walk(k, depth + 1);
        });
      };
      walk(root, 0);
      files.replaceChildren(
        h('div', { class: 'sx-files-h' }, h('span', { html: icon('folder') }, h('b', {}, root), sh.cwd !== root ? h('small', {}, `目前位置：${sh.cwd}`) : null)),
        rows.length ? h('div', { class: 'sx-files-list' }, rows) : h('div', { class: 'sx-files-empty' }, '（空的）'));
    }

    // 提交
    const submit = h('button', { class: 'px-submit elastic', type: 'button', html: icon('check') }, h('span', {}, '提交'));
    submit.addEventListener('click', () => {
      const results = KM.Shell.judge(sh, p.checks);
      paintReqs(results);
      const left = results.filter((r) => !r.ok).length;
      status.className = `sx-status ${left ? 'bad' : 'ok'}`;
      if (!left) {
        const first = !solved(p);
        mark(p, { solved: true, date: KM.store.dayKey(new Date()) });
        status.replaceChildren(h('span', { html: icon('checkCircle') }), h('b', {}, first ? '通过！全部要求都完成了。' : '通过！'),
          next ? h('a', { class: 'px-btn elastic', href: urlOf(next), draggable: 'false' }, '下一题', h('span', { html: icon('forward') })) : null);
        showAnswer();
        side.querySelector('.px-meta .px-done') || side.querySelector('.px-meta').append(tag('已通过', 'checkCircle', 'px-done'));
      } else {
        status.replaceChildren(h('span', { html: icon('close') }), h('b', {}, `还差 ${left} 项，看看左边打叉的要求。`));
        status.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 300 });
      }
      side.querySelector('.px-reqs').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    const reset = h('button', {
      class: 'sx-reset elastic', type: 'button', html: icon('replay'), title: '回到题目一开始的样子',
      onclick: () => {
        if (!reset.dataset.sure) { reset.dataset.sure = '1'; reset.querySelector('span').textContent = '确定重置？'; setTimeout(() => { delete reset.dataset.sure; reset.querySelector('span').textContent = '重置'; }, 2500); return; }
        delete reset.dataset.sure;
        reset.querySelector('span').textContent = '重置';
        sh.reset();
        screen = [];
        repaint();
        intro();
        reqs.forEach((r) => { r.className = 'px-req'; r.querySelector('small').textContent = ''; });
        status.className = 'sx-status';
        status.replaceChildren();
        persist();
        paintFiles();
        syncPrompt();
        field.focus({ preventScroll: true });
      },
    }, h('span', {}, '重置'));
    const intro = () => add('# 在这里输入命令，按 Enter 运行。↑↓ 翻历史，Tab 补全，nano 文件名 打开编辑器。\n', 'dim');

    const term = h('section', { class: 'sx-term' },
      h('header', { class: 'sx-bar' }, h('i'), h('i'), h('i'), h('span', {}, 'labex — zsh'), reset),
      scroller,
      editor.el);
    const main = h('div', { class: 'px-main' },
      term,
      h('div', { class: 'px-act' }, submit, status),
      files);

    if (!screen.length) intro(); else repaint();
    paintFiles();
    syncPrompt();
    setTimeout(() => { if (matchMedia('(min-width: 1000px)').matches) field.focus({ preventScroll: true }); scroller.scrollTop = scroller.scrollHeight; }, 60);
    if (solved(p)) { status.className = 'sx-status ok'; status.replaceChildren(h('span', { html: icon('checkCircle') }), h('b', {}, '这题已经通过了，可以再做一次。')); }

    live = { destroy() { live = null; } };
    return [h('div', { class: 'px-page' }, side, main)];
  }

  // 编辑器：盖在终端机上；保存时照打开时的身分检查权限
  function makeEditor(sh, done) {
    let cur = null;
    const title = h('b');
    const area = h('textarea', { class: 'ed-area', spellcheck: 'false', autocapitalize: 'off', 'aria-label': '文件内容' });
    const msg = h('span', { class: 'ed-msg' });
    const save = () => {
      const err = sh.saveFile(cur.path, area.value, cur.as);
      if (err) { msg.textContent = `存不进去：${err}`; return; }
      const shown = cur.shown;
      close();
      done(`（已保存 ${shown}）`);
    };
    const close = () => { el.hidden = true; cur = null; };
    const el = h('div', { class: 'ed', hidden: true, role: 'dialog', 'aria-label': '编辑器' },
      h('header', { class: 'ed-bar' }, h('span', { html: icon('pencil') }, title),
        msg,
        h('button', { class: 'ed-btn', type: 'button', onclick: () => { close(); done('（没有保存，关掉编辑器）'); } }, '关闭'),
        h('button', { class: 'ed-btn primary', type: 'button', onclick: save }, '保存')),
      area,
      h('footer', { class: 'ed-foot' }, '⌘S / Ctrl+S 保存，Esc 关闭。保存时最后会自动补一个换行，和 nano 一样。'));
    area.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); save(); }
      if (e.key === 'Escape') { e.preventDefault(); close(); done('（没有保存，关掉编辑器）'); }
      if (e.key === 'Tab') { e.preventDefault(); area.setRangeText('    ', area.selectionStart, area.selectionEnd, 'end'); }
    });
    return {
      el,
      open(target) {
        const n = sh.files[target.path];
        if (n && n.archive) { done(`（${target.shown} 是压缩包，不能用编辑器打开）`); return; }
        // 读不到就不能打开（例如别人的文件）
        const was = sh.sudo;
        sh.sudo = target.as === 'root';
        let text = '';
        try { text = n ? sh.read(target.path) : ''; } catch (e) { sh.sudo = was; done(`（打不开 ${target.shown}：${e.message}）`); return; }
        sh.sudo = was;
        cur = target;
        title.textContent = `${target.shown}${n ? '' : '（新文件）'}${target.as === 'root' ? '・root' : ''}`;
        msg.textContent = '';
        area.value = text.replace(/\n$/, '');
        el.hidden = false;
        area.focus();
      },
    };
  }

  KM.practice = { list, page, find: (id) => problems.find((p) => p.id === id), solvedCount: () => problems.filter(solved).length, total: () => problems.length };
})();
