// 侧边栏：首页、搜索、主题与文章清单、本月小日历
(function () {
  const KM = window.KnowledgeMap;
  const { h, rich, icon } = KM.ui;
  const { inTopic, groupsOf, numberIn, chapterUrl, topicUrl, countsByDay, dayKey, today, pad } = KM.store;

  const KEY = 'km-side';
  const root = document.documentElement;
  const dock = matchMedia('(min-width: 1180px)');
  const plain = (s) => s.replace(/\*\*|`/g, '');
  const store = {
    get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} },
  };

  // 深浅色 -------------------------------------------------------------------
  const isDark = () => {
    const t = root.dataset.theme;
    return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  };
  const themeBtn = h('button', {
    class: 'round elastic', type: 'button', 'aria-label': '切换深浅色',
    onclick: () => {
      const next = isDark() ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('km-theme', next); } catch (e) {}
      paintTheme();
    },
  });
  const paintTheme = () => { themeBtn.innerHTML = icon(isDark() ? 'sun' : 'moon'); };
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paintTheme);
  paintTheme();

  // 文章清单 -----------------------------------------------------------------
  const links = new Map(); // 文章 → 链接
  const groups = new Map(); // 主题 id → { el, link }

  const tree = h('div', { class: 'tree' }, KM.topics.filter((t) => inTopic(t.id).length).map((t) => {
    const list = inTopic(t.id);
    const link = h('a', { class: 't-link elastic', href: topicUrl(t), draggable: 'false', html: icon(t.icon || 'folder') },
      h('span', { class: 't-name', html: rich(t.name) }),
      h('span', { class: 't-count' }, String(list.length)));
    const toggle = h('button', {
      class: 't-toggle elastic', type: 'button', 'aria-label': `展开或收合 ${t.name}`, 'aria-expanded': 'false', html: icon('chevronDown'),
      onclick: () => setExpanded(t.id, !groups.get(t.id).el.classList.contains('open')),
    });
    const items = h('div', { class: 't-list' }, groupsOf(t).map(({ group, list: inGroup }) =>
      h('section', { class: 'g-block' },
        h('div', { class: 'g-label', html: icon(group.icon) }, h('span', {}, group.name)),
        h('ol', {}, inGroup.map((c) => {
          const a = h('a', { class: 'a-link elastic', href: chapterUrl(c), draggable: 'false', title: `${plain(c.title)}（${c.date}）` },
            h('span', { class: 'a-num' }, pad(numberIn(c))),
            h('span', { class: 'a-title', html: rich(c.title) }));
          links.set(c, a);
          return h('li', {}, a);
        })))));
    const el = h('section', { class: 't-group' },
      h('div', { class: 't-head' }, link, toggle),
      h('div', { class: 't-body' }, items));
    groups.set(t.id, { el, link, toggle });
    return el;
  }));

  function setExpanded(id, open) {
    const g = groups.get(id);
    g.el.classList.toggle('open', open);
    g.toggle.setAttribute('aria-expanded', String(open));
  }

  // 一开始就看得到文章；文章很多时，只展开最新的主题，清单才不会太长
  const newestTopic = KM.chapters.length ? KM.store.byNewest(KM.chapters)[0].topic : null;
  for (const id of groups.keys()) setExpanded(id, KM.chapters.length <= 30 || id === newestTopic);

  // 本月小日历 ---------------------------------------------------------------
  const counts = countsByDay();
  const firstDay = [...counts.keys()].sort()[0];
  const monthIndex = (y, m) => y * 12 + m;
  let picked = null;
  const now = today();
  let viewY = now.getFullYear();
  let viewM = now.getMonth();

  const miniTitle = h('span', { class: 'mini-title' });
  const shift = (n) => {
    const d = new Date(viewY, viewM + n, 1);
    viewY = d.getFullYear();
    viewM = d.getMonth();
    paintMini();
  };
  const miniPrev = h('button', { class: 'mini-nav elastic', type: 'button', 'aria-label': '上个月', html: icon('back'), onclick: () => shift(-1) });
  const miniNext = h('button', { class: 'mini-nav elastic', type: 'button', 'aria-label': '下个月', html: icon('forward'), onclick: () => shift(1) });
  const miniGrid = h('div', { class: 'mini-grid' });

  function paintMini() {
    const real = today();
    const todayKey = dayKey(real);
    miniTitle.textContent = `${viewY} 年 ${viewM + 1} 月`;
    const here = monthIndex(viewY, viewM);
    const earliest = firstDay ? monthIndex(Number(firstDay.slice(0, 4)), Number(firstDay.slice(5, 7)) - 1) : here;
    miniPrev.disabled = here <= Math.min(earliest, monthIndex(real.getFullYear(), real.getMonth()));
    miniNext.disabled = here >= monthIndex(real.getFullYear(), real.getMonth());

    const offset = new Date(viewY, viewM, 1).getDay();
    const days = new Date(viewY, viewM + 1, 0).getDate();
    const cells = ['日', '一', '二', '三', '四', '五', '六'].map((d) => h('span', { class: 'mini-dow' }, d));
    for (let i = 0; i < offset; i++) cells.push(h('span'));
    for (let d = 1; d <= days; d++) {
      const key = dayKey(new Date(viewY, viewM, d));
      const n = counts.get(key) || 0;
      const cls = `mini-day${n ? ' has' : ''}${key === todayKey ? ' today' : ''}${key === picked ? ' sel' : ''}`;
      cells.push(n
        ? h('button', { class: `${cls} elastic`, type: 'button', title: `${key}・${n} 篇`, 'aria-label': `${key}，添加 ${n} 篇`, 'aria-pressed': String(key === picked), onclick: () => KM.pickDay(key === picked ? null : key) }, String(d))
        : h('span', { class: cls }, String(d)));
    }
    miniGrid.replaceChildren(...cells);
  }

  // 组装 ---------------------------------------------------------------------
  const homeLink = h('a', { class: 'side-item elastic', href: '#/', draggable: 'false', html: icon('home') }, h('span', {}, '首页'));
  const memoLink = h('a', { class: 'side-item elastic', href: '#/memo', draggable: 'false', html: icon('bulb') }, h('span', {}, '口诀总表'));
  const cheatLink = h('a', { class: 'side-item elastic', href: '#/cheat', draggable: 'false', html: icon('terminal') }, h('span', {}, '命令速查'));
  const worldLink = h('a', { class: 'side-item elastic', href: '#/world', draggable: 'false', html: icon('building') }, h('span', {}, '大楼地图'));
  const panel = h('aside', { class: 'sidebar glass lit', 'aria-label': '网站导览' },
    h('div', { class: 'side-head' },
      h('a', { class: 'side-brand', href: '#/', draggable: 'false' }, '知识', h('span', { class: 'grad' }, '地图')),
      themeBtn,
      h('button', { class: 'round elastic', type: 'button', 'aria-label': '收起侧边栏', html: icon('panel'), onclick: () => setOpen(false, true) })),
    h('nav', { class: 'side-nav' },
      homeLink,
      h('button', { class: 'side-item elastic', type: 'button', html: icon('search'), onclick: () => KM.search.open() },
        h('span', {}, '搜索'),
        h('kbd', {}, /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K')),
      memoLink,
      cheatLink,
      worldLink),
    tree,
    h('section', { class: 'mini', 'aria-label': '本月上传日历' },
      h('div', { class: 'mini-head' }, miniTitle, miniPrev, miniNext),
      miniGrid));

  const opener = h('button', { class: 'side-opener round glass elastic', type: 'button', 'aria-label': '打开侧边栏', html: icon('panel'), onclick: () => setOpen(true, true) });
  const scrim = h('div', { class: 'side-scrim', onclick: () => setOpen(false, false) });
  document.body.append(scrim, panel, opener);

  // 开合：宽窗口记住偏好；窄窗口是抽屉，每次都从关闭开始 -------------------------
  function setOpen(open, byUser) {
    root.classList.toggle('side-open', open);
    panel.inert = !open;
    opener.hidden = open;
    if (byUser && dock.matches) store.set(open ? 'open' : 'closed');
  }
  const syncDock = () => setOpen(dock.matches && store.get() !== 'closed', false);
  dock.addEventListener('change', syncDock);
  syncDock();

  // 抽屉模式下，点了链接或按 Esc 就收起来
  panel.addEventListener('click', (e) => {
    if (!dock.matches && e.target.closest('a')) setOpen(false, false);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !dock.matches && root.classList.contains('side-open')) setOpen(false, false);
  });
  // 第一次画面出现后才激活开合动画，避免加载时滑动
  setTimeout(() => root.classList.add('side-ready'), 80);

  function setDay(day) {
    picked = day;
    if (day) {
      viewY = Number(day.slice(0, 4));
      viewM = Number(day.slice(5, 7)) - 1;
    }
    paintMini();
  }

  // 换页时更新高亮，并确保目前的文章看得到
  function update(page) {
    homeLink.classList.toggle('on', page.type === 'home');
    memoLink.classList.toggle('on', page.type === 'memo');
    cheatLink.classList.toggle('on', page.type === 'cheat');
    worldLink.classList.toggle('on', page.type === 'world');
    for (const g of groups.values()) g.link.classList.remove('on');
    for (const [c, a] of links) {
      const on = page.chapter === c;
      a.classList.toggle('on', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    }
    const topicId = page.topic ? page.topic.id : page.chapter ? page.chapter.topic : null;
    if (page.topic) groups.get(topicId)?.link.classList.add('on');
    if (topicId && groups.has(topicId)) setExpanded(topicId, true);
    const a = page.chapter && links.get(page.chapter);
    if (a) {
      const t = tree.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      if (r.top < t.top || r.bottom > t.bottom) tree.scrollTop += r.top - t.top - t.height / 2;
    }
  }

  paintMini();
  KM.sidebar = { update, setDay };
})();
