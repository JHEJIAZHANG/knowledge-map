// 额外页面：口诀总表、命令速查，以及文章最后的小测验
(function () {
  const KM = window.KnowledgeMap;
  const { chapters } = KM;
  const { h, rich, icon, tag } = KM.ui;
  const { chapterUrl, numberIn, pad } = KM.store;

  const plain = (s) => s.replace(/\*\*|`/g, '');
  const hero = (title, sub, ...more) => h('header', { class: 'hero' }, h('h1', {}, title), h('p', {}, sub), ...more);

  // 一篇文章里的短片：[{ id, nav }]
  const filmsOf = (c) => c.sections.flatMap((s) =>
    s.blocks.filter((b) => b.type === 'movie').map((b) => ({ id: b.film, nav: s.nav })));

  // 口诀总表 ---------------------------------------------------------------
  function memo() {
    document.title = '口诀总表｜知识地图';
    const groups = chapters.map((c) => ({ c, films: filmsOf(c).filter((f) => KM.Movie.memoOf(f.id)) })).filter((g) => g.films.length);
    const total = groups.reduce((n, g) => n + g.films.length, 0);
    const seen = groups.reduce((n, g) => n + g.films.filter((f) => KM.Movie.seen.has(f.id)).length, 0);

    const card = (c, f) => {
      const m = KM.Movie.memoOf(f.id);
      const watched = KM.Movie.seen.has(f.id);
      return h('a', {
        class: `memo-card lit elastic reveal${watched ? ' watched' : ''}`, href: chapterUrl(c, f.nav), draggable: 'false',
        onclick: () => { KM.pendingFilm = f.id; },
      },
        h('span', { class: 'memo-film', html: icon('film') }, KM.Movie.films[f.id].title),
        h('b', {}, m.big),
        h('span', { class: 'memo-small' }, m.small),
        watched ? tag('已看过', 'checkCircle', 'plain') : tag('还没看', 'play', 'plain'));
    };

    return [
      hero('口诀总表', '每一段短片最后的口诀都在这里。点一下，直接跳到那段短片。',
        h('div', { class: 'meta' }, tag(`共 ${total} 句`, 'bulb', 'plain'), tag(`已看过 ${seen} 段`, 'checkCircle', 'plain'))),
      ...groups.map(({ c, films }) => h('section', { class: 'group-sec' },
        h('div', { class: 'home-head' },
          h('h2', { class: 'with-i' }, h('span', { class: 'memo-n grad' }, pad(numberIn(c))), h('span', { html: rich(c.title) })),
          h('a', { class: 'clear elastic', href: chapterUrl(c), draggable: 'false' }, '看文章', h('span', { html: icon('forward') }))),
        h('div', { class: 'memo-grid' }, films.map((f) => card(c, f))))),
    ];
  }

  // 命令速查 ---------------------------------------------------------------
  // 找出每个命令第一次出现在哪一篇的哪一节
  function firstUse() {
    const map = new Map();
    chapters.forEach((c) => c.sections.forEach((s) => s.blocks.forEach((b) => {
      const lines = b.type === 'terminal' ? b.lines : b.type === 'run' ? b.commands : [];
      (lines || []).forEach((l) => {
        (l.cmd || '').split(/\s+/).slice(0, 2).forEach((word, i, all) => {
          if (i === 1 && all[0] !== 'sudo') return;
          if (KM.anatomy.DOC[word] && !map.has(word)) map.set(word, { c, nav: s.nav, eg: l.cmd });
        });
      });
    })));
    return map;
  }

  function cheat() {
    document.title = '命令速查｜知识地图';
    const DOC = KM.anatomy.DOC;
    const used = firstUse();
    const empty = h('div', { class: 'empty', hidden: '' }, '找不到符合的命令。');
    const cards = Object.entries(DOC).map(([name, d]) => {
      const u = used.get(name);
      const opts = Object.entries(d.opts || {});
      const el = h('article', { class: 'cheat-card card lit reveal' },
        h('header', {}, h('code', { class: 'cheat-name' }, name), h('p', {}, d.d)),
        opts.length ? h('dl', { class: 'cheat-opts' }, opts.map(([k, v]) => h('div', {}, h('dt', {}, `-${k}`), h('dd', {}, v)))) : null,
        u ? h('div', { class: 'cheat-eg' }, h('span', {}, '例子'), h('code', { 'data-cmd': u.eg }, u.eg)) : null,
        u ? h('a', { class: 'cheat-go elastic', href: chapterUrl(u.c, u.nav), draggable: 'false' },
          h('span', {}, `第一次出现：${plain(u.c.title)}`), h('span', { html: icon('forward') })) : null);
      el.dataset.text = [name, d.d, ...opts.flat(), u ? u.eg : ''].join(' ').toLowerCase();
      return el;
    });
    // Python 的内置函数：只列文章里出现过的，例子取第一次出现的那一行
    const pyUse = new Map();
    chapters.forEach((c) => c.sections.forEach((s) => s.blocks.forEach((b) => {
      (b.type === 'terminal' ? b.lines : b.type === 'run' ? b.commands : []).forEach((l) => {
        for (const [, fn] of (l.cmd || '').matchAll(/([A-Za-z_]\w*)\(/g)) {
          if (KM.anatomy.PYDOC[fn] && !pyUse.has(fn)) pyUse.set(fn, { c, nav: s.nav, eg: l.cmd });
        }
      });
    })));
    pyUse.forEach((u, name) => {
      const d = KM.anatomy.PYDOC[name];
      const el = h('article', { class: 'cheat-card card lit reveal' },
        h('header', {}, h('code', { class: 'cheat-name' }, `${name}()`), h('p', {}, `Python：${d.d}`)),
        h('div', { class: 'cheat-eg' }, h('span', {}, '例子'), h('code', { 'data-cmd': u.eg, 'data-lang': 'py' }, u.eg)),
        h('a', { class: 'cheat-go elastic', href: chapterUrl(u.c, u.nav), draggable: 'false' },
          h('span', {}, `第一次出现：${plain(u.c.title)}`), h('span', { html: icon('forward') })));
      el.dataset.text = [name, 'python', d.d, u.eg].join(' ').toLowerCase();
      cards.push(el);
    });
    const input = h('input', {
      class: 'cheat-input', type: 'search', placeholder: '输入命令或想做的事，例如 rm、复制、权限', 'aria-label': '筛选命令', autocomplete: 'off', spellcheck: 'false',
      oninput: () => {
        const q = input.value.trim().toLowerCase();
        let shown = 0;
        cards.forEach((el) => {
          el.hidden = Boolean(q) && !el.dataset.text.includes(q);
          if (!el.hidden) { shown++; el.classList.add('in'); }
        });
        empty.hidden = shown > 0;
      },
    });
    return [
      hero('命令速查', `学过的 ${cards.length} 个命令，各用一句话说明。光标移到例子上可以看解剖。`,
        h('label', { class: 'search-cta cheat-filter lit' }, h('span', { html: icon('search') }), input)),
      h('div', { class: 'cheat-grid' }, cards),
      empty,
    ];
  }

  // 小测验 -----------------------------------------------------------------
  const norm = (s) => String(s).trim().replace(/\s+/g, ' ').replace(/^\$\s*/, '');

  function quiz(chapter) {
    const list = chapter.quiz;
    if (!list || !list.length) return null;
    let right = 0;
    const score = h('span', { class: 'quiz-score' });
    const paintScore = () => {
      score.textContent = right === list.length ? `全部答对，共 ${list.length} 题` : `答对 ${right} / ${list.length}`;
      score.classList.toggle('all', right === list.length);
    };
    paintScore();

    const cards = list.map((item, n) => {
      const why = h('p', { class: 'quiz-why', hidden: '' });
      const card = h('div', { class: 'cell card reveal lit quiz-card', style: '--span:6' },
        tag(`第 ${n + 1} 题`, 'pencil', 'plain'),
        h('h3', { html: rich(item.q) }));
      const shake = (el) => {
        el.classList.remove('nope');
        void el.offsetWidth; // 重新触发动画
        el.classList.add('nope');
      };
      const finish = (ok) => {
        card.classList.add('done', ok ? 'ok' : 'shown');
        why.innerHTML = `${icon(ok ? 'checkCircle' : 'bulb')}<span>${rich(item.why)}</span>`;
        why.hidden = false;
        if (ok) { right++; paintScore(); }
      };

      if (item.choices) {
        const buttons = item.choices.map((text, i) => h('button', {
          class: 'quiz-choice elastic', type: 'button', html: rich(text),
          onclick: () => {
            if (card.classList.contains('done')) return;
            if (i === item.answer) {
              buttons[i].classList.add('right');
              buttons.forEach((b) => { b.disabled = true; });
              finish(!card.dataset.missed);
            } else {
              card.dataset.missed = '1';
              buttons[i].classList.add('wrong');
              buttons[i].disabled = true;
              shake(buttons[i]);
            }
          },
        }));
        card.append(h('div', { class: 'quiz-choices' }, buttons), why);
        return card;
      }

      const answers = [].concat(item.answer).map(norm);
      let misses = 0;
      const input = h('input', { class: 'quiz-input', type: 'text', placeholder: item.hint || '输入命令', 'aria-label': '你的答案', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      const reveal = h('button', {
        class: 'quiz-reveal elastic', type: 'button', hidden: '',
        onclick: () => {
          input.value = [].concat(item.answer)[0];
          input.readOnly = true;
          reveal.hidden = true;
          check.disabled = true;
          finish(false);
        },
      }, '看答案');
      const check = h('button', { class: 'quiz-check elastic', type: 'submit' }, '检查');
      const form = h('form', {
        class: 'quiz-form',
        onsubmit: (e) => {
          e.preventDefault();
          if (card.classList.contains('done') || !norm(input.value)) return;
          if (answers.includes(norm(input.value))) {
            input.readOnly = true;
            check.disabled = true;
            reveal.hidden = true;
            finish(true);
          } else {
            misses++;
            shake(form);
            if (misses >= 2) reveal.hidden = false;
          }
        },
      }, h('span', { class: 'quiz-ps' }, '$'), input, check);
      card.append(form, reveal, why);
      return card;
    });

    return h('section', { class: 'sec quiz', id: 'quiz' },
      h('header', { class: 'sec-head reveal' },
        h('div', { class: 'kicker' }, '小测验'),
        h('h2', {}, '考考自己'),
        h('p', {}, '不用翻回去看，凭印象回答。答错两次可以看答案。'),
        score),
      h('div', { class: 'bento' }, cards));
  }

  KM.pages = { memo, cheat, quiz, filmsOf };
})();
