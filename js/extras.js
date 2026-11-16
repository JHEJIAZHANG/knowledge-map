// 加深印象用的内容：翻车现场、幕后视角、情境故事、一张图总结，以及贯穿全站的大楼比喻
// 数据写在 content/主题/deepen.js，格式说明见 content/topics.js
(function () {
  const KM = window.KnowledgeMap;
  const { chapters } = KM;
  const { h, rich, icon, tag, reduced, ICONS } = KM.ui;
  const { chapterUrl, groupOf, topicOf } = KM.store;

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
              h('span', { class: 'poster-does', html: rich(n.does) }),
              n.as ? h('span', { class: 'poster-as', html: icon('building') }, n.as) : null)))))),
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

  KM.blocks = { oops, behind, story, poster, alt };

  // 大楼：每个分类各占一间，两间一层，一楼在下 ------------------------------------------
  const zones = KM.zones || [];
  const zoneOf = (c) => zones.find((z) => z.id === c.group);
  const NS = 'http://www.w3.org/2000/svg';
  const S = (tagName, attrs, ...kids) => {
    const el = document.createElementNS(NS, tagName);
    for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v);
    el.append(...kids.filter((x) => x != null));
    return el;
  };
  const glyph = (name, x, y, size) => {
    const g = S('svg', { class: 'bld-i', x, y, width: size, height: size, viewBox: '0 0 24 24' });
    g.innerHTML = ICONS[name] || '';
    return g;
  };

  // on：亮起的房间；pick：点房间时调用；mini：缩略图，不放文本
  function building({ on, pick, mini }) {
    // 三层的高度是基准，多一层就往下加 108
    const extra = (Math.max(3, Math.ceil(zones.length / 2)) - 3) * 108;
    const svg = S('svg', { class: `bld${mini ? ' mini' : ''}`, viewBox: `0 0 720 ${452 + extra}`, role: pick ? 'group' : 'img', 'aria-label': '大楼剖面图' });
    svg.append(
      S('path', { class: 'bld-roof', d: 'M52 96 L340 22 Q360 17 380 22 L668 96 Z' }),
      S('rect', { class: 'bld-body', x: 78, y: 88, width: 564, height: 344 + extra, rx: 20 }),
      S('path', { class: 'bld-ground', d: `M30 ${440 + extra} H690` }));
    zones.forEach((z, i) => {
      const col = i % 2;
      const floor = Math.floor(i / 2); // 0 是一楼
      const x = 94 + col * 270;
      const y = 320 + extra - floor * 108;
      const g = S('g', { class: `room${z.id === on ? ' on' : ''}`, transform: `translate(${x} ${y})` });
      g.append(S('rect', { width: 262, height: 96, rx: 16 }));
      if (mini) {
        g.append(glyph(z.icon, 107, 24, 48));
      } else {
        const name = S('text', { class: 'room-name', x: 66, y: 44 });
        name.textContent = z.name;
        const sub = S('text', { class: 'room-sub', x: 66, y: 70 });
        sub.textContent = z.group;
        const fl = S('text', { class: 'room-floor', x: 244, y: 80, 'text-anchor': 'end' });
        fl.textContent = `${floor + 1}F`;
        g.append(glyph(z.icon, 20, 30, 34), name, sub, fl);
      }
      if (pick) {
        g.setAttribute('role', 'button');
        g.setAttribute('tabindex', '0');
        g.setAttribute('aria-label', `${z.name}：${z.group}`);
        g.setAttribute('aria-pressed', String(z.id === on));
        g.addEventListener('click', () => pick(z.id));
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(z.id); } });
      }
      svg.append(g);
    });
    return svg;
  }

  const pairs = (list) => h('div', { class: 'pairs' }, (list || []).map(([a, b]) =>
    h('span', { class: 'pair' }, h('code', {}, a), h('i', {}, '＝'), h('b', {}, b))));

  // 文章开头：这篇发生在大楼的哪里
  function strip(c) {
    const z = zoneOf(c);
    if (!z) return null;
    return h('a', { class: 'world-strip lit elastic reveal', href: `#/world/${z.id}`, draggable: 'false' },
      building({ on: z.id, mini: true }),
      h('div', { class: 'world-strip-body' },
        h('small', {}, '这篇发生在大楼的'),
        h('b', {}, z.name),
        h('span', { class: 'world-strip-line', html: rich(z.line) }),
        pairs(c.world && c.world.length ? c.world : z.pairs.slice(0, 3))),
      h('span', { class: 'path-go', html: icon('arrow') }));
  }

  // 一个分类里出现过的命令（去掉 sudo，只留第一个字）
  function commandsIn(list) {
    const seen = new Set();
    for (const c of list) for (const s of c.sections) for (const b of s.blocks) {
      let py = false;
      for (const l of [...(b.lines || []), ...(b.commands || [])]) {
        if (!l || !l.cmd) continue;
        // Python 交互模式里打的是代码，不是命令
        if (b.lang === 'py' || (l.prompt || b.prompt) === '>>>' || py) { if (/^(exit|quit)\(\)$/.test(l.cmd)) py = false; continue; }
        if (/^python3?$/.test(l.cmd)) py = b.type === 'run';
        const w = l.cmd.replace(/^sudo\s+/, '').split(/\s+/)[0];
        if (/^[a-z][a-z0-9]*$/.test(w)) seen.add(w);
      }
    }
    return [...seen];
  }

  // 大楼地图页
  function world(start) {
    document.title = '大楼地图｜知识地图';
    let on = zones.some((z) => z.id === start) ? start : (zones[0] && zones[0].id);
    const map = h('div', { class: 'world-map' });
    const detail = h('div', { class: 'world-detail card' });

    function paint() {
      const z = zones.find((x) => x.id === on);
      map.replaceChildren(building({ on, pick: (id) => { on = id; history.replaceState(null, '', `#/world/${id}`); paint(); } }));
      const list = chapters.filter((c) => c.group === z.id);
      const cmds = commandsIn(list);
      detail.replaceChildren(
        h('div', { class: 'world-detail-head' },
          h('span', { class: 'zone-icon', html: icon(z.icon) }),
          h('div', {}, h('small', {}, z.group), h('h2', {}, z.name))),
        h('p', { html: rich(z.line) }),
        pairs(z.pairs),
        cmds.length ? h('div', { class: 'world-cmds' }, h('small', {}, '在这里学过的命令'), h('div', {}, cmds.map((w) => h('code', {}, w)))) : null,
        h('div', { class: 'tiles' }, list.map((c) =>
          h('a', { class: 'tile elastic', href: chapterUrl(c), draggable: 'false' },
            h('span', { class: 'tile-title', html: rich(c.title) }),
            h('span', { class: 'tile-date' }, c.date)))));
    }
    paint();

    return [
      h('header', { class: 'hero' },
        h('h1', {}, '大楼', h('span', { class: 'grad' }, '地图')),
        h('p', {}, '全站共用一个比喻：把 Linux 想成一栋大楼，Python 是楼上的工作室。每学一个新东西，就知道它是在哪一间做事。'),
        h('div', { class: 'meta' }, tag('补充：这个比喻是另外加的，不在原始笔记里', 'sparkle', 'warm'))),
      h('section', { class: 'group-sec world-legend' },
        h('div', { class: 'home-head' }, h('h2', { class: 'with-i', html: `${icon('bulb')}<span>先记住这几组对应</span>` })),
        pairs(KM.worldPairs)),
      h('section', { class: 'world-sec' }, map, detail),
    ];
  }

  // 把 deepen 的数据并进文章 ---------------------------------------------------
  for (const [id, d] of KM.extras || []) {
    const c = chapters.find((x) => x.id === id);
    if (!c) { console.warn('deepen 找不到文章：', id); continue; }
    if (d.world) c.world = d.world;
    for (const [nav, blocks] of Object.entries(d.at || {})) {
      const s = c.sections.find((x) => x.nav === nav);
      if (!s) { console.warn(`deepen 找不到小节：${id} / ${nav}`); continue; }
      s.blocks.push(...blocks);
    }
    if (d.poster) {
      const last = c.sections[c.sections.length - 1];
      last.blocks.unshift({ type: 'poster', ...d.poster });
    }
    if (d.story) {
      c.sections.unshift({
        nav: '故事', kicker: '补充・情境故事', title: d.story.title, lead: d.story.lead,
        blocks: [{ type: 'story', steps: d.story.steps }],
      });
    }
  }

  KM.world = { page: world, strip, zones };
})();
