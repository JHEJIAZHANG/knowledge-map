// 全文搜索：以小节为单位创建索引，结果可以直接跳到该小节
//
// 比对规则，避免打一个字就跑出全部内容：
//   单一英文本母：列出开头相符的命令（打 t 会看到 tail、touch）
//   英文词：比对「词的开头」，所以搜 id 不会命中 uid
//   单一中文本或符号：只找标题和命令，不找内文
//   找不到时，3 个字母以上才退回任意位置比对（ami 找得到 whoami）
(function () {
  const KM = window.KnowledgeMap;
  const { h, icon } = KM.ui;
  const { topicOf, groupOf, byNewest, chapterUrl } = KM.store;

  const strip = (s) => String(s).replace(/\*\*|`/g, '');
  const norm = (s) => s.normalize('NFKC').toLowerCase();
  const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const isWord = (t) => /^[a-z0-9_.-]+$/.test(t);
  const isLetter = (t) => /^[a-z]$/.test(t);
  const MAX = 12;
  const PER_ARTICLE = 2;

  let index = null;

  function build() {
    index = [];
    for (const c of KM.chapters) {
      c.sections.forEach((s, si) => {
        const body = [];
        const code = [];
        const add = (t) => { if (t != null) [].concat(t).forEach((x) => body.push(strip(x))); };
        add(s.lead);
        for (const b of s.blocks) {
          add(b.title);
          add(b.text);
          (b.lines || []).forEach((l) => { code.push(l.cmd); if (l.out) code.push(l.out); });
          (b.items || []).forEach(add);
          if (b.type === 'run') {
            b.commands.forEach((x) => { if (x.cmd) code.push(x.cmd); if (x.out) code.push(x.out); add(x.note); });
          }
        }
        const heading = strip(s.title);
        const bodyText = body.join('　');
        const codeText = code.join('　');
        index.push({
          c, s, si, heading, bodyText, codeText,
          nHeading: norm(`${s.nav} ${heading}`),
          nCode: norm(codeText),
          nBody: norm(bodyText),
          nChapter: norm(`${topicOf(c).name} ${groupOf(c).name} ${strip(c.title)} ${strip(c.summary)}`),
        });
      });
    }
  }

  const startsWord = (t) => new RegExp(`(^|[^a-z0-9_])${escapeRe(t)}`);
  const wholeWord = (t) => new RegExp(`(^|[^a-z0-9_])${escapeRe(t)}($|[^a-z0-9_])`);

  function matches(doc, t, mode) {
    const single = Array.from(t).length === 1;
    if (single) {
      if (isWord(t)) return wholeWord(t).test(doc.nHeading) || wholeWord(t).test(doc.nCode);
      return doc.nHeading.includes(t) || doc.nCode.includes(t);
    }
    const fields = [doc.nHeading, doc.nCode, doc.nBody, doc.nChapter];
    if (mode === 'prefix' && isWord(t)) {
      const re = startsWord(t);
      return fields.some((f) => re.test(f));
    }
    return fields.some((f) => f.includes(t));
  }

  const occurrences = (hay, term) => hay.split(term).length - 1;

  function score(doc, term) {
    let v = 0;
    if (doc.nHeading.includes(term)) v += 12;
    if (doc.nCode.includes(term)) v += 8;
    if (doc.si === 0 && doc.nChapter.includes(term)) v += 6;
    v += Math.min(occurrences(doc.nBody, term), 5);
    if (isWord(term)) {
      const word = wholeWord(term);
      if (word.test(doc.nHeading)) v += 14;
      if (word.test(doc.nCode)) v += 8;
    }
    return v;
  }

  function run(terms, mode) {
    const rows = [];
    for (const doc of index) {
      if (!terms.every((t) => matches(doc, t, mode))) continue;
      const all = `${doc.nHeading} ${doc.nCode} ${doc.nBody} ${doc.nChapter}`;
      const phrase = terms.length > 1 && all.includes(terms.join(' ')) ? 20 : 0;
      rows.push({ doc, v: terms.reduce((n, t) => n + score(doc, t), phrase), terms, mode });
    }
    return rows.sort((a, b) => b.v - a.v || b.doc.c.date.localeCompare(a.doc.c.date));
  }

  // 同一篇文章最多列两个小节，结果才不会被同一篇占满
  function trim(rows) {
    const seen = new Map();
    return rows.filter((r) => {
      const n = (seen.get(r.doc.c) || 0) + 1;
      seen.set(r.doc.c, n);
      return n <= PER_ARTICLE;
    }).slice(0, MAX);
  }

  function query(q) {
    if (!index) build();
    const terms = norm(q).split(/\s+/).filter(Boolean);
    if (!terms.length) return { terms, rows: [] };

    // 只打一个字母：当成在找命令
    if (terms.length === 1 && isLetter(terms[0])) {
      const rows = Object.keys(KM.anatomy.DOC)
        .filter((cmd) => cmd.startsWith(terms[0]))
        .map((cmd) => run([cmd], 'prefix')[0])
        .filter(Boolean);
      return { terms, rows: rows.slice(0, MAX), short: !rows.length, commands: rows.length > 0 };
    }

    let rows = run(terms, 'prefix');
    if (!rows.length && terms.some((t) => t.length >= 3)) rows = run(terms, 'any');
    return { terms, rows: trim(rows) };
  }

  // 高亮：和比对规则一致，搜 id 时不会把 uid 的 id 标起来
  function matcher(terms, mode) {
    const parts = [...terms].sort((a, b) => b.length - a.length)
      .map((t) => (mode === 'prefix' && isWord(t) ? `(?<![a-z0-9_])${escapeRe(t)}` : escapeRe(t)));
    return new RegExp(`(${parts.join('|')})`, 'i');
  }

  function highlighted(text, terms, mode) {
    if (!terms.length) return [text];
    const re = new RegExp(matcher(terms, mode).source, 'gi');
    return text.split(re).map((part, i) => (i % 2 ? h('mark', {}, part) : part)).filter((p) => p !== '');
  }

  function snippet(doc, terms, mode) {
    const re = matcher(terms, mode);
    for (const text of [doc.bodyText, doc.codeText]) {
      const pos = text.search(re);
      if (pos >= 0) {
        const start = Math.max(0, pos - 22);
        return (start ? '…' : '') + text.slice(start, start + 84) + (start + 84 < text.length ? '…' : '');
      }
    }
    return doc.bodyText.slice(0, 84);
  }

  // 画面 --------------------------------------------------------------------
  let active = -1;
  let options = [];

  const input = h('input', {
    class: 'search-input', type: 'search', placeholder: '搜索标题、命令、名词…', 'aria-label': '搜索全部文章',
    role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'search-list', autocomplete: 'off', spellcheck: 'false',
  });
  const list = h('ul', { class: 'search-list', id: 'search-list', role: 'listbox', 'aria-label': '搜索结果' });
  const dialog = h('dialog', { class: 'search-dialog glass', 'aria-label': '搜索' },
    h('div', { class: 'search-head' },
      h('span', { html: icon('search') }),
      input,
      h('button', { class: 'search-esc', type: 'button', onclick: () => dialog.close() }, 'esc')),
    list);

  function setActive(n) {
    if (options[active]) options[active].el.classList.remove('on');
    active = n;
    const o = options[n];
    if (!o) { input.removeAttribute('aria-activedescendant'); return; }
    o.el.classList.add('on');
    input.setAttribute('aria-activedescendant', o.el.id);
    o.el.scrollIntoView({ block: 'nearest' });
  }

  function go(url) {
    dialog.close();
    KM.navigate(url);
  }

  function option(i, url, title, sub, metaText) {
    const el = h('li', { class: 'result', id: `result-${i}`, role: 'option', onclick: () => go(url) },
      h('div', { class: 'result-title' }, title),
      sub ? h('div', { class: 'result-sub' }, sub) : null,
      h('div', { class: 'result-meta' }, metaText));
    el.addEventListener('pointermove', () => { if (active !== i) setActive(i); });
    options.push({ el, url });
    return el;
  }

  function paint() {
    const q = input.value;
    options = [];
    active = -1;
    const res = query(q);
    const meta = (c) => `${groupOf(c).name}・${strip(c.title)}・${c.date}`;
    const label = (t) => h('li', { class: 'search-label', role: 'presentation' }, t);

    if (!res.terms.length) {
      const recent = byNewest(KM.chapters).slice(0, 5);
      list.replaceChildren(
        ...(recent.length ? [label('最近添加')] : []),
        ...recent.map((c, i) => option(i, chapterUrl(c), strip(c.title), null, `${groupOf(c).name}・${c.date}`)));
    } else if (res.short) {
      list.replaceChildren(h('li', { class: 'search-empty', role: 'presentation' }, '没有这个字母开头的命令，再多打几个字试试。'));
    } else if (!res.rows.length) {
      list.replaceChildren(h('li', { class: 'search-empty', role: 'presentation' }, `找不到「${q.trim()}」，换个关键字试试。`));
    } else {
      list.replaceChildren(
        ...(res.commands ? [label(`${res.terms[0]} 开头的命令`)] : []),
        ...res.rows.map((r, i) => option(i, chapterUrl(r.doc.c, r.doc.s.nav), highlighted(r.doc.heading, r.terms, r.mode), highlighted(snippet(r.doc, r.terms, r.mode), r.terms, r.mode), meta(r.doc.c))));
    }
    list.scrollTop = 0;
    setActive(options.length ? 0 : -1);
  }

  input.addEventListener('input', paint);
  input.addEventListener('keydown', (e) => {
    if (e.isComposing) return; // 中文选字时的 Enter 和方向键不算
    if (e.key === 'ArrowDown' && options.length) { setActive((active + 1) % options.length); e.preventDefault(); }
    if (e.key === 'ArrowUp' && options.length) { setActive((active - 1 + options.length) % options.length); e.preventDefault(); }
    if (e.key === 'Enter' && options[active]) { go(options[active].url); e.preventDefault(); }
  });
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  document.body.append(dialog);

  function open() {
    if (dialog.open) return;
    input.value = '';
    paint();
    dialog.showModal();
    input.focus();
  }

  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dialog.open) dialog.close(); else open();
    }
  });

  KM.search = { open, query };
})();
