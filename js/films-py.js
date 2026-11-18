// Python 的情境短片
// 写法和 js/films.js 相同，共用 Movie.prototype 上的道具
(function () {
  const { Movie } = window.KnowledgeMap;
  const { E, svg, text, measure } = Movie.tools;
  const PS = '>>> ';
  const SHELL = 'labex:project/ $ ';
  const shot = (cap, play, hold) => ({ cap, play, hold });

  Object.assign(Movie.prototype, {
    // 值：一个装着东西的盒子
    box(str, init) {
      const label = text(str, { y: 8, class: 'f-line' });
      // 等宽字：照字数估也算一次，连续空格量不准时才不会太窄
      const w = Math.max(130, measure(str, 'f-line') + 48, Array.from(str).length * 12.8 + 40);
      const a = this.g([svg('rect', { x: -w / 2, y: -40, width: w, height: 80, rx: 18, class: 'f-card' }), label], { s: 0.6, o: 0, ...init });
      a.label = label;
      return a;
    },
    // 名牌：下面有一条线绑在盒子上。挂在盒子上时，名牌的 y 是盒子的 y 减 84
    nametag(name, init) {
      const w = measure(name, 'f-chip-text') + 34;
      return this.g([
        svg('path', { d: 'M0 18V44', class: 'f-stroke' }),
        svg('rect', { x: -w / 2, y: -18, width: w, height: 36, rx: 12, class: 'f-chip' }),
        text(name, { y: 6, class: 'f-chip-text' }),
      ], { s: 0.7, o: 0, ...init });
    },
    // 换提示字符：进出 Python 时用
    prompt(typed, ps) { typed.prompt.textContent = ps; typed.textContent = ''; },
  });

  Object.assign(Movie.films, {
    python: {
      title: 'python 就是搭电梯上楼',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: -78, y: -170, width: 156, height: 340, rx: 18, class: 'f-shaft' })], { x: 480, y: 270 });
        m.g([svg('path', { d: 'M0 0H330', class: 'f-stroke' })], { x: 50, y: 404 });
        m.g([svg('path', { d: 'M0 0H330', class: 'f-stroke' })], { x: 580, y: 270 });
        m.t('楼下・Shell', { x: 215, y: 436 }, 'f-hint');
        m.t('楼上・Python', { x: 745, y: 300 }, 'f-hint');
        const level = m.t('1F', { x: 480, y: 128 }, 'f-line');
        const car = m.g([svg('rect', { x: -62, y: -84, width: 124, height: 130, rx: 14, class: 'f-hl' })], { x: 480, y: 358, o: 0.5 });
        const banner = m.screen('Python 3.10.12 … on linux', 745, 372);
        const c = m.crew(typed, 'python', '你在一楼的服务台（Shell）打 <code>python</code>。', { x: 215, y: 362 });
        const end = m.closing('python ＝ 搭电梯上楼', '看到 >>> 就说 Python，exit() 下楼');
        return [c.shot,
          shot('<code>python</code> 不是做完就结束的命令。它会带你搭电梯上楼，换一位只听得懂 Python 的柜员。', async () => {
            await m.to(c.bot, { x: 480 }, 900, E.inOut);
            await m.to(car, { o: 1 }, 200);
            for (const f of ['2F', '3F', '4F']) {
              await Promise.all([m.to(c.bot, { y: c.bot.y - 44 }, 420, E.inOut), m.to(car, { y: car.y - 44 }, 420, E.inOut)]);
              level.node.textContent = f;
            }
          }),
          shot('门一开，先印出版本号。提示字符变成 <code>&gt;&gt;&gt;</code>，代表柜员在等你说下一句 Python。', async () => {
            await m.to(c.bot, { x: 745 }, 900, E.inOut);
            await m.appear(banner);
            m.prompt(typed, PS);
          }, 1500),
          shot('在这里打的都是 Python。要回一楼，打 <code>exit()</code>，括号不能省。', async () => {
            await m.type(typed, 'exit()');
            await m.fade(banner);
            await m.to(c.bot, { x: 480 }, 800, E.inOut);
            for (const f of ['3F', '2F', '1F']) {
              await Promise.all([m.to(c.bot, { y: c.bot.y + 44 }, 380, E.inOut), m.to(car, { y: car.y + 44 }, 380, E.inOut)]);
              level.node.textContent = f;
            }
            await m.to(c.bot, { x: 215 }, 800, E.inOut);
            m.prompt(typed, SHELL);
          }),
          end];
      },
    },

    pyvar: {
      title: '变量就是挂名牌',
      make(m) {
        const typed = m.terminal(PS);
        const b42 = m.box('42', { x: 220, y: 330 });
        const b100 = m.box('100', { x: 480, y: 330 });
        const alice = m.box("'Alice'", { x: 760, y: 330 });
        const tx = m.nametag('x', { x: 220, y: 150 });
        const ty = m.nametag('y', { x: 520, y: 150 });
        const tn = m.nametag('name', { x: 760, y: 150 });
        const lonely = m.t('没有名牌了', { x: 220, y: 410 }, 'f-hint');
        lonely.o = 0;
        m.applyActor(lonely);
        const end = m.closing('= ＝ 挂名牌', '右边先算好，再把左边的名字挂上去');
        return [
          shot('打 <code>x = 42</code>。Python 先看等号<strong>右边</strong>，准备好一个装着 42 的盒子。', async () => {
            await m.type(typed, 'x = 42');
            await m.appear(b42);
          }),
          shot('再把名牌 <code>x</code> 挂上去。<code>=</code> 不是「等于」，是「把名字挂上」。之后打 <code>x</code> 就会拿到 42。', async () => {
            await m.appear(tx);
            await m.to(tx, { y: 246 }, 600, E.back);
          }),
          shot('<code>x = 100</code>：名牌拔下来，改挂到新的值上。42 没有名牌了，之后再也拿不到它。', async () => {
            await m.retype(typed, 'x = 100');
            await m.appear(b100);
            await m.to(tx, { x: 480, y: 246 }, 900, E.inOut);
            await Promise.all([m.to(b42, { o: 0.35 }, 400), m.to(lonely, { o: 1 }, 400)]);
          }),
          shot('<code>y = x</code>：没有复制出另一个 100，而是在<strong>同一个盒子</strong>上多挂一个名牌 <code>y</code>。', async () => {
            await m.retype(typed, 'y = x');
            await m.to(tx, { x: 450 }, 300, E.inOut);
            await m.appear(ty);
            await m.to(ty, { x: 510, y: 246 }, 600, E.back);
          }, 1400),
          shot('文本要加引号：<code>name = "Alice"</code>。名牌 <code>name</code> 挂在文本 <code>\'Alice\'</code> 上。', async () => {
            await m.retype(typed, 'name = "Alice"');
            await m.appear(alice);
            await m.appear(tn);
            await m.to(tn, { y: 246 }, 600, E.back);
          }),
          end];
      },
    },

    pyprint: {
      title: 'print 就是广播',
      make(m) {
        const typed = m.terminal(PS);
        m.g([
          svg('path', { d: 'M-46 -26h26l44 -34v120l-44 -34h-26z', class: 'f-machine' }),
          svg('path', { d: 'M40 -20q18 20 0 40M54 -36q32 36 0 72', class: 'f-stroke', fill: 'none' }),
        ], { x: 150, y: 250 });
        const hello = m.chip('"Hello, LabEx!"', 520, 230);
        const said = m.chip('"My name is"', 420, 230);
        const nm = m.chip('name', 640, 230);
        const tag = m.t('名牌 name 挂着 Alice', { x: 640, y: 290 }, 'f-hint');
        tag.o = 0;
        m.applyActor(tag);
        const out1 = m.screen('Hello, LabEx!', 520, 420);
        const out2 = m.screen('My name is Alice', 520, 420);
        const c = m.crew(typed, 'print("Hello, LabEx!")', '<code>print()</code>：把括号里的东西用广播念出来。', { x: 300, y: 250 });
        const end = m.closing('print ＝ 广播', '念出内容，引号不念，逗号变空格');
        return [c.shot,
          shot('括号里是文本 <code>"Hello, LabEx!"</code>。引号只是告诉 Python「这是一段文本」。', async () => { await m.appear(hello); }),
          shot('念出来的时候<strong>不念引号</strong>。画面上印出 <code>Hello, LabEx!</code>。', async () => {
            hello.node.querySelector('text').textContent = 'Hello, LabEx!';
            await m.shake(hello);
            await m.appear(out1);
          }, 1300),
          shot('<code>print("My name is", name)</code>：逗号隔开两样东西。<code>name</code> 没有引号，所以是名牌，要先换成它挂着的值。', async () => {
            await m.retype(typed, 'print("My name is", name)');
            await Promise.all([m.fade(hello), m.fade(out1)]);
            await Promise.all([m.appear(said), m.appear(nm)]);
            await m.to(tag, { o: 1 }, 300);
            nm.node.querySelector('text').textContent = 'Alice';
            await m.shake(nm);
          }),
          shot('两样东西中间，<code>print</code> 会<strong>自动补一个空格</strong>，印出 <code>My name is Alice</code>。', async () => {
            said.node.querySelector('text').textContent = 'My name is';
            await m.to(tag, { o: 0 }, 200);
            await Promise.all([m.to(said, { x: 450 }, 500, E.inOut), m.to(nm, { x: 610 }, 500, E.inOut)]);
            await m.appear(out2);
          }, 1500),
          end];
      },
    },

    pyinput: {
      title: 'input 就是递问卷',
      make(m) {
        const typed = m.terminal(PS);
        const answer = svg('tspan', {});
        const form = m.g([
          svg('rect', { x: -170, y: -70, width: 340, height: 140, rx: 20, class: 'f-card' }),
          text('What is your name?', { y: -18, class: 'f-line' }),
          svg('path', { d: 'M-110 40H110', class: 'f-stroke' }),
          svg('text', { y: 30, class: 'f-line', 'text-anchor': 'middle' }, answer),
        ], { x: 300, y: 250, s: 0.6, o: 0 });
        const you = m.bubble('你在键盘前', { x: 790, y: 150, o: 0 });
        const out = m.screen('What is your name? ', 480, 432);
        const out2 = m.screen('What is your name? Alice', 480, 432);
        const val = m.box("'Alice'", { x: 480, y: 300 });
        const tg = m.nametag('name', { x: 480, y: 120 });
        const kind = m.chip('str 文本', 640, 300);
        const c = m.crew(typed, 'name = input("What is your name? ")', '<code>input()</code>：括号里放要问的问题。', { x: 130, y: 250 });
        const end = m.closing('input ＝ 递问卷', '印出问题，等你填，交回来的都是文本');
        return [c.shot,
          shot('先把问题印在画面上，然后<strong>停下来等</strong>。在你按 Enter 之前，Python 什么都不做。', async () => {
            await m.appear(form);
            await m.appear(out);
            await m.appear(you);
            await m.to(form, { x: 700, y: 290 }, 900, E.inOut);
          }),
          shot('你打 <code>Alice</code>，按 Enter。', async () => {
            await m.type(answer, 'Alice');
            await m.fade(out, 150);
            await m.appear(out2);
          }, 1300),
          shot('你打的字交回来，挂上名牌 <code>name</code>。交回来的<strong>一定是文本</strong>，就算你打的是数字也一样。', async () => {
            await m.fade(you);
            await m.to(form, { x: 480, y: 300, s: 0.4, o: 0 }, 800, E.inOut);
            await m.appear(val);
            await m.appear(tg);
            await m.to(tg, { y: 216 }, 600, E.back);
            await m.to(val, { x: 400 }, 300);
            await m.to(tg, { x: 400 }, 300);
            await m.appear(kind);
          }, 1500),
          end];
      },
    },

    pyint: {
      title: 'int() 就是换算柜台',
      make(m) {
        const typed = m.terminal(PS);
        const src = m.box("'25'", { x: 180, y: 300 });
        const srcTag = m.nametag('age_str', { x: 180, y: 216 });
        const strChip = m.chip('str 文本', 180, 380);
        const machine = m.g([
          svg('rect', { x: -90, y: -64, width: 180, height: 128, rx: 22, class: 'f-machine' }),
          text('int()', { y: 9, class: 'f-machine-text' }),
        ], { x: 480, y: 300 });
        const copy = m.box("'25'", { x: 180, y: 300 });
        const num = m.box('25', { x: 780, y: 300 });
        const numTag = m.nametag('age', { x: 780, y: 120 });
        const intChip = m.chip('int 整数', 780, 380);
        const err = m.screen('TypeError: can only concatenate str (not "int") to str', 480, 436, true);
        const out = m.screen('Next year, you will be 26', 480, 436);
        const calc = m.chip('age + 1 → 26', 780, 140);
        const end = m.closing('int() ＝ 换算柜台', '文本换成数字，才能拿来算');
        return [
          shot('<code>input()</code> 交回来的 <code>\'25\'</code> 是文本：看起来像数字，其实只是「2」和「5」两个字。', async () => {
            await Promise.all([m.appear(src), m.appear(srcTag), m.appear(strChip)]);
          }),
          shot('（补充）如果直接打 <code>age_str + 1</code>，文本和数字不能相加，Python 会报 <code>TypeError</code>。', async () => {
            await m.type(typed, 'age_str + 1');
            await m.shake(src);
            await m.appear(err);
          }, 1500),
          shot('<code>age = int(age_str)</code>：把文本送进换算柜台，换出整数 <code>25</code>，挂上名牌 <code>age</code>。原本的 <code>age_str</code> 还在。', async () => {
            await m.retype(typed, 'age = int(age_str)');
            await m.fade(err);
            await m.to(copy, { o: 1, s: 1 }, 1);
            await m.to(copy, { x: 480, y: 300, s: 0.5 }, 800, E.inOut);
            await m.to(copy, { o: 0 }, 150);
            await m.to(machine, { s: 1.06 }, 160);
            await m.to(machine, { s: 1 }, 300, E.back);
            await m.appear(num);
            await Promise.all([m.appear(numTag), m.appear(intChip)]);
            await m.to(numTag, { y: 216 }, 600, E.back);
          }),
          shot('换成数字之后就能加减了：<code>age + 1</code> 算出 26。<code>age</code> 本身还是 25，只是拿来算而已。', async () => {
            await m.retype(typed, 'print("Next year, you will be", age + 1)');
            m.hot(num);
            await m.appear(calc);
            await m.appear(out);
          }, 1500),
          end];
      },
    },
  });
})();
