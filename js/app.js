// 路由与页面组装
(function () {
  const KM = window.KnowledgeMap;
  const { chapters, topics } = KM;
  const { h, rich, icon, tag, run, reduced, memory } = KM.ui;
  const { topicOf, inTopic, groupOf, groupsOf, numberIn, kindOf, kindId, pad, byNewest, chapterUrl, topicUrl, countsByDay } = KM.store;

  const view = document.getElementById('view');
  const island = document.getElementById('island');

  let demos = [];
  let revealer = null;
  let spy = null; // 目前文章的小节追踪
  let current = null; // 目前页面，用来判断只是跳小节还是要换页
  let shown = null; // 目前页面的完整数据，用来决定转场方向
  let pickedDay = null; // 日期表选取的那天，回到首页时保留
  let scrollToList = false; // 从小日历选日期后，要卷到文章列表

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  const paragraphs = (t) => [].concat(t).map((p) => h('p', { html: rich(p) }));
  const heading = (t) => (t ? h('h3', { html: rich(t) }) : null);
  const iconHeading = (name, t) => h('h3', { class: 'with-i', html: `${icon(name)}<span>${rich(t)}</span>` });
  const homeTitle = (name, t) => h('h2', { class: 'with-i', html: `${icon(name)}<span>${rich(t)}</span>` });
  const cell = (b, fallback, cls, ...kids) =>
    h('div', { class: `cell reveal lit ${cls}`, style: `--span:${b.span || fallback}` }, ...kids);

  // 内容区块种类。格式说明见 content/topics.js
  const BLOCKS = {
    text: (b) => cell(b, 6, 'card', heading(b.title), paragraphs(b.text)),
    analogy: (b) => cell(b, 6, 'card', tag('生活比喻', 'bulb'), heading(b.title), paragraphs(b.text)),
    extra: (b) => cell(b, 6, 'card', tag('补充', 'sparkle', 'warm'), heading(b.title), paragraphs(b.text)),
    terminal: (b) => {
      const t = new KM.Terminal(b);
      demos.push(t);
      const el = cell(b, 6, 'term', t.nodes);
      t.watch(el);
      return el;
    },
    terms: (b) => cell(b, 12, 'card', iconHeading('book', b.title || '名词白话翻译'),
      h('dl', { class: 'terms' }, b.items.map(([term, plain]) =>
        h('div', {}, h('dt', { html: rich(term) }), h('dd', { html: rich(plain) }))))),
    recap: (b) => cell(b, 12, 'card recap', iconHeading('checkCircle', b.title || '重点回顾'),
      h('ol', {}, b.items.map((it) => h('li', { html: rich(it) })))),
    movie: (b) => {
      const m = new KM.Movie(b);
      demos.push(m);
      return m.el;
    },
    run: (b) => {
      const r = new KM.Run(b);
      demos.push(r);
      return r.el;
    },
  };

  const named = (el, name) => { el.style.viewTransitionName = name; return el; };
  const vt = (c) => chapters.indexOf(c);

  // 紧凑的文章列：首页和日期筛选共用
  function row(c) {
    return h('a', { class: 'row lit elastic reveal in', href: chapterUrl(c), draggable: 'false' },
      h('time', { class: 'row-date', datetime: c.date }, c.date),
      h('div', { class: 'row-body' },
        named(h('div', { class: 'row-title', html: rich(c.title) }), `title-${vt(c)}`),
        h('div', { class: 'row-sub', html: rich(c.summary) })),
      h('span', { class: 'row-tags' }, kindTag(c), tag(`${topicOf(c).name}・${groupOf(c).name}`, groupOf(c).icon, 'plain')),
      h('span', { class: 'row-go', html: icon('forward') }));
  }

  // 文章类型的小标签：课程不显示，挑战、实战才显示
  const kindTag = (c) => (kindId(c) === 'lesson' ? null
    : h('span', { class: `kind kind-${kindId(c)}`, html: icon(kindOf(c).icon) }, kindOf(c).name));

  // 一个单元：标题和一句说明，下面一行一篇
  function unitBlock(t, group, list, gi, here) {
    return h('section', { class: 'unit lit reveal' },
      h('header', { class: 'unit-head' },
        h('span', { class: 'unit-icon', html: icon(group.icon) }),
        h('div', { class: 'unit-text' },
          h('small', {}, `单元 ${gi + 1}・${list.length} 篇`),
          h('h3', {}, group.name),
          group.line ? h('p', { html: rich(group.line) }) : null)),
      h('ol', { class: 'lessons' }, list.map((c) =>
        h('li', {}, h('a', { class: `lesson elastic${here === c ? ' here' : ''}`, href: chapterUrl(c), draggable: 'false' },
          h('span', { class: 'lesson-n' }, pad(numberIn(c))),
          h('span', { class: 'lesson-title', html: rich(c.title) }),
          kindTag(c),
          here === c ? h('span', { class: 'lesson-here' }, '上次看到') : null)))));
  }

  // 课程目录：上面是主题分段标签，一次只显示一个主题
  function courseMap(here) {
    const list = topics.filter((t) => inTopic(t.id).length);
    const saved = memory.get('km-topic');
    let on = list.find((t) => t.id === (saved || (here && here.topic))) || list[0];
    const body = h('div', { class: 'course-body' });
    const tabs = list.map((t) => h('button', {
      class: 'course-tab elastic', type: 'button', role: 'tab',
      html: `${icon(t.icon || 'folder')}<span>${rich(t.name)}</span><small>${inTopic(t.id).length}</small>`,
      onclick: () => { on = t; memory.set('km-topic', t.id); paint(); },
    }));
    function paint() {
      tabs.forEach((b, i) => { b.classList.toggle('on', list[i] === on); b.setAttribute('aria-selected', String(list[i] === on)); });
      body.replaceChildren(
        ...groupsOf(on).map(({ group, list: inGroup }) => unitBlock(on, group, inGroup, on.groups.indexOf(group), here)),
        h('a', { class: 'clear course-all elastic', href: topicUrl(on), draggable: 'false' }, `${on.name}・全部单元`, h('span', { html: icon('forward') })));
      body.querySelectorAll('.reveal').forEach((el) => el.classList.add('in'));
    }
    paint();
    return h('section', { class: 'home-sec course' },
      h('div', { class: 'home-head course-head' },
        homeTitle('list', '课程目录'),
        h('div', { class: 'course-tabs', role: 'tablist' }, tabs)),
      body);
  }

  // 首页 -------------------------------------------------------------------
  function statCard() {
    const days = countsByDay();
    const latest = chapters.length ? [...days.keys()].sort().pop() : '—';
    const { current: streak, longest } = KM.store.streaks();
    const stat = (name, label, value, small) => h('div', { class: `stat${small ? ' wide' : ''}` },
      h('span', { html: icon(name) }, label),
      h('b', { class: small ? 'small' : 'grad' }, value));
    return h('section', { class: 'cell card lit stat-card reveal', style: '--span:3', 'aria-label': '学习统计' },
      stat('file', '总篇数', String(chapters.length)),
      stat('calendarCheck', '学习天数', String(days.size)),
      stat('flame', '目前连续', String(streak)),
      stat('trophy', '最长连续', String(longest)),
      stat('upload', '最近上传', latest, true));
  }

  function renderHome() {
    document.title = '知识地图';
    const hero = h('header', { class: 'hero hero-home' },
      h('h1', {}, '知识', h('span', { class: 'grad' }, '地图')),
      h('p', {}, '照顺序一步一步学。每一篇都用白话解释，再用动画演示一次。'),
      h('button', { class: 'search-cta lit elastic', type: 'button', onclick: () => KM.search.open() },
        h('span', { html: icon('search') }),
        h('span', { class: 'search-cta-text' }, '搜索标题、命令、名词…'),
        h('kbd', {}, /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘K' : 'Ctrl K')));

    if (!chapters.length) return [hero, h('div', { class: 'empty' }, '还没有文章。')];

    const listHost = h('div');
    const paintList = () => {
      const picked = pickedDay && chapters.filter((c) => c.date === pickedDay);
      const list = picked && picked.length ? byNewest(picked) : byNewest(chapters).slice(0, 5);
      const head = h('div', { class: 'home-head' },
        picked && picked.length ? homeTitle('calendar', `${pickedDay} 添加的文章`) : homeTitle('clock', '最近添加'),
        picked && picked.length ? h('button', {
          class: 'clear elastic', type: 'button',
          onclick: () => { pickedDay = null; cal.clearSelection(); paintList(); KM.sidebar.setDay(null); },
        }, h('span', { html: icon('close') }), '显示全部') : null);
      listHost.replaceChildren(head, h('div', { class: 'rows' }, list.map(row)));
    };
    const cal = KM.calendar({ selected: pickedDay, onPick: (day) => { pickedDay = day; paintList(); KM.sidebar.setDay(day); } });
    paintList();

    // 继续学习：上次看到的那篇；还没看过就从第一篇开始
    const last = memory.get('km-last');
    const lastChapter = last && chapters.find((c) => c.id === last.id);
    const lastNav = lastChapter && lastChapter.sections.some((s) => s.nav === last.nav) ? last.nav : null;
    const first = topics.map((t) => inTopic(t.id)[0]).find(Boolean);
    const goTo = lastChapter || first;
    const goNext = lastChapter && inTopic(lastChapter.topic)[inTopic(lastChapter.topic).indexOf(lastChapter) + 1];
    const resume = h('section', { class: 'resume-wrap reveal' },
      h('a', { class: 'resume lit elastic', href: chapterUrl(goTo, lastNav), draggable: 'false' },
        h('span', { class: 'resume-icon', html: icon(lastChapter ? 'bookmark' : 'play') }),
        h('span', { class: 'resume-body' },
          h('small', {}, lastChapter ? '继续学习・上次看到这里' : '从第一篇开始'),
          h('b', { html: rich(goTo.title) }),
          h('span', { class: 'resume-nav' }, lastNav ? `${topicOf(goTo).name}・小节：${lastNav}` : `${topicOf(goTo).name}・${groupOf(goTo).name}・第 ${numberIn(goTo)} 篇`)),
        h('span', { class: 'path-go', html: icon('arrow') })),
      goNext ? h('a', { class: 'resume-next lit elastic', href: chapterUrl(goNext), draggable: 'false' },
        h('small', {}, '下一篇'),
        h('b', { html: rich(goNext.title) })) : null);

    // 课程目录：每个主题底下依分类分区，编号就是学习顺序
    const maps = [courseMap(lastChapter)];

    return [
      hero,
      resume,
      ...maps,
      h('section', { class: 'home-sec home-log', id: 'home-log' },
        h('div', { class: 'home-head' }, homeTitle('calendarCheck', '学习记录')),
        h('div', { class: 'bento' }, cal, statCard()),
        h('div', { class: 'home-list' }, listHost)),
    ];
  }

  // 主题页 -----------------------------------------------------------------
  function renderTopic(t) {
    document.title = `${t.name}｜知识地图`;
    const hero = h('header', { class: 'hero' },
      h('h1', { html: rich(t.name) }),
      h('p', { html: rich(t.summary) }));

    const card = (c) => {
      const demosIn = c.sections.flatMap((s) => s.blocks).filter((b) => b.type === 'run');
      return h('li', { class: 'reveal' },
        h('a', { class: 'path-card lit elastic', href: chapterUrl(c), draggable: 'false' },
          named(h('span', { class: 'path-num grad' }, pad(numberIn(c))), `num-${vt(c)}`),
          h('div', {},
            named(h('h2', { html: rich(c.title) }), `title-${vt(c)}`),
            h('p', { html: rich(c.summary) }),
            h('div', { class: 'meta' },
              kindTag(c),
              tag(c.date, 'calendar', 'plain'),
              tag(`${c.sections.length} 个小节`, 'list', 'plain'),
              demosIn.length ? tag(`${demosIn.length} 段动画`, 'film', 'plain') : null)),
          h('span', { class: 'path-go', html: icon('arrow') })));
    };
    const groups = groupsOf(t).map(({ group, list }) =>
      h('section', { class: 'group-sec' },
        h('div', { class: 'home-head unit-title' },
          h('div', {},
            h('small', {}, `单元 ${t.groups.indexOf(group) + 1}`),
            homeTitle(group.icon, group.name),
            group.line ? h('p', { html: rich(group.line) }) : null)),
        h('ol', { class: 'path' }, list.map(card))));
    return [hero, ...groups];
  }

  // 文章页 -----------------------------------------------------------------
  function renderChapter(c) {
    const topic = topicOf(c);
    document.title = `${c.title}｜知识地图`;
    const hero = h('header', { class: 'hero' },
      named(h('span', { class: 'hero-num grad' }, pad(numberIn(c))), `num-${vt(c)}`),
      named(h('h1', { html: rich(c.title) }), `title-${vt(c)}`),
      h('p', { html: rich(c.summary) }),
      h('div', { class: 'meta' },
        h('a', { class: 'tag elastic', href: topicUrl(topic), draggable: 'false', html: icon(topic.icon || 'folder') }, topic.name),
        tag(`单元 ${topic.groups.indexOf(groupOf(c)) + 1}・${groupOf(c).name}`, groupOf(c).icon, 'plain'),
        kindTag(c),
        tag(`上传于 ${c.date}`, 'upload', 'plain'),
        c.updated ? tag(`更新于 ${c.updated}`, 'clock', 'plain') : null));

    const sections = c.sections.map((s) =>
      h('section', { class: 'sec', id: `sec-${s.nav}` },
        h('header', { class: 'sec-head reveal' },
          s.kicker ? h('div', { class: 'kicker' }, s.kicker) : null,
          h('h2', { html: rich(s.title) }),
          s.lead ? h('p', { html: rich(s.lead) }) : null),
        h('div', { class: 'bento' }, s.blocks.map((b) => {
          const make = BLOCKS[b.type] || KM.blocks[b.type];
          if (!make) { console.warn('未知的区块种类：', b.type); return null; }
          return make(b);
        }), s.more && s.more.length ? KM.blocks.more(s.more) : null)));

    const siblings = inTopic(c.topic);
    const next = siblings[siblings.indexOf(c) + 1];
    const end = h('a', { class: 'next-chapter lit elastic reveal', href: next ? chapterUrl(next) : topicUrl(topic), draggable: 'false' },
      h('span', {},
        h('small', {}, next ? '下一篇' : '这个主题读完了'),
        h('b', { html: rich(next ? next.title : `回到${topic.name}`) })),
      h('span', { class: 'path-go', html: icon('arrow') }));

    return [hero, c.story ? KM.blocks.storyFold(c.story) : null, ...sections, KM.pages.quiz(c), end];
  }

  // 浮岛：指示块的两侧用不同刚性，前缘先到、后缘跟上，移动时会自然拉长 ---------------
  function makeSpy(chapter) {
    const ind = h('span', { class: 'pills-ind', 'aria-hidden': 'true' });
    const pills = chapter.sections.map((s) => h('button', {
      class: 'pill elastic', type: 'button',
      onclick: () => document.getElementById(`sec-${s.nav}`).scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' }),
    }, s.nav));
    const wrap = h('div', { class: 'pills' }, ind, pills);
    const st = { l: 0, r: 0, vl: 0, vr: 0, tl: 0, tr: 0, on: -1, placed: false };

    const paint = () => {
      ind.style.transform = `translateX(${st.l}px)`;
      ind.style.width = `${Math.max(0, st.r - st.l)}px`;
    };
    function tick(dt) {
      const forward = st.tr > st.r || st.tl > st.l;
      const K = (lead) => (lead ? 420 : 150);
      const spring = (p, v, t, k) => {
        st[v] += (-k * (st[p] - st[t]) - 2 * Math.sqrt(k) * 0.82 * st[v]) * dt;
        st[p] += st[v] * dt;
      };
      spring('l', 'vl', 'tl', K(!forward));
      spring('r', 'vr', 'tr', K(forward));
      paint();
      if (Math.abs(st.l - st.tl) + Math.abs(st.r - st.tr) + Math.abs(st.vl) + Math.abs(st.vr) > 0.1) return true;
      st.l = st.tl; st.r = st.tr; st.vl = st.vr = 0;
      paint();
      return false;
    }

    function select(n) {
      if (n === st.on) return;
      if (st.on >= 0) pills[st.on].classList.remove('on');
      st.on = n;
      memory.set('km-last', { id: chapter.id, nav: n < 0 ? null : chapter.sections[n].nav });
      if (n < 0) { ind.style.width = '0'; st.placed = false; return; }
      const p = pills[n];
      p.classList.add('on');
      st.tl = p.offsetLeft;
      st.tr = p.offsetLeft + p.offsetWidth;
      wrap.scrollTo({ left: p.offsetLeft - (wrap.clientWidth - p.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
      if (!st.placed || reduced()) {
        st.l = st.tl; st.r = st.tr; st.placed = true;
        paint();
      } else {
        run(tick);
      }
    }

    function sync() {
      const line = innerHeight * 0.38;
      let cur = -1;
      chapter.sections.forEach((s, n) => {
        const el = document.getElementById(`sec-${s.nav}`);
        if (el && el.getBoundingClientRect().top <= line) cur = n;
      });
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) cur = chapter.sections.length - 1;
      select(cur);
    }
    return { wrap, sync };
  }

  function paintIsland(page) {
    // 浮岛只负责文章内的小节导览，其他导览都在侧边栏
    spy = page.type === 'chapter' ? makeSpy(page.chapter) : null;
    island.hidden = !spy;
    island.replaceChildren(...(spy ? [spy.wrap, progress] : []));
    paintProgress();
  }

  // 浮岛底下的阅读进度线
  const progress = h('i', { class: 'island-prog', 'aria-hidden': 'true' });
  function paintProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : '0');
  }

  // 路由：#/　#/t/主题　#/c/文章　#/c/文章/小节 --------------------------------
  function parse() {
    const hash = location.hash;
    let m = hash.match(/^#\/c\/([^/]+)(?:\/(.+))?$/);
    if (m) {
      const chapter = chapters.find((c) => c.id === decodeURIComponent(m[1]));
      if (chapter) return { type: 'chapter', key: `c:${chapter.id}`, chapter, nav: m[2] ? decodeURIComponent(m[2]) : null };
    }
    m = hash.match(/^#\/t\/([^/]+)$/);
    if (m) {
      const topic = topics.find((t) => t.id === decodeURIComponent(m[1]));
      if (topic) return { type: 'topic', key: `t:${topic.id}`, topic };
    }
    if (hash === '#/memo') return { type: 'memo', key: 'memo' };
    if (hash === '#/cheat') return { type: 'cheat', key: 'cheat' };
    return { type: 'home', key: 'home' };
  }

  function jump(nav) {
    const el = nav && document.getElementById(`sec-${nav}`);
    if (!el) return;
    el.scrollIntoView();
    const head = el.querySelector('.sec-head');
    head.classList.remove('flash');
    void head.offsetWidth; // 重新触发动画
    head.classList.add('flash');
  }

  function render(page) {
    demos.forEach((d) => d.destroy());
    demos = [];
    if (revealer) revealer.disconnect();

    const parts = page.type === 'chapter' ? renderChapter(page.chapter)
      : page.type === 'topic' ? renderTopic(page.topic)
      : page.type === 'memo' ? KM.pages.memo()
      : page.type === 'cheat' ? KM.pages.cheat()
      : renderHome();
    view.replaceChildren(...parts.filter(Boolean));
    current = page.key;
    shown = page;
    paintIsland(page);
    KM.sidebar.update(page);
    if (page.type === 'chapter') memory.set('km-last', { id: page.chapter.id, nav: page.nav || null });
    window.scrollTo(0, 0);
    if (spy) spy.sync();

    // 同一批进场的元素依序错开，由上到下、由左到右
    revealer = new IntersectionObserver((entries) => {
      const batch = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      batch.forEach((e, i) => {
        const el = e.target;
        const wait = reduced() ? 0 : Math.min(i, 6) * 55;
        if (wait) {
          el.style.transitionDelay = `${wait}ms`;
          setTimeout(() => { el.style.transitionDelay = ''; }, wait + 950);
        }
        el.classList.add('in');
        revealer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    view.querySelectorAll('.reveal:not(.in)').forEach((el) => revealer.observe(el));
    if (page.nav) jump(page.nav);
    // 从口诀总表点过来：直接卷到那段短片
    const film = KM.pendingFilm && view.querySelector(`.film[data-film="${KM.pendingFilm}"]`);
    KM.pendingFilm = null;
    if (film) {
      film.classList.add('in');
      film.scrollIntoView({ block: 'center' });
      film.focus({ preventScroll: true });
      film.classList.add('spot');
      setTimeout(() => film.classList.remove('spot'), 1600);
    }
    if (scrollToList && page.type === 'home') document.getElementById('home-log')?.scrollIntoView({ block: 'start' });
    scrollToList = false;
  }

  function route() {
    const page = parse();
    if (page.key === current) { jump(page.nav); return; }
    if (!document.startViewTransition || reduced() || document.hidden || !view.childElementCount) { render(page); return; }
    // 转场方向：往后面的文章向左滑，往前面的文章或回到列表向右滑
    const root = document.documentElement;
    const at = (p) => (p && p.type === 'chapter' ? chapters.indexOf(p.chapter) : -1);
    const dir = at(page) > at(shown) ? 'fwd' : at(page) < at(shown) ? 'back' : '';
    if (dir) root.dataset.nav = dir; else delete root.dataset.nav;
    const t = document.startViewTransition(() => render(page));
    // 连续切换时前一次转场会被中止，这是正常情况，内容仍会更新
    t.ready.catch(() => {});
    t.finished.catch(() => {}).then(() => { if (root.dataset.nav === dir) delete root.dataset.nav; });
  }

  // 搜索结果用：再点一次同一个结果时，也要跳过去
  KM.navigate = (url) => {
    if (location.hash === url) route();
    else location.hash = url;
  };

  // 小日历用：选一天，到首页列出当天文章
  KM.pickDay = (day) => {
    pickedDay = day;
    scrollToList = Boolean(day);
    KM.sidebar.setDay(day);
    if (current === 'home') render(parse());
    else KM.navigate('#/');
  };

  addEventListener('scroll', () => { if (spy) { spy.sync(); paintProgress(); } }, { passive: true });
  addEventListener('resize', () => { if (spy) paintProgress(); });
  addEventListener('hashchange', route);
  render(parse());
})();
