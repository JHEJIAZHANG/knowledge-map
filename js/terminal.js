// 终端机区块：卷到画面时逐字打出命令，打完才出现输出
(function () {
  const KM = window.KnowledgeMap;
  const { h, icon, reduced } = KM.ui;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  class Terminal {
    constructor(block) {
      this.run = 0;
      this.entries = block.lines.map((l) => {
        const typed = h('span');
        const caret = h('span', { class: 'term-caret', hidden: true });
        // 尚未打出的字先隐形占位，打字时版面才不会跳动
        const ghost = h('span', { class: 'term-ghost' }, l.cmd);
        const out = l.out ? h('div', { class: `term-out${l.err ? ' err' : ''}` }, l.out) : null;
        const el = h('div', { class: 'term-entry' },
          h('div', { class: 'cmd-line', 'data-cmd': l.cmd, 'data-lang': l.lang || block.lang || ((l.prompt || block.prompt) === '>>>' ? 'py' : null) }, h('span', { class: 'term-prompt' }, `${l.prompt || block.prompt} `), typed, caret, ghost),
          out);
        return { el, typed, caret, ghost, out, chars: Array.from(l.cmd) };
      });

      // 视觉上的打字对屏幕报读隐藏，报读软件直接读完整内容
      const transcript = block.lines.map((l) => `${l.prompt || block.prompt} ${l.cmd}${l.out ? `，输出：${l.out}` : ''}`).join('。');
      this.nodes = [
        h('div', { class: 'sr' }, transcript),
        h('div', { 'aria-hidden': 'true', class: 'term-body' }, this.entries.map((e) => e.el)),
        h('button', { class: 'term-replay elastic', type: 'button', 'aria-label': '重播打字', html: icon('replay'), onclick: () => this.play() }),
      ];
      if (reduced()) this.finish(); else this.reset();
    }

    reset() {
      for (const e of this.entries) {
        e.typed.textContent = '';
        e.ghost.textContent = e.chars.join('');
        e.caret.hidden = true;
        if (e.out) e.out.classList.add('wait');
      }
    }

    finish() {
      for (const e of this.entries) {
        e.typed.textContent = e.chars.join('');
        e.ghost.textContent = '';
        e.caret.hidden = true;
        if (e.out) e.out.classList.remove('wait');
      }
    }

    async play() {
      if (reduced()) { this.finish(); return; }
      const id = ++this.run;
      const stale = () => id !== this.run;
      this.reset();
      for (const e of this.entries) {
        e.caret.hidden = false;
        await wait(320);
        if (stale()) return;
        // 命令越长打得越快，长命令也不会等太久
        const step = Math.min(72, 1300 / e.chars.length);
        for (let i = 1; i <= e.chars.length; i++) {
          e.typed.textContent = e.chars.slice(0, i).join('');
          e.ghost.textContent = e.chars.slice(i).join('');
          await wait(step * (0.65 + Math.random() * 0.7));
          if (stale()) return;
        }
        await wait(240); // 像是按下 Enter 前的停顿
        if (stale()) return;
        e.caret.hidden = true;
        if (e.out) e.out.classList.remove('wait');
        await wait(260);
        if (stale()) return;
      }
    }

    // 第一次卷到画面时开始打字
    watch(el) {
      if (reduced()) return;
      this.io = new IntersectionObserver(([e]) => {
        if (!e.isIntersecting) return;
        this.io.disconnect();
        this.play();
      }, { threshold: 0.3 });
      this.io.observe(el);
    }

    destroy() {
      this.run++;
      if (this.io) this.io.disconnect();
    }
  }

  KM.Terminal = Terminal;
})();
