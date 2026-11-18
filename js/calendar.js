// GitHub 式日期表：每栏一周，颜色深浅代表当天添加几篇
(function () {
  const KM = window.KnowledgeMap;
  const { h, icon } = KM.ui;
  const { parseDay, dayKey, addDays, diffDays, today, countsByDay } = KM.store;

  const level = (n) => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n <= 4 ? 3 : 4);

  function rangeOf(mode) {
    const now = today();
    if (mode === 'recent') return { from: addDays(now, -364), to: now };
    const end = new Date(mode, 11, 31);
    return { from: new Date(mode, 0, 1), to: end < now ? end : now };
  }

  // selected：目前选取的日期；onPick(day 或 null)：点击时调用
  KM.calendar = function calendar({ selected, onPick }) {
    const counts = countsByDay();
    const days = [...counts.keys()].sort();
    let mode = 'recent';
    let current = selected;

    const titleText = h('span');
    const title = h('h3', { class: 'with-i', html: icon('calendar') }, titleText);
    const scroller = h('div', { class: 'cal-scroll' });
    const tip = h('div', { class: 'cal-tip', role: 'status', hidden: true });

    // 有超出最近一年的文章时，才需要年份切换
    const years = [...new Set(days.map((d) => Number(d.slice(0, 4))))].sort((a, b) => b - a);
    const needYears = days.length && parseDay(days[0]) < rangeOf('recent').from;
    const switcher = needYears ? h('div', { class: 'cal-years' },
      ['recent', ...years].map((y) => h('button', {
        class: `year elastic${y === mode ? ' on' : ''}`, type: 'button', 'data-mode': y,
        onclick: (e) => {
          mode = y;
          switcher.querySelectorAll('.year').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
          draw();
        },
      }, y === 'recent' ? '最近一年' : `${y}`))) : null;

    function draw() {
      const { from, to } = rangeOf(mode);
      const origin = addDays(from, -from.getDay()); // 从该周星期日开始
      const weeks = Math.floor(diffDays(to, origin) / 7) + 1;
      const grid = h('div', { class: 'cal-grid', style: `--weeks:${weeks}` });

      ['一', '三', '五'].forEach((d, i) => {
        grid.append(h('span', { class: 'cal-dow', style: `grid-row:${i * 2 + 3};grid-column:1` }, d));
      });

      const total = diffDays(to, from);
      const todayKey = dayKey(today());
      const labels = [];
      let added = 0;
      for (let i = 0; i <= total; i++) {
        const d = addDays(from, i);
        const week = Math.floor(diffDays(d, origin) / 7);
        const key = dayKey(d);
        const n = counts.get(key) || 0;
        added += n;
        if (d.getDate() === 1) {
          const col = week + (d.getDay() > 0 ? 1 : 0);
          if (col < weeks) labels.push({ col, month: d.getMonth() + 1 });
        }
        const place = `grid-column:${week + 2};grid-row:${d.getDay() + 2}`;
        const isToday = key === todayKey ? ' today' : '';
        const cell = n
          ? h('button', { class: `day l${level(n)}${isToday} elastic${key === current ? ' sel' : ''}`, type: 'button', style: place, 'data-day': key, 'data-n': n, 'aria-label': `${key}，添加 ${n} 篇`, 'aria-pressed': String(key === current) })
          : h('span', { class: `day l0${isToday}`, style: place, 'data-day': key, 'data-n': 0 });
        grid.append(cell);
      }
      // 起始的不完整月份，空间够才标
      if (!labels.length || labels[0].col >= 3) labels.unshift({ col: 0, month: from.getMonth() + 1 });
      labels.forEach((l) => grid.append(h('span', { class: 'cal-month', style: `grid-column:${l.col + 2} / span 4;grid-row:1` }, `${l.month}月`)));

      titleText.textContent = `${mode === 'recent' ? '最近一年' : `${mode} 年`}添加 ${added} 篇`;
      scroller.replaceChildren(grid);
      if (scroller.scrollWidth > scroller.clientWidth) scroller.scrollLeft = scroller.scrollWidth;
    }

    function showTip(cell) {
      const n = Number(cell.dataset.n);
      const titles = KM.chapters.filter((c) => c.date === cell.dataset.day).map((c) => c.title.replace(/\*\*|`/g, ''));
      tip.replaceChildren(
        h('div', {}, `${cell.dataset.day}・${n ? `${n} 篇` : '没有添加'}`),
        ...titles.slice(0, 4).map((t) => h('small', {}, t)),
        ...(titles.length > 4 ? [h('small', {}, `还有 ${titles.length - 4} 篇…`)] : []));
      tip.hidden = false;
      const box = card.getBoundingClientRect();
      const r = cell.getBoundingClientRect();
      const half = tip.offsetWidth / 2;
      const x = Math.max(half + 8, Math.min(box.width - half - 8, r.left - box.left + r.width / 2));
      tip.style.left = `${x}px`;
      tip.style.top = `${r.top - box.top - 8}px`;
    }

    scroller.addEventListener('pointerover', (e) => {
      const cell = e.target.closest('[data-day]');
      if (cell) showTip(cell); else tip.hidden = true;
    });
    scroller.addEventListener('pointerleave', () => { tip.hidden = true; });
    scroller.addEventListener('focusin', (e) => {
      const cell = e.target.closest('[data-day]');
      if (cell) showTip(cell);
    });
    scroller.addEventListener('focusout', () => { tip.hidden = true; });
    scroller.addEventListener('click', (e) => {
      const cell = e.target.closest('button.day');
      if (!cell) return;
      const day = cell.dataset.day === current ? null : cell.dataset.day;
      current = day;
      scroller.querySelectorAll('.day.sel').forEach((c) => {
        c.classList.remove('sel');
        c.setAttribute('aria-pressed', 'false');
      });
      if (day) {
        cell.classList.add('sel');
        cell.setAttribute('aria-pressed', 'true');
      }
      onPick(day);
    });

    const legend = h('div', { class: 'cal-legend', 'aria-hidden': 'true' },
      h('span', {}, '少'),
      [0, 1, 2, 3, 4].map((l) => h('i', { class: `day l${l}` })),
      h('span', {}, '多'));

    const card = h('section', { class: 'cell card lit cal-card reveal', style: '--span:8', 'aria-label': '上传日期表' },
      h('div', { class: 'cal-head' }, title, switcher),
      scroller,
      legend,
      tip);

    draw();
    // 放不下时卷到最右边，让今天一开始就看得到
    new ResizeObserver(() => { scroller.scrollLeft = scroller.scrollWidth; }).observe(scroller);
    card.clearSelection = () => {
      current = null;
      scroller.querySelectorAll('.day.sel').forEach((c) => {
        c.classList.remove('sel');
        c.setAttribute('aria-pressed', 'false');
      });
    };
    return card;
  };
})();
