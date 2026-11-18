// 加深印象用的内容：翻车现场、幕后视角、换个写法、情境故事、一张图总结
// 翻车现场、幕后、换个写法收在每节最后的「补充」分段标签里，点了才展开
// 数据写在 content/主题/deepen.js，格式说明见 content/topics.js
(function () {
  const KM = window.KnowledgeMap;
  const { chapters } = KM;
  const { h, rich, icon, tag, reduced } = KM.ui;

  const cell = (b, fallback, cls, ...kids) =>
    h('div', { class: `cell reveal lit ${cls}`, style: `--span:${b.span || fallback}` }, ...kids);
  const paragraphs = (t) => [].concat(t || []).map((p) => h('p', { html: rich(p) }));

  // 全角字算两格，打字动画才会刚好停在后缀
  const cols = (s) => Array.from(s).reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 2 : 1), 0);
  // py：Python 交互模式的代码，提示字符是 >>>
  const ps = (py) => h('span', { class: 'x-ps' }, py ? '>>>' : '$');
  const typed = (cmd, cls, py) => h('div', { class: `x-cmd ${cls || ''}` },
    ps(py),
    h('code', { class: 'x-typed', style: `--n:${cols(cmd)}` }, cmd));

  // 进到画面才开始播，旁边附一颗重播钮
  function stage(el) {
    const play = () => {
      el.classList.remove('play');
      void el.offsetWidth;
      el.classList.add('play');
    };
    if (reduced() || !('IntersectionObserver' in window)) {
      el.classList.add('play');
    } else {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { play(); io.disconnect(); }
      }, { threshold: 0.45 });
      io.observe(el);
    }
    return h('button', { class: 'x-replay elastic', type: 'button', 'aria-label': '重播', title: '重播', html: icon('replay'), onclick: play });
  }

  // 翻车现场 ---------------------------------------------------------------
  function oops(b) {
    const st = b.state;
    const chips = st ? [
      ...st.before.map((c) => h('span', { class: `x-chip${st.after.includes(c) ? '' : ' gone'}` }, c)),
      ...st.after.filter((c) => !st.before.includes(c)).map((c) => h('span', { class: 'x-chip born' }, c)),
    ] : null;
    const el = cell(b, 6, 'card x-card oops',
      h('div', { class: 'x-top' }, tag('补充・翻车现场', 'flame', 'warm')),
      h('h3', { html: rich(b.title) }),
      h('div', { class: 'x-stage' },
        typed(b.wrong, 'bad', b.py),
        st ? h('div', { class: 'x-state' }, h('small', {}, st.label), h('div', { class: 'x-chips' }, chips)) : null,
        b.out ? h('pre', { class: 'x-out' }, b.out) : null),
      h('div', { class: 'x-why' }, paragraphs(b.why)),
      b.right ? h('div', { class: 'x-fix' },
        h('small', {}, b.rightLabel || '正确做法'),
        h('div', { class: 'x-cmd good' }, ps(b.rightPy !== undefined ? b.rightPy : b.py), h('code', {}, b.right)),
        b.fix ? h('p', { html: rich(b.fix) }) : null) : null);
    el.querySelector('.x-top').append(stage(el));
    return el;
  }

  // 幕后视角 ---------------------------------------------------------------
  function behind(b) {
    let n = 0;
    const el = cell(b, 6, 'card x-card behind',
      h('div', { class: 'x-top' }, tag('补充・幕后', 'eye', 'warm')),
      h('h3', { html: rich(b.title) }),
      b.cmd ? h('div', { class: 'x-stage' }, typed(b.cmd, '', b.py)) : null,
      h('div', { class: 'x-places' }, (b.places || []).map((p) =>
        h('div', { class: 'x-place' },
          h('div', { class: 'x-place-head' }, h('code', {}, p.where), h('span', { html: rich(p.what) })),
          h('div', { class: 'x-rows' }, p.rows.map((r) => {
            const [kind, text] = Array.isArray(r) ? r : ['same', r];
            return h('div', { class: `x-row ${kind}`, style: kind === 'same' ? null : `--i:${n++}` },
              h('i', {}, ({ add: '+', del: '−', edit: '~', read: '›' })[kind] || ''), h('span', {}, text));
          }))))),
      h('div', { class: 'x-why' }, paragraphs(b.note)));
    el.querySelector('.x-top').append(stage(el));
    return el;
  }

  // 情境故事 ---------------------------------------------------------------
  function story(b) {
    return h('div', { class: 'cell story', style: '--span:12' },
      h('ol', { class: 'story-line' }, b.steps.map((s, i) =>
        h('li', { class: 'story-step reveal lit' },
          h('span', { class: 'story-n' }, String(i + 1)),
          h('div', { class: 'story-body' },
            h('p', { class: 'story-say', html: rich(s.say) }),
            s.cmd ? h('div', { class: 'x-cmd' }, ps(s.py), h('code', {}, s.cmd)) : null,
            s.note ? h('p', { class: 'story-note', html: rich(s.note) }) : null)))));
  }

  // 一张图总结 -------------------------------------------------------------
  function poster(b) {
    return cell(b, 12, 'poster',
      h('div', { class: 'poster-head' },
        h('span', { class: 'poster-tag', html: icon('sparkle') }, '一张图总结'),
        h('h3', { html: rich(b.title) })),
      h('div', { class: 'poster-lanes' }, b.lanes.map((lane) =>
        h('div', { class: `poster-lane${lane.flow ? ' flow' : ''}` },
          lane.name ? h('div', { class: 'poster-name', html: rich(lane.name) }) : null,
          h('div', { class: 'poster-nodes' }, lane.nodes.map((n) =>
            h('div', { class: 'poster-node' },
              h('code', {}, n.cmd),
              h('span', { class: 'poster-does', html: rich(n.does) }))))))),
      b.line ? h('p', { class: 'poster-line', html: rich(b.line) }) : null);
  }

  // 换个写法：同一件事的其他写法，原本的照样保留 --------------------------------
  function alt(b) {
    return cell(b, 12, 'card alt',
      h('div', { class: 'x-top' }, tag('补充・换个写法', 'sparkle', 'warm')),
      h('h3', { html: rich(b.title || '同一件事，还可以这样写') }),
      h('div', { class: 'alt-rows' }, b.rows.map((r) =>
        h('div', { class: 'alt-row' },
          h('div', { class: 'alt-from' }, h('small', {}, r.label || '笔记里的写法'), h('code', {}, r.from)),
          h('span', { class: 'alt-arrow', html: icon('arrow') }),
          h('ul', { class: 'alt-to' }, r.to.map(([cmd, note]) =>
            h('li', {}, h('code', {}, cmd), note ? h('span', { html: rich(note) }) : null)))))));
  }

  // 每节最后的补充：分段标签，一次只展开一张，再点一次收起 ----------------------------
  const KINDS = {
    oops: ['翻车现场', 'flame', oops],
    behind: ['幕后', 'eye', behind],
    alt: ['换个写法', 'sparkle', alt],
  };
  function more(list) {
    const panel = h('div', { class: 'more-panel', hidden: '' });
    const made = new Map();
    let open = -1;
    const tabs = list.map((b, i) => {
      const [label, ic] = KINDS[b.type];
      const same = list.filter((x) => x.type === b.type);
      const n = same.length > 1 ? ` ${same.indexOf(b) + 1}` : '';
      return h('button', {
        class: 'more-tab elastic', type: 'button', 'aria-expanded': 'false', title: (b.title || '').replace(/\*\*|`/g, ''),
        html: `${icon(ic)}<span>${label}${n}</span>`,
        onclick: () => pick(i),
      });
    });
    function pick(i) {
      if (open >= 0) { tabs[open].classList.remove('on'); tabs[open].setAttribute('aria-expanded', 'false'); }
      open = open === i ? -1 : i;
      panel.hidden = open < 0;
      if (open < 0) return;
      tabs[open].classList.add('on');
      tabs[open].setAttribute('aria-expanded', 'true');
      if (!made.has(open)) {
        const el = KINDS[list[open].type][2](list[open]);
        el.classList.add('in');
        made.set(open, el);
      }
      panel.replaceChildren(made.get(open));
    }
    return h('div', { class: 'cell more reveal lit', style: '--span:12' },
      h('div', { class: 'more-bar' },
        h('span', { class: 'more-label', html: `${icon('bulb')}<span>补充・想多看一点</span>` }),
        h('div', { class: 'more-tabs' }, tabs)),
      panel);
  }

  // 文章开头的情境故事：默认收起
  function storyFold(d) {
    return h('details', { class: 'story-fold lit reveal' },
      h('summary', {},
        h('span', { class: 'story-fold-icon', html: icon('sparkle') }),
        h('span', { class: 'story-fold-text' },
          h('small', {}, '补充・情境故事'),
          h('b', { html: rich(d.title) })),
        h('span', { class: 'story-fold-go', html: icon('forward') })),
      d.lead ? h('p', { class: 'story-fold-lead', html: rich(d.lead) }) : null,
      story(d));
  }

  KM.blocks = { oops, behind, story, poster, alt, more, storyFold };

  // 把 deepen 的数据并进文章 ---------------------------------------------------
  for (const [id, d] of KM.extras || []) {
    const c = chapters.find((x) => x.id === id);
    if (!c) { console.warn('deepen 找不到文章：', id); continue; }
    for (const [nav, blocks] of Object.entries(d.at || {})) {
      const s = c.sections.find((x) => x.nav === nav);
      if (!s) { console.warn(`deepen 找不到小节：${id} / ${nav}`); continue; }
      for (const b of blocks) {
        if (KINDS[b.type]) (s.more = s.more || []).push(b);
        else s.blocks.push(b);
      }
    }
    if (d.poster) {
      const last = c.sections[c.sections.length - 1];
      last.blocks.unshift({ type: 'poster', ...d.poster });
    }
    if (d.story) c.story = d.story;
  }
})();
