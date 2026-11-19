// 共用小工具：创建元素、行内格式、图标、动效
(function () {
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    el.append(...kids.flat().filter((x) => x != null));
    return el;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // 内容里可以用 **粗体** 和 `代码`
  function rich(s) {
    return escapeHtml(s)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>');
  }

  /* 图标规格（添加时照这个画，全站才会统一）
   *   - 24×24 画布，内容留 3px 边距
   *   - 线条 1.8、圆角端点与转角
   *   - 主要形状用 duo() 包起来，会多一层 18% 的淡填色
   *   - 只有播放、暂停这种实心符号用 class="s"
   */
  const duo = (shape) => shape.replace('/>', ' class="d"/>') + shape;

  const ICONS = {
    // 导览
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    forward: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    arrow: '<path d="M4.5 12h15"/><path d="m13.5 6 6 6-6 6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chevronDown: '<path d="m6 9.5 6 6 6-6"/>',
    home: duo('<path d="M4 10.8 12 4l8 6.8V18a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18z"/>') + '<path d="M10 20.5v-5h4v5"/>',
    panel: duo('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/>') + '<path d="M9.5 4.5v15"/>',
    search: duo('<circle cx="11" cy="11" r="6.5"/>') + '<path d="m16 16 4.5 4.5"/>',
    sun: duo('<circle cx="12" cy="12" r="4"/>') + '<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>',
    moon: duo('<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>'),

    // 播放控制
    play: '<path class="s" d="M8 6.2c0-1 1.1-1.6 1.9-1.1l9.4 5.8c.8.5.8 1.7 0 2.2l-9.4 5.8c-.8.5-1.9-.1-1.9-1.1z"/>',
    pause: '<rect class="s" x="6.5" y="5" width="4" height="14" rx="1.5"/><rect class="s" x="13.5" y="5" width="4" height="14" rx="1.5"/>',
    replay: '<path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5L4.5 8.8"/><path d="M4.5 4.5v4.3h4.3"/>',
    stepBack: duo('<path d="M18.5 6.6c0-.8-.9-1.3-1.6-.8L8.6 11.2c-.6.4-.6 1.2 0 1.6l8.3 5.4c.7.5 1.6 0 1.6-.8z"/>') + '<path d="M5.5 5.5v13"/>',
    stepNext: duo('<path d="M5.5 6.6c0-.8.9-1.3 1.6-.8l8.3 5.4c.6.4.6 1.2 0 1.6l-8.3 5.4c-.7.5-1.6 0-1.6-.8z"/>') + '<path d="M18.5 5.5v13"/>',

    // 内容标签
    film: duo('<rect x="3.5" y="5" width="17" height="14" rx="3"/>') + '<path d="M10.5 9.3v5.4l4.5-2.7z"/>',
    bulb: duo('<path d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.2 1.1 2v.7h5v-.7c0-.8.4-1.5 1.1-2A6 6 0 0 0 12 3.5z"/>') + '<path d="M10 20.5h4"/>',
    sparkle: duo('<path d="m11 4 1.7 4.8c.2.6.7 1.1 1.3 1.3L19 12l-5 1.9c-.6.2-1.1.7-1.3 1.3L11 20l-1.7-4.8c-.2-.6-.7-1.1-1.3-1.3L3 12l5-1.9c.6-.2 1.1-.7 1.3-1.3z"/>') + '<path d="M19 3.5v3M17.5 5h3"/>',
    book: duo('<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/>') + '<path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/>',
    checkCircle: duo('<circle cx="12" cy="12" r="8.5"/>') + '<path d="m8.3 12.2 2.5 2.5 4.9-5.2"/>',

    // 日期与统计
    calendar: duo('<rect x="4" y="5.5" width="16" height="15" rx="3"/>') + '<path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    calendarCheck: duo('<rect x="4" y="5.5" width="16" height="15" rx="3"/>') + '<path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/><path d="m9 15.2 2 2 4-4"/>',
    clock: duo('<circle cx="12" cy="12" r="8.5"/>') + '<path d="M12 7.5V12l3 2"/>',
    upload: '<rect class="d" x="4.5" y="13" width="15" height="7.5" rx="2.5"/><path d="M12 15.5v-11M7.5 9 12 4.5 16.5 9"/><path d="M4.5 15v3A2.5 2.5 0 0 0 7 20.5h10a2.5 2.5 0 0 0 2.5-2.5v-3"/>',
    flame: duo('<path d="M12.5 3.5c.4 3.2 5.5 5.6 5.5 10.6a6 6 0 0 1-12 0c0-2.2 1-3.8 2.2-5 .2 1.4.9 2.4 1.9 2.9-.3-3.4.4-6.4 2.4-8.5z"/>'),
    trophy: duo('<path d="M7.5 4h9v6.5a4.5 4.5 0 0 1-9 0z"/>') + '<path d="M7.5 6h-3v1.5a3.5 3.5 0 0 0 3.2 3.5M16.5 6h3v1.5a3.5 3.5 0 0 1-3.2 3.5M12 15v4M8.5 20h7"/>',

    // 文章与主题
    file: duo('<path d="M7 3.5h6.6c.5 0 1 .2 1.4.6l3.4 3.4c.4.4.6.9.6 1.4v9.6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z"/>') + '<path d="M14 3.8V8h4.7M8.5 13h7M8.5 16.5h5"/>',
    folder: duo('<path d="M3.5 7.5a2 2 0 0 1 2-2h3.6c.5 0 1 .2 1.4.6l1.2 1.2c.4.4.9.6 1.4.6h5.4a2 2 0 0 1 2 2v7.6a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>'),
    list: duo('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/>') + '<path d="M8 9.5h8M8 14.5h8"/>',

    copy: duo('<rect x="8.5" y="8.5" width="12" height="12" rx="2.5"/>') + '<path d="M15.5 8.5V6A2.5 2.5 0 0 0 13 3.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5"/>',
    eye: duo('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>') + '<circle cx="12" cy="12" r="2.8"/>',

    // 动画舞台用的图标，需要新的就加在这里
    monitor: duo('<rect x="3" y="4" width="18" height="12" rx="2.5"/>') + '<path d="M8 20h8M12 16v4"/>',
    user: duo('<circle cx="12" cy="8" r="4"/>') + '<path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    terminal: duo('<rect x="3" y="4" width="18" height="16" rx="2.5"/>') + '<path d="m7 9 3.5 3L7 15M13 15h4"/>',

    // 播放器与学习工具
    expand: '<path d="M4.5 9.5v-5h5M19.5 9.5v-5h-5M4.5 14.5v5h5M19.5 14.5v5h-5"/>',
    shrink: '<path d="M9.5 4.5v5h-5M14.5 4.5v5h5M9.5 19.5v-5h-5M14.5 19.5v-5h5"/>',
    bookmark: duo('<path d="M7.5 4h9A1.5 1.5 0 0 1 18 5.5V20l-6-3.8L6 20V5.5A1.5 1.5 0 0 1 7.5 4z"/>'),
    building: duo('<path d="M5.5 20.5v-15a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v15z"/>') + '<path d="M3 20.5h18M9.5 8h1M13.5 8h1M9.5 12h1M13.5 12h1M10.5 20.5v-4h3v4"/>',
    code: duo('<rect x="3" y="4" width="18" height="16" rx="2.5"/>') + '<path d="m9 9.5-2.5 2.5L9 14.5M15 9.5l2.5 2.5-2.5 2.5M13 8.5l-2 7"/>',
    tag: duo('<path d="M3.5 12.6V5a1.5 1.5 0 0 1 1.5-1.5h7.6l8 8a1.5 1.5 0 0 1 0 2.1l-7.5 7.5a1.5 1.5 0 0 1-2.1 0z"/>') + '<circle cx="8" cy="8" r="1.4"/>',
    target: duo('<circle cx="12" cy="12" r="8.5"/>') + '<circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    pencil: duo('<path d="m4.5 19.5 1-4.6L16 4.4a2.1 2.1 0 0 1 3 3L8.6 18z"/>') + '<path d="m14 6.5 3 3"/>',
  };

  function icon(name) {
    return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  // 带图标的标签
  const tag = (text, name, cls) => h('span', { class: `tag ${cls || ''}`, html: name ? icon(name) : '' }, text);

  // KnowledgeMap.calm = true 可以手动切到「减少动态」的显示方式
  const reduced = () => window.KnowledgeMap.calm === true || matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 记在浏览器里的小数据：播放速度、看过的短片、上次读到哪里
  const memory = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
  };

  // 共用动画循环：fn(dt) 返回 true 代表还要下一帧
  const jobs = new Set();
  let raf = 0;
  let last = 0;
  function frame(now) {
    const dt = Math.min(0.033, Math.max(0.001, (now - last) / 1000));
    last = now;
    for (const fn of jobs) if (!fn(dt)) jobs.delete(fn);
    raf = jobs.size ? requestAnimationFrame(frame) : 0;
  }
  function run(fn) {
    jobs.add(fn);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  }

  // 指尖泛起的光晕
  function halo(el) {
    if (reduced()) return;
    el.animate(
      [{ boxShadow: '0 0 0 0 rgba(124, 92, 255, .5)' }, { boxShadow: '0 0 0 14px rgba(124, 92, 255, 0)' }],
      { duration: 620, easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
  }

  // 弹性回馈：按下受力压缩，拖动朝手指方向拉伸，放手带惯性弹回
  (function elastic() {
    const K = 460;
    const D = 19;
    const live = new Map();
    let press = null;

    const rubber = (d) => Math.sign(d) * 16 * (1 - 1 / (Math.abs(d) / 44 + 1));

    function tick(dt) {
      let moving = false;
      for (const [el, s] of live) {
        for (const k of ['x', 'y', 's']) {
          const target = s['t' + k];
          s['v' + k] += (-K * (s[k] - target) - D * s['v' + k]) * dt;
          s[k] += s['v' + k] * dt;
        }
        const still = s !== (press && press.s) &&
          Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.s - 1) < 0.002 &&
          Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vs) < 0.02;
        if (still) {
          el.style.translate = '';
          el.style.scale = '';
          live.delete(el);
          continue;
        }
        moving = true;
        // 位移越大拉得越长，另一轴同步变窄
        const sx = s.s * (1 + Math.abs(s.x) / 150 - Math.abs(s.y) / 300);
        const sy = s.s * (1 + Math.abs(s.y) / 150 - Math.abs(s.x) / 300);
        el.style.translate = `${s.x}px ${s.y}px`;
        el.style.scale = `${sx} ${sy}`;
      }
      return moving;
    }

    addEventListener('pointerdown', (e) => {
      if (e.button || reduced()) return;
      const el = e.target.closest && e.target.closest('.elastic');
      if (!el || el.disabled) return;
      let s = live.get(el);
      if (!s) {
        s = { x: 0, y: 0, s: 1, vx: 0, vy: 0, vs: 0, tx: 0, ty: 0, ts: 1 };
        live.set(el, s);
      }
      // 大卡片压得浅，小按钮压得深
      s.ts = el.offsetWidth > 240 ? 0.985 : 0.9;
      press = { s, x: e.clientX, y: e.clientY };
      if (el.matches('.ctl, .pill, .round, .path-go')) halo(el);
      run(tick);
    }, { passive: true });

    addEventListener('pointermove', (e) => {
      if (!press) return;
      press.s.tx = rubber(e.clientX - press.x);
      press.s.ty = rubber(e.clientY - press.y);
    }, { passive: true });

    function release() {
      if (!press) return;
      press.s.tx = press.s.ty = 0;
      press.s.ts = 1;
      press = null;
      run(tick);
    }
    addEventListener('pointerup', release, { passive: true });
    addEventListener('pointercancel', release, { passive: true });
    addEventListener('dragstart', (e) => {
      if (e.target.closest && e.target.closest('.elastic')) e.preventDefault();
    });
  })();

  // 凝光：光点带一点延迟地跟着光标流动
  (function light() {
    let cur = null;
    let x = 0, y = 0, tx = 0, ty = 0;

    function tick(dt) {
      if (!cur) return false;
      const a = 1 - Math.exp(-dt * 13);
      x += (tx - x) * a;
      y += (ty - y) * a;
      cur.style.setProperty('--mx', `${x}px`);
      cur.style.setProperty('--my', `${y}px`);
      return Math.abs(tx - x) + Math.abs(ty - y) > 0.3;
    }

    addEventListener('pointermove', (e) => {
      const el = e.target.closest && e.target.closest('.lit');
      if (!el) { cur = null; return; }
      const r = el.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (el !== cur) { cur = el; x = tx; y = ty; }
      run(tick);
    }, { passive: true });
  })();

  window.KnowledgeMap.ui = { h, rich, icon, tag, run, halo, reduced, memory, ICONS };
})();
