// 情境短片：用具象的比喻演出一个命令，结尾留一句口诀
//
// 每支片是一串镜头 { cap: 字幕, play: async () => {...} }。
// 跳到某个镜头时，会把前面的镜头「瞬间」跑完，所以任何位置的画面都正确。
(function () {
  const KM = window.KnowledgeMap;
  const { h, icon, tag, reduced, memory } = KM.ui;
  const RATES = [0.75, 1, 1.5];
  const NS = 'http://www.w3.org/2000/svg';

  class Stale extends Error {}

  const E = {
    out: (t) => 1 - (1 - t) ** 3,
    inOut: (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
    back: (t) => { const c = 1.7; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
    line: (t) => t,
  };

  const svg = (tagName, attrs, ...kids) => {
    const el = document.createElementNS(NS, tagName);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, v));
    kids.forEach((k) => el.append(k));
    return el;
  };
  const text = (str, attrs) => svg('text', { 'text-anchor': 'middle', ...attrs }, str);

  // 量出文本实际画出来的宽度（单位和舞台座标相同）。
  // 每台电脑的字体不一样，框的大小要照量到的宽度算，不能用字数去猜。
  let ruler = null;
  function measure(str, cls) {
    if (!ruler) {
      const box = svg('svg', { class: 'film-stage', 'aria-hidden': 'true', style: 'position:absolute;left:-9999px;top:0;width:10px;height:10px;visibility:hidden;pointer-events:none' });
      ruler = svg('text', {});
      box.append(ruler);
      document.body.append(box);
    }
    ruler.setAttribute('class', cls || '');
    ruler.textContent = str;
    return ruler.getComputedTextLength();
  }
  // 没有外框可以对照的文本：直接指定最多能多宽
  function shrink(t, room) {
    const cls = t.getAttribute('class') || '';
    const w = measure(t.textContent, cls);
    if (w > room) t.style.fontSize = `${Math.max(0.55, room / w) * sizeOf(cls)}px`;
  }
  const sizeOf = (cls) => { measure('', cls); return parseFloat(getComputedStyle(ruler).fontSize) || 16; };

  // 置中的文本如果比外面的框宽，就把字缩小到放得下
  function fitText(t) {
    if (t.getAttribute('text-anchor') !== 'middle' || +(t.getAttribute('x') || 0) !== 0) return;
    const y = +(t.getAttribute('y') || 0);
    const cls = t.getAttribute('class') || '';
    const boxes = [...t.parentNode.children]
      .filter((c) => c.tagName === 'rect' && !/f-veil|f-ring/.test(c.getAttribute('class') || ''))
      .map((c) => ({ w: +c.getAttribute('width'), y: +c.getAttribute('y'), h: +c.getAttribute('height') }))
      .filter((b) => b.h >= 24 && b.y <= y - 4 && y <= b.y + b.h)
      .sort((a, b) => a.w * a.h - b.w * b.h);
    if (!boxes.length) return;
    const room = boxes[0].w - Math.min(72, Math.max(20, boxes[0].w * 0.11));
    const w = measure(t.textContent, cls);
    t.style.fontSize = w > room ? `${Math.max(0.55, room / w) * sizeOf(cls)}px` : '';
  }

  class Movie {
    constructor(block) {
      this.id = block.film;
      this.film = FILMS[block.film];
      this.idx = -1;
      this.token = 0;
      this.playing = false;
      this.paused = false;
      this.instant = false;

      this.stage = svg('svg', { class: 'film-stage', viewBox: '0 0 960 480', role: 'img', 'aria-label': this.film.title });
      this.note = h('div', { class: 'run-note film-cap', 'aria-live': 'polite' });

      this.build();
      this.segs = this.shots.map((_, n) => {
        const b = h('button', { class: 'seg', type: 'button', 'aria-label': `第 ${n + 1} 个镜头`, onclick: () => this.jump(n) }, h('i', {}, h('b')));
        return b;
      });
      const ctl = (label, name, fn, extra) =>
        h('button', { type: 'button', class: `ctl elastic ${extra || ''}`, 'aria-label': label, html: icon(name), onclick: fn });
      this.btnPrev = ctl('上一个镜头', 'stepBack', () => this.jump(this.idx - 1));
      this.btnPlay = ctl('播放', 'play', () => this.toggle(), 'primary');
      this.btnNext = ctl('下一个镜头', 'stepNext', () => this.jump(this.idx + 1));
      this.btnRestart = ctl('重新开始', 'replay', () => this.jump(-1), 'restart');
      this.count = h('span', { class: 'bar-count' });
      this.btnRate = h('button', { type: 'button', class: 'ctl elastic rate', 'aria-label': '播放速度', onclick: () => Movie.setRate(RATES[(RATES.indexOf(Movie.rate) + 1) % RATES.length]) }, rateLabel());
      this.btnFull = ctl('全屏', 'expand', () => this.fullscreen(), 'full');

      this.seenTag = tag('已看过', 'checkCircle', 'plain seen');
      this.seenTag.hidden = !Movie.seen.has(this.id);
      this.btnAgain = h('button', { type: 'button', class: 'end-btn elastic', html: icon('replay'), onclick: () => this.playFrom(0, true) }, '再看一次');
      this.btnNextFilm = h('button', { type: 'button', class: 'end-btn primary elastic', html: icon('forward'), onclick: () => this.goNextFilm() }, '下一段');
      this.end = h('div', { class: 'film-end' }, this.btnAgain, this.btnNextFilm);
      this.stage.addEventListener('click', () => this.toggle());

      this.head = h('header', { class: 'run-head' }, tag('情境动画', 'film'), h('h3', {}, this.film.title), this.seenTag,
        h('span', { class: 'run-hint' }, '空白键播放，左右键换镜头，F 全屏'));
      this.el = h('section', { class: 'run film cell reveal lit', style: '--span:12', tabindex: '0', 'data-film': this.id, 'aria-label': `情境动画：${this.film.title}` },
        this.head,
        h('div', { class: 'film-frame' }, this.stage, this.end),
        this.note,
        h('div', { class: 'bar' }, this.btnPrev, this.btnPlay, this.btnNext, h('div', { class: 'segs' }, this.segs), this.count, this.btnRate, this.btnFull, this.btnRestart));
      this.el.movie = this;

      this.el.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        const onButton = Boolean(e.target.closest('button'));
        if (e.key === 'ArrowRight') { e.preventDefault(); if (this.idx < this.shots.length - 1) this.jump(this.idx + 1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); if (this.idx >= 0) this.jump(this.idx - 1); }
        else if (e.key === ' ' && !onButton) { e.preventDefault(); this.toggle(); }
        else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this.fullscreen(); }
      });
      this.el.addEventListener('fullscreenchange', () => {
        const on = document.fullscreenElement === this.el;
        this.btnFull.innerHTML = icon(on ? 'shrink' : 'expand');
        this.btnFull.setAttribute('aria-label', on ? '离开全屏' : '全屏');
      });

      this.io = new IntersectionObserver(([e]) => { if (!e.isIntersecting && this.playing) this.setPaused(true); }, { threshold: 0.2 });
      this.io.observe(this.el);
      // 切到别的分页时先停住，回来再接着播
      this.onVisible = () => {
        if (document.hidden) {
          if (this.playing && !this.paused) { this.setPaused(true); this.away = true; }
        } else if (this.away) {
          this.away = false;
          this.setPaused(false);
        }
      };
      document.addEventListener('visibilitychange', this.onVisible);
      this.paint();
      if (KM.ui.reduced()) this.storyboard();
    }

    // 减少动态时：不播动画，把每个镜头演完的画面排成分镜图
    async storyboard() {
      const frames = [];
      for (let k = 0; k < this.shots.length; k++) {
        await this.seek(k);
        const pic = this.stage.cloneNode(true);
        pic.setAttribute('aria-hidden', 'true');
        frames.push(h('figure', { class: 'frame' },
          h('div', { class: 'film-frame' }, pic),
          h('figcaption', {}, h('b', {}, String(k + 1)), h('span', { html: this.shots[k].cap }))));
      }
      this.el.classList.add('board');
      this.el.removeAttribute('tabindex');
      this.el.replaceChildren(this.head, h('div', { class: 'frames' }, frames));
      this.head.querySelector('.run-hint').textContent = '已关闭动态，改用分镜图';
    }

    fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (this.el.requestFullscreen) this.el.requestFullscreen().catch(() => {});
    }

    goNextFilm() {
      const all = [...document.querySelectorAll('.film:not(.board)')];
      const next = all[all.indexOf(this.el) + 1];
      if (!next) return;
      if (document.fullscreenElement) document.exitFullscreen();
      next.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
      next.focus({ preventScroll: true });
      setTimeout(() => { if (next.isConnected) next.movie.playFrom(0, true); }, 650);
    }

    // 字幕提到的名字，在舞台上找到同名的东西亮一下
    sync(words, source) {
      const list = [...this.stage.querySelectorAll('text')].filter((t) => {
        if (t.closest('.f-memo-g')) return false;
        const a = t.textContent.trim();
        return a && words.some((w) => a === w || a.includes(w) || (a.length >= 3 && w.includes(a)));
      });
      [...list, ...(source || [])].forEach((n) => {
        n.classList.remove('f-sync');
        void n.getBoundingClientRect();
        n.classList.add('f-sync');
      });
    }

    syncCaption() {
      const codes = [...this.note.querySelectorAll('code')];
      if (codes.length) this.sync(codes.map((c) => c.textContent.trim()), codes);
    }

    // 舞台工具 -----------------------------------------------------------------
    build() {
      this.stage.replaceChildren();
      this.actors = [];
      this.set();
      this.shots = this.film.make(this);
      this.stage.querySelectorAll('g > text').forEach(fitText);
    }

    // 场景：画出地板
    set() {
      this.stage.append(svg('path', { d: 'M24 468H936', class: 'f-floor' }));
    }

    actor(node, init) {
      const a = { node, x: 0, y: 0, s: 1, r: 0, o: 1, ...init };
      this.stage.append(node);
      this.applyActor(a);
      return a;
    }

    applyActor(a) {
      a.node.setAttribute('transform', `translate(${a.x} ${a.y}) rotate(${a.r}) scale(${a.s})`);
      a.node.setAttribute('opacity', Math.max(0, Math.min(1, a.o)));
    }

    to(a, props, ms = 700, ease = E.out) {
      if (this.instant || reduced()) {
        Object.assign(a, props);
        this.applyActor(a);
        return Promise.resolve();
      }
      const my = this.token;
      const from = {};
      Object.keys(props).forEach((k) => { from[k] = a[k]; });
      return new Promise((resolve, reject) => {
        let t = 0;
        let last = performance.now();
        const tick = (now) => {
          if (my !== this.token) { reject(new Stale()); return; }
          if (!this.paused) t += Math.min(100, now - last) * Movie.rate;
          last = now;
          const p = Math.min(1, t / ms);
          const e = ease(p);
          Object.keys(props).forEach((k) => { a[k] = from[k] + (props[k] - from[k]) * e; });
          this.applyActor(a);
          if (p < 1) requestAnimationFrame(tick); else resolve();
        };
        requestAnimationFrame(tick);
      });
    }

    wait(ms) {
      if (this.instant || reduced()) return Promise.resolve();
      const dummy = { node: svg('g'), x: 0, y: 0, s: 1, r: 0, o: 1 };
      return this.to(dummy, { x: 1 }, ms, E.line);
    }

    async type(tspan, str) {
      if (this.instant || reduced()) { tspan.textContent = str; this.clearSign(tspan); return; }
      const chars = Array.from(str);
      for (let i = 1; i <= chars.length; i++) {
        tspan.textContent = chars.slice(0, i).join('');
        this.clearSign(tspan);
        await this.wait(Math.min(46, 800 / chars.length));
      }
    }

    // 打的命令太长、快碰到门牌时，门牌先淡出
    clearSign(tspan) {
      const line = tspan.parentNode;
      if (!line || !line.isConnected) return;
      // 连终端机都放不下时，把字缩小
      line.style.fontSize = '';
      const x = +line.getAttribute('x');
      const w = line.getComputedTextLength();
      if (x + w > 910) line.style.fontSize = `${parseFloat(getComputedStyle(line).fontSize) * (910 - x) / w}px`;
    }

    // 控制 ---------------------------------------------------------------------
    paint() {
      const atEnd = this.idx === this.shots.length - 1 && !this.playing;
      const running = this.playing && !this.paused;
      const name = running ? 'pause' : atEnd ? 'replay' : 'play';
      if (name !== this.icon) { this.icon = name; this.btnPlay.innerHTML = icon(name); }
      this.btnPlay.setAttribute('aria-label', running ? '暂停' : atEnd ? '重看一次' : '播放');
      this.btnPrev.disabled = this.idx < 0;
      this.btnNext.disabled = this.idx >= this.shots.length - 1;
      this.btnRestart.disabled = this.idx < 0;
      this.count.textContent = this.idx < 0 ? '开始' : `${this.idx + 1} / ${this.shots.length}`;
      this.segs.forEach((s, n) => s.classList.toggle('full', n <= this.idx));
      const cap = this.idx < 0 ? '按下播放，看看这个命令在做什么。' : this.shots[this.idx].cap;
      if (cap !== this.cap) {
        this.cap = cap;
        this.note.innerHTML = `${icon('film')}<span>${cap}</span>`;
        this.note.querySelectorAll('code').forEach((c) => c.addEventListener('mouseenter', () => this.sync([c.textContent.trim()])));
      }
      this.end.classList.toggle('show', atEnd);
      this.btnNextFilm.hidden = !atEnd || [...document.querySelectorAll('.film:not(.board)')].pop() === this.el;
    }

    // 把画面还原到「第 n 个镜头演完」的状态
    async seek(n) {
      this.token += 1;
      this.build();
      this.instant = true;
      for (let k = 0; k <= n; k++) await this.shots[k].play();
      this.instant = false;
      this.idx = n;
      this.paint();
    }

    setPaused(v) { this.paused = v; this.away = false; this.paint(); }

    toggle() {
      if (this.playing) { this.setPaused(!this.paused); return; }
      this.playFrom(this.idx >= this.shots.length - 1 ? 0 : this.idx + 1, true);
    }

    jump(n) {
      if (n < 0) { this.playing = false; this.seek(-1); return; }
      this.playFrom(n, false);
    }

    async playFrom(n, auto) {
      await this.seek(n - 1);
      const my = this.token;
      this.playing = true;
      this.paused = false;
      try {
        for (let k = n; k < this.shots.length; k++) {
          this.idx = k;
          this.paint();
          await this.shots[k].play();
          this.syncCaption();
          if (k === this.shots.length - 1) { Movie.markSeen(this.id); this.seenTag.hidden = false; }
          if (!auto) break;
          if (k < this.shots.length - 1) await this.wait(this.shots[k].hold || 1200);
        }
      } catch (e) {
        if (!(e instanceof Stale)) throw e;
        return;
      }
      if (my === this.token) { this.playing = false; this.paint(); }
    }

    destroy() {
      this.token += 1;
      this.io.disconnect();
      document.removeEventListener('visibilitychange', this.onVisible);
    }

    // 共用道具 -----------------------------------------------------------------
    // ps：提示字符。Python 交互模式用 '>>> '
    terminal(ps = 'labex:project/ $ ') {
      const typed = svg('tspan', { class: 'f-typed' });
      const prompt = svg('tspan', { class: 'f-ps' }, ps);
      const line = svg('text', { x: 56, y: 53, class: 'f-mono' }, prompt, typed);
      this.actor(svg('g', {}, svg('rect', { x: 30, y: 18, width: 900, height: 56, rx: 16, class: 'f-term' }), line));
      typed.prompt = prompt;
      return typed;
    }

    robot(init) {
      const eyes = svg('g', { class: 'f-eyes' },
        svg('rect', { x: -19, y: -32, width: 11, height: 18, rx: 5.5, class: 'f-eye' }),
        svg('rect', { x: 8, y: -32, width: 11, height: 18, rx: 5.5, class: 'f-eye' }));
      const bob = svg('g', { class: 'f-bob' },
        svg('rect', { x: -24, y: -72, width: 48, height: 20, rx: 8, class: 'f-acc2' }),
        svg('rect', { x: -24, y: -60, width: 48, height: 5, class: 'f-cap-band' }),
        svg('circle', { cx: 0, cy: -74, r: 5, class: 'f-acc' }),
        svg('rect', { x: -44, y: -56, width: 88, height: 60, rx: 24, class: 'f-acc' }),
        svg('rect', { x: -34, y: -46, width: 68, height: 40, rx: 15, class: 'f-face' }),
        eyes,
        svg('rect', { x: -24, y: 8, width: 48, height: 30, rx: 13, class: 'f-acc2' }),
        svg('circle', { cx: -34, cy: 22, r: 8, class: 'f-acc2' }),
        svg('circle', { cx: 34, cy: 22, r: 8, class: 'f-acc2' }));
      return this.actor(svg('g', {}, bob), init);
    }

    doc(name, init, fresh) {
      const label = text(name, { x: 0, y: 84, class: 'f-label' });
      const node = svg('g', { class: fresh ? 'f-doc fresh' : 'f-doc' },
        svg('rect', { x: -52, y: -64, width: 104, height: 128, rx: 16, class: 'f-ring' }),
        svg('path', { d: 'M-34 -58h44l24 24v80a12 12 0 0 1-12 12h-56a12 12 0 0 1-12-12v-92a12 12 0 0 1 12-12z', class: 'f-paper' }),
        svg('path', { d: 'M10 -58v24h24z', class: 'f-fold' }),
        svg('rect', { x: -28, y: -22, width: 56, height: 7, rx: 3.5, class: 'f-ink' }),
        svg('rect', { x: -28, y: -6, width: 56, height: 7, rx: 3.5, class: 'f-ink' }),
        svg('rect', { x: -28, y: 10, width: 36, height: 7, rx: 3.5, class: 'f-ink' }),
        label);
      const a = this.actor(node, init);
      a.label = label;
      return a;
    }

    folder(name, init) {
      const node = svg('g', {},
        svg('rect', { x: -80, y: -58, width: 160, height: 116, rx: 14, class: 'f-folder' }),
        svg('rect', { x: -64, y: -42, width: 34, height: 28, rx: 6, class: 'f-door' }),
        svg('path', { d: 'M22 58V-14a8 8 0 0 1 8-8h24a8 8 0 0 1 8 8V58', class: 'f-door' }),
        svg('circle', { cx: 54, cy: 22, r: 3.5, class: 'f-acc' }),
        text(name, { x: 0, y: 92, class: 'f-label' }));
      return this.actor(node, init);
    }

    badge(str, x, y) {
      const w = Math.max(Array.from(str).length * 20, measure(str, 'f-badge-text')) + 36;
      const node = svg('g', {}, svg('rect', { x: -w / 2, y: -20, width: w, height: 40, rx: 20, class: 'f-badge' }), text(str, { x: 0, y: 7, class: 'f-badge-text' }));
      return this.actor(node, { x, y, s: 0.6, o: 0 });
    }

    memo(big, small) {
      this.film.memo = { big, small };
      const node = svg('g', { class: 'f-memo-g' },
        svg('rect', { x: -700, y: -420, width: 1400, height: 840, class: 'f-veil' }),
        svg('rect', { x: -330, y: -110, width: 660, height: 220, rx: 36, class: 'f-memo' }),
        text('记忆口诀', { x: 0, y: -60, class: 'f-memo-tag' }),
        text(big, { x: 0, y: 8, class: 'f-memo-big' }),
        text(small, { x: 0, y: 66, class: 'f-memo-small' }));
      return this.actor(node, { x: 480, y: 250, s: 0.8, o: 0 });
    }

    slip(init) {
      const node = svg('g', {}, svg('rect', { x: -44, y: -18, width: 88, height: 36, rx: 12, class: 'f-slip' }), text('工单', { x: 0, y: 6, class: 'f-slip-text' }));
      return this.actor(node, { s: 0.5, o: 0, ...init });
    }

    // 工单从终端机飞到机器人手上，之后消失
    async deliver(slip, bot) {
      await this.to(slip, { o: 1, s: 1 }, 220);
      await this.to(slip, { x: bot.x, y: bot.y + 30 }, 620, E.inOut);
      await this.to(slip, { o: 0, s: 0.5 }, 220);
    }

    glow(a, on) { a.node.classList.toggle('glow', on); }
    pop(a) { return this.to(a, { s: 1, o: 1 }, 420, E.back); }
  }

  // 片库 ---------------------------------------------------------------------
  const FILMS = {
    cp: {
      title: 'cp 就是复印机',
      make(m) {
        const typed = m.terminal();
        m.actor(svg('rect', { x: -58, y: -72, width: 116, height: 144, rx: 18, class: 'f-slot' }), { x: 800, y: 270 });
        const empty = m.actor(text('这里还是空的', { x: 0, y: 6, class: 'f-hint' }), { x: 800, y: 270 });
        shrink(empty.node, 98);
        const copy = m.doc('file1_copy.txt', { x: 590, y: 360, s: 0.5, o: 0 }, true);
        m.actor(svg('g', {},
          svg('rect', { x: -70, y: -74, width: 140, height: 24, rx: 8, class: 'f-glass' }),
          svg('rect', { x: -96, y: -50, width: 192, height: 118, rx: 20, class: 'f-machine' }),
          svg('rect', { x: 88, y: -6, width: 12, height: 44, rx: 5, class: 'f-face' }),
          svg('circle', { cx: -66, cy: 34, r: 8, class: 'f-acc' }),
          text('复印机', { x: 6, y: 24, class: 'f-machine-text' })), { x: 480, y: 372 });
        const src = m.doc('file1.txt', { x: 170, y: 270 });
        const light = m.actor(svg('rect', { x: -4, y: -62, width: 8, height: 124, rx: 4, class: 'f-light' }), { x: 432, y: 196, o: 0 });
        const bot = m.robot({ x: 310, y: 170 });
        const slip = m.slip({ x: 300, y: 72 });
        const keep = m.badge('原文件还在', 170, 425);
        const add = m.badge('多了一份', 800, 425);
        const memo = m.memo('cp ＝ 复印', '原文件还在，又多一份');
        return [
          { cap: '你写下工单：把 <code>file1.txt</code> 复制成 <code>file1_copy.txt</code>。小机器人（Shell）收到了。',
            play: async () => { await m.type(typed, 'cp file1.txt file1_copy.txt'); await m.deliver(slip, bot); } },
          { cap: '工单上先写的是<strong>来源</strong>，所以先去找 <code>file1.txt</code>。',
            play: async () => { await m.to(bot, { x: 170, y: 150 }, 850, E.inOut); m.glow(src, true); await m.wait(350); } },
          { cap: '把原稿放上复印机，扫描里面的内容。',
            play: async () => {
              m.glow(src, false);
              await Promise.all([m.to(src, { x: 480, y: 196 }, 950, E.inOut), m.to(bot, { x: 330, y: 150 }, 950, E.inOut)]);
              await m.to(light, { o: 1 }, 160);
              await m.to(light, { x: 528 }, 620, E.inOut);
              await m.to(light, { x: 432 }, 620, E.inOut);
              await m.to(light, { o: 0 }, 160);
            } },
          { cap: '<strong>原稿拿回原位</strong>，新的那一份从出纸口滑出来，放到目的地。',
            play: async () => {
              await m.to(copy, { o: 1, s: 0.7 }, 200);
              await Promise.all([
                m.to(src, { x: 170, y: 270 }, 900, E.inOut),
                m.to(bot, { x: 300, y: 150 }, 900, E.inOut),
                m.to(copy, { x: 800, y: 270, s: 1 }, 1000, E.inOut),
                m.to(empty, { o: 0 }, 400),
              ]);
            } },
          { cap: '结果：<code>file1.txt</code> 完全没有动，旁边多了一份新的。',
            play: async () => { m.glow(src, true); m.glow(copy, true); await Promise.all([m.pop(keep), m.pop(add)]); }, hold: 1500 },
          { cap: '<code>cp</code> 就是复印：原文件还在，又多一份。',
            play: async () => { m.glow(src, false); m.glow(copy, false); await m.to(memo, { s: 1, o: 1 }, 480, E.back); } },
        ];
      },
    },

    mv: {
      title: 'mv 就是搬家',
      make(m) {
        const typed = m.terminal();
        const ghost = m.actor(svg('g', {},
          svg('rect', { x: -58, y: -72, width: 116, height: 144, rx: 18, class: 'f-slot' }),
          text('这里空了', { x: 0, y: 6, class: 'f-hint' })), { x: 190, y: 270, o: 0 });
        const folder = m.folder('testdir/', { x: 780, y: 290 });
        const file = m.doc('file1.txt', { x: 190, y: 270 });
        const bot = m.robot({ x: 370, y: 160 });
        const slip = m.slip({ x: 300, y: 72 });
        const slip2 = m.slip({ x: 300, y: 72 });
        const one = m.badge('全程只有一份', 780, 432);
        const memo = m.memo('mv ＝ 搬家', '永远只有一份，改名也是搬家');
        return [
          { cap: '第一张工单：把 <code>file1.txt</code> 换成 <code>newname.txt</code>。',
            play: async () => { await m.type(typed, 'mv file1.txt newname.txt'); await m.deliver(slip, bot); } },
          { cap: '目的地不是房间（目录），所以留在原地，<strong>只把名牌换掉</strong>。还是同一张纸。',
            play: async () => {
              await m.to(bot, { x: 190, y: 150 }, 800, E.inOut);
              m.glow(file, true);
              await m.to(file, { s: 1.1 }, 260);
              file.label.textContent = 'newname.txt';
              await m.to(file, { s: 1 }, 420, E.back);
              m.glow(file, false);
            } },
          { cap: '第二张工单：把 <code>newname.txt</code> 搬进 <code>testdir/</code>。',
            play: async () => { typed.textContent = ''; await m.type(typed, 'mv newname.txt testdir/'); await m.to(slip2, { x: bot.x, y: 72 }, 1); await m.deliver(slip2, bot); } },
          { cap: '这次目的地是一间房间（目录）。机器人把纸<strong>拿起来带走</strong>，原本的位置就空了。',
            play: async () => {
              await Promise.all([m.to(ghost, { o: 1 }, 420), m.to(file, { y: 235 }, 420, E.out), m.to(bot, { y: 150 }, 420, E.out)]);
              await Promise.all([m.to(file, { x: 780, y: 235 }, 1300, E.inOut), m.to(bot, { x: 780, y: 150 }, 1300, E.inOut)]);
            } },
          { cap: '放进房间。全程都是同一张纸，没有多出任何一份。',
            play: async () => {
              await Promise.all([m.to(file, { y: 288, s: 0.42, o: 0 }, 620, E.inOut), m.to(bot, { x: 560, y: 160 }, 620, E.inOut)]);
              await m.to(folder, { s: 1.1 }, 180);
              await m.to(folder, { s: 1 }, 360, E.back);
              await m.pop(one);
            }, hold: 1500 },
          { cap: '<code>mv</code> 就是搬家：永远只有一份。留在原地换名字，也算搬家。',
            play: async () => { await m.to(memo, { s: 1, o: 1 }, 480, E.back); } },
        ];
      },
    },

    rm: {
      title: 'rm 就是碎纸机',
      make(m) {
        const typed = m.terminal();
        const file = m.doc('original_file1.txt', { x: 200, y: 270 });
        const strips = [-48, -24, 0, 24, 48].map((dx, i) =>
          m.actor(svg('rect', { x: -5, y: -24, width: 10, height: 48, rx: 4, class: 'f-strip' }), { x: 620 + dx, y: 348, o: 0, r: i % 2 ? 7 : -7 }));
        const front = m.actor(svg('g', {},
          svg('rect', { x: -100, y: -34, width: 200, height: 84, rx: 18, class: 'f-machine' }),
          svg('rect', { x: -70, y: -34, width: 140, height: 9, rx: 4, class: 'f-face' }),
          text('碎纸机', { x: 0, y: 24, class: 'f-machine-text' })), { x: 620, y: 300 });
        const bot = m.robot({ x: 380, y: 160 });
        const slip = m.slip({ x: 300, y: 72 });
        const bin = m.actor(svg('g', {},
          svg('path', { d: 'M-22 -14h44l-5 44a6 6 0 0 1-6 5h-22a6 6 0 0 1-6-5z', class: 'f-bin' }),
          svg('rect', { x: -28, y: -24, width: 56, height: 9, rx: 4.5, class: 'f-bin' }),
          svg('circle', { cx: 0, cy: 4, r: 46, class: 'f-no' }),
          svg('line', { x1: -32, y1: 37, x2: 32, y2: -29, class: 'f-no' }),
          text('没有回收桶', { x: 0, y: 84, class: 'f-warn-text' })), { x: 840, y: 280, s: 0.6, o: 0 });
        const memo = m.memo('rm ＝ 碎纸机', '没有回收桶，删了就没了');
        return [
          { cap: '你写下工单：删除 <code>original_file1.txt</code>。',
            play: async () => { await m.type(typed, 'rm original_file1.txt'); await m.deliver(slip, bot); } },
          { cap: '机器人找到文件。注意：<strong>它不会问你确定吗</strong>。',
            play: async () => { await m.to(bot, { x: 200, y: 150 }, 850, E.inOut); m.glow(file, true); await m.wait(450); m.glow(file, false); } },
          { cap: '直接拿去碎纸机。',
            play: async () => { await Promise.all([m.to(file, { x: 620, y: 170 }, 1200, E.inOut), m.to(bot, { x: 440, y: 150 }, 1200, E.inOut)]); } },
          { cap: '纸被卷进去，变成碎片。没有成功消息，提示字符直接回来。',
            play: async () => {
              await Promise.all([m.to(file, { y: 300, s: 0.9 }, 800, E.line), m.wait(800)]);
              await m.to(file, { o: 0 }, 1);
              await Promise.all(strips.map((st, i) => (async () => {
                await m.wait(i * 90);
                await m.to(st, { o: 1, y: 385 }, 360, E.out);
                await m.to(st, { y: 450, o: 0 }, 520, E.inOut);
              })()));
            } },
          { cap: '电脑桌面的回收桶救得回来，<strong><code>rm</code> 救不回来</strong>。',
            play: async () => { await m.to(bin, { s: 1, o: 1 }, 460, E.back); }, hold: 1600 },
          { cap: '<code>rm</code> 就是碎纸机：没有回收桶，删了就没了。',
            play: async () => { await m.to(memo, { s: 1, o: 1 }, 480, E.back); } },
        ];
      },
    },
  };

  // 播放速度：所有短片共用，会记住
  const rateLabel = () => `${Movie.rate}×`;
  Movie.rate = RATES.includes(memory.get('km-rate')) ? memory.get('km-rate') : 1;
  Movie.setRate = (r) => {
    Movie.rate = r;
    memory.set('km-rate', r);
    document.querySelectorAll('.ctl.rate').forEach((b) => { b.textContent = rateLabel(); });
  };

  // 看过的短片
  Movie.seen = new Set(memory.get('km-seen', []));
  Movie.markSeen = (id) => {
    if (Movie.seen.has(id)) return;
    Movie.seen.add(id);
    memory.set('km-seen', [...Movie.seen]);
  };

  // 取出某支片的口诀（不用真的播放）
  Movie.memoOf = (id) => {
    const film = FILMS[id];
    if (film && !film.memo) {
      const m = Object.create(Movie.prototype);
      Object.assign(m, { film, stage: svg('svg'), actors: [], instant: true });
      film.make(m);
    }
    return film ? film.memo : null;
  };

  Movie.films = FILMS;
  Movie.tools = { E, svg, text, measure, shrink };
  KM.Movie = Movie;
})();
