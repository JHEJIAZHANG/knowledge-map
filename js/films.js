// 情境短片片库（cp、mv、rm 在 js/movie.js）
// 每支片一个固定比喻，结尾留一句口诀。添加时用 KM.Movie.films.名称 = { title, make(m) { return [镜头...] } }
(function () {
  const { Movie } = window.KnowledgeMap;
  const { E, svg, text, measure, shrink } = Movie.tools;

  Object.assign(Movie.prototype, {
    g(kids, init) { return this.actor(svg('g', {}, ...kids), init); },
    t(str, init, cls = 'f-label') {
      const a = this.actor(text(str, { class: cls }), init);
      a.el = a.node;
      return a;
    },
    chip(str, x, y, init) {
      const w = Math.max(Array.from(str).length * 10.4, measure(str, 'f-chip-text') + 4) + 30;
      return this.g([svg('rect', { x: -w / 2, y: -18, width: w, height: 36, rx: 12, class: 'f-chip' }), text(str, { y: 6, class: 'f-chip-text' })], { x, y, s: 0.7, o: 0, ...init });
    },
    screen(str, x = 480, y = 436, err) {
      const w = Math.max(Array.from(str).length * 12.6, measure(str, err ? 'f-out err' : 'f-out') + 6) + 48;
      return this.g([svg('rect', { x: -w / 2, y: -24, width: w, height: 48, rx: 14, class: 'f-term' }), text(str, { y: 7, class: err ? 'f-out err' : 'f-out' })], { x, y, s: 0.8, o: 0 });
    },
    bubble(str, init) {
      const w = Math.max(Array.from(str).reduce((n, ch) => n + (ch.charCodeAt(0) > 255 ? 21 : 12.6), 0), measure(str, 'f-bubble-text') + 6) + 48;
      const label = text(str, { y: 7, class: 'f-bubble-text' });
      const a = this.g([
        svg('path', { d: `M-20 26 L-34 48 L0 26 Z`, class: 'f-bubble' }),
        svg('rect', { x: -w / 2, y: -28, width: w, height: 56, rx: 20, class: 'f-bubble' }),
        label,
      ], init);
      a.label = label;
      return a;
    },
    blank(name, init) {
      const a = this.doc(name, init);
      a.node.querySelectorAll('.f-ink').forEach((n) => n.remove());
      return a;
    },
    paper(lines, x, y, w = 380) {
      const h = 60 + lines.length * 42;
      const box = this.g([svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 18, class: 'f-paper' })], { x, y });
      const rows = lines.map((str, i) => {
        const yy = y - h / 2 + 56 + i * 42;
        const hl = this.g([svg('rect', { x: -w / 2 + 16, y: -18, width: w - 32, height: 36, rx: 10, class: 'f-hl' })], { x, y: yy - 7, o: 0 });
        const t = this.actor(text(str, { class: 'f-line' }), { x, y: yy, o: 1 });
        shrink(t.node, w - 56);
        return { hl, t };
      });
      return { box, rows };
    },
    darkRoom(x, y, w, h) {
      return this.g([svg('rect', { x: -w / 2, y: -h / 2, width: w, height: h, rx: 26, class: 'f-dark' })], { x, y });
    },
    onDark(a) { a.node.classList.add('on-dark'); return a; },
    hot(a, on = true) { a.node.classList.toggle('hot', on); },
    appear(a, ms = 420) { return this.to(a, { o: 1, s: 1 }, ms, E.back); },
    fade(a, ms = 320) { return this.to(a, { o: 0 }, ms); },
    async retype(typed, str) { typed.textContent = ''; await this.type(typed, str); },
    async stagger(list, fn, gap = 150) {
      await Promise.all(list.map(async (x, i) => { await this.wait(i * gap); await fn(x, i); }));
    },
    async shake(a) {
      const x = a.x;
      for (const d of [-14, 14, -9, 9, 0]) await this.to(a, { x: x + d }, 90, E.line);
    },
    crew(typed, cmd, cap, init = { x: 130, y: 200 }) {
      const bot = this.robot(init);
      const slip = this.slip({ x: 300, y: 72 });
      return { bot, shot: { cap, play: async () => { await this.type(typed, cmd); await this.deliver(slip, bot); } } };
    },
    closing(big, small, cap) {
      const memo = this.memo(big, small);
      return { cap: cap || `<strong>${big}</strong>：${small}。`, play: async () => { await this.to(memo, { s: 1, o: 1 }, 480, E.back); } };
    },
  });

  const shot = (cap, play, hold) => ({ cap, play, hold });

  // 共用：碎纸机与碎片
  function shredder(m, x, y) {
    const strips = [-48, -24, 0, 24, 48].map((dx, i) =>
      m.actor(svg('rect', { x: -5, y: -24, width: 10, height: 48, rx: 4, class: 'f-strip' }), { x: x + dx, y: y + 48, o: 0, r: i % 2 ? 7 : -7 }));
    const front = m.g([
      svg('rect', { x: -100, y: -34, width: 200, height: 84, rx: 18, class: 'f-machine' }),
      svg('rect', { x: -70, y: -34, width: 140, height: 9, rx: 4, class: 'f-face' }),
      text('碎纸机', { y: 24, class: 'f-machine-text' }),
    ], { x, y });
    const fall = () => m.stagger(strips, async (st) => {
      await m.to(st, { o: 1, y: y + 85 }, 340, E.out);
      await m.to(st, { y: y + 150, o: 0 }, 480, E.inOut);
      Object.assign(st, { y: y + 48 });
    }, 80);
    return { front, fall };
  }

  Object.assign(Movie.films, {
    echo: {
      title: 'echo 就是大厅里的回音',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: 250, y: -30, width: 190, height: 300, rx: 18, class: 'f-mtn' }), text('大厅的墙', { x: 345, y: 126, class: 'f-hint' })], { x: 470, y: 150 });
        const bub = m.bubble('"Hello World"', { x: 300, y: 250, o: 0, s: 0.7 });
        const q1 = m.t('"', { x: 170, y: 262, o: 0 }, 'f-big');
        const q2 = m.t('"', { x: 430, y: 262, o: 0 }, 'f-big');
        const out = m.screen('Hello World');
        const c = m.crew(typed, 'echo "Hello World"', '你对小机器人说：帮我喊出 <code>Hello World</code>。');
        const end = m.closing('echo ＝ 回音', '你说什么，它就印什么');
        return [c.shot,
          shot('它把话喊出去。', async () => { await m.appear(bub); }),
          shot('引号只是把两个字绑成一组，<strong>Shell 用完就拿掉</strong>，所以回音里没有引号。', async () => {
            m.to(q1, { o: 1 }, 1); await m.to(q2, { o: 1 }, 1);
            bub.label.textContent = 'Hello World';
            await Promise.all([m.to(q1, { y: 450, o: 0, r: -40 }, 800, E.inOut), m.to(q2, { y: 450, o: 0, r: 40 }, 800, E.inOut)]);
          }),
          shot('声音撞到大厅的墙，原封不动地传回来。', async () => {
            await m.to(bub, { x: 660, y: 190, s: 0.8 }, 900, E.inOut);
            await m.to(bub, { x: 480, y: 340, s: 1 }, 800, E.inOut);
          }),
          shot('印在画面上的，就是你喊的内容。文件完全没有变动。', async () => { await m.fade(bub); await m.appear(out); }, 1400),
          end];
      },
    },

    whoami: {
      title: 'whoami 就是照镜子',
      make(m) {
        const typed = m.terminal();
        m.g([
          svg('rect', { x: -14, y: 150, width: 28, height: 40, class: 'f-machine' }),
          svg('rect', { x: -70, y: 186, width: 140, height: 14, rx: 7, class: 'f-machine' }),
          svg('ellipse', { rx: 110, ry: 155, class: 'f-mirror' }),
        ], { x: 650, y: 255 });
        const reflect = m.robot({ x: 650, y: 250, o: 0 });
        const name = m.badge('labex', 650, 350);
        const out = m.screen('labex');
        const c = m.crew(typed, 'whoami', '命令名字就是问句：<strong>who am I</strong>，我是谁？', { x: 200, y: 260 });
        const end = m.closing('whoami ＝ 照镜子', '问一句：我现在是谁');
        return [c.shot,
          shot('小机器人走到镜子前。', async () => { await m.to(c.bot, { x: 430, y: 250 }, 1000, E.inOut); }),
          shot('镜子里映出它现在的身分。', async () => { await m.to(reflect, { o: 0.6 }, 600); await m.pop(name); }),
          shot('回答只有一个名字：<code>labex</code>。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    id: {
      title: 'id 就是一张身分证',
      make(m) {
        const typed = m.terminal();
        const card = m.g([svg('rect', { x: -250, y: -135, width: 500, height: 270, rx: 26, class: 'f-card' })], { x: 590, y: 265, o: 0, s: 0.7 });
        const rows = [
          m.t('用户 uid　5000（labex）', { x: 590, y: 195, o: 0 }, 'f-row'),
          m.t('主要用户组 gid　5000（labex）', { x: 590, y: 240, o: 0 }, 'f-row'),
          m.t('加入的用户组 groups', { x: 590, y: 288, o: 0 }, 'f-hint'),
        ];
        const clubs = [m.chip('5000(labex)', 480, 322), m.chip('27(sudo)', 690, 322), m.chip('121(ssl-cert)', 480, 366), m.chip('5002(public)', 690, 366)];
        const c = m.crew(typed, 'id', '想知道完整的身分数据，就打 <code>id</code>。', { x: 170, y: 260 });
        const end = m.closing('id ＝ 身分证', '编号、主要用户组、社团，全写在上面');
        return [c.shot,
          shot('小机器人拿出一张身分证。', async () => { await m.appear(card); }),
          shot('第一栏 <code>uid</code> 是你的编号，括号里是给人看的名字。', async () => { await m.appear(rows[0]); }),
          shot('第二栏 <code>gid</code> 是主要用户组。', async () => { await m.appear(rows[1]); }),
          shot('<code>groups</code> 像社团，一个人可以加入很多个。', async () => { await m.appear(rows[2]); await m.stagger(clubs, (x) => m.appear(x)); }, 1500),
          end];
      },
    },

    idroot: {
      title: 'id 账号：查别人的证件',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: -120, y: -130, width: 240, height: 260, rx: 18, class: 'f-card' }), text('用户清单', { y: -92, class: 'f-hint' })], { x: 270, y: 280 });
        const hl = m.g([svg('rect', { x: -100, y: -20, width: 200, height: 40, rx: 10, class: 'f-hl' })], { x: 270, y: 310, o: 0 });
        m.t('labex', { x: 270, y: 256 }, 'f-line');
        m.t('root', { x: 270, y: 318 }, 'f-line');
        const card = m.g([
          svg('rect', { x: -170, y: -110, width: 340, height: 220, rx: 26, class: 'f-card' }),
          svg('path', { d: 'M-36 -64 L-36 -96 L-16 -78 L0 -102 L16 -78 L36 -96 L36 -64 Z', class: 'f-crown' }),
          text('root', { y: -14, class: 'f-big-name' }),
          text('uid 0', { y: 56, class: 'f-big-name acc' }),
        ], { x: 700, y: 280, o: 0, s: 0.7 });
        const out = m.screen('uid=0(root) gid=0(root) groups=0(root)');
        const c = m.crew(typed, 'id root', '<code>id</code> 后面接账号名称，就是查别人。', { x: 90, y: 230 });
        const end = m.closing('id 账号 ＝ 查别人的证件', 'root 是管理员，编号固定是 0');
        return [c.shot,
          shot('到用户清单里找 <code>root</code>。', async () => { await m.to(c.bot, { x: 90, y: 318 }, 900, E.inOut); await m.to(hl, { o: 1 }, 300); }),
          shot('调出 <code>root</code> 的证件。它是最高权限的管理员，编号是 <strong>0</strong>。', async () => { await m.appear(card); }, 1500),
          shot('结果印在画面上。', async () => { await m.appear(out); }, 1200),
          end];
      },
    },

    idun: {
      title: 'id -un：只看名字',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: -230, y: -120, width: 460, height: 240, rx: 26, class: 'f-card' })], { x: 590, y: 260 });
        const num = m.t('5000', { x: 590, y: 225 }, 'f-big-name');
        const name = m.t('labex', { x: 590, y: 225, o: 0 }, 'f-big-name acc');
        const others = m.t('主要用户组、加入的用户组…', { x: 590, y: 300 }, 'f-hint');
        const u = m.chip('-u', 180, 350);
        const n = m.chip('-n', 280, 350);
        const out = m.screen('labex');
        const c = m.crew(typed, 'id -un', '<code>-un</code> 是两个选项合在一起。', { x: 200, y: 220 });
        const end = m.closing('-u 编号，-n 名字', '合起来 -un，就只要名字');
        return [c.shot,
          shot('<code>-u</code> 是 user：把其他数据遮起来，只留用户编号。', async () => { await m.appear(u); await m.fade(others, 500); }),
          shot('<code>-n</code> 是 name：把编号换成看得懂的名字。', async () => { await m.appear(n); await Promise.all([m.fade(num, 350), m.to(name, { o: 1 }, 400)]); }),
          shot('结果和 <code>whoami</code> 一样。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    filter: {
      title: '解题：用条件当筛子',
      make(m) {
        const typed = m.terminal();
        const items = [['echo labex', 140], ['id root', 310], ['id', 450], ['id -un', 590], ['whoami', 760]].map(([s, x]) => m.chip(s, x, 118));
        m.g([svg('rect', { x: -420, y: -9, width: 840, height: 18, rx: 9, class: 'f-sieve' })], { x: 480, y: 215 });
        m.t('条件 1：查出目前的用户', { x: 480, y: 250 }, 'f-hint');
        m.g([svg('rect', { x: -420, y: -9, width: 840, height: 18, rx: 9, class: 'f-sieve' })], { x: 480, y: 330 });
        m.t('条件 2：画面上只有名字', { x: 480, y: 365 }, 'f-hint');
        const out = m.screen('labex', 760, 436);
        const end = m.closing('先看条件，再选命令', '不符合的一个个删掉，答案自己留下');
        const [echo, root, idc, un, who] = items;
        return [
          shot('先把学过的命令都倒进筛子。', async () => { await m.stagger(items, (x) => m.appear(x), 90); }),
          shot('第一层：<code>echo labex</code> 只是印字，<code>id root</code> 查的是别人，被挡下。', async () => {
            await Promise.all([m.to(echo, { y: 186, o: 0.25 }, 700, E.out), m.to(root, { y: 186, o: 0.25 }, 700, E.out)]);
          }),
          shot('通过的继续往下。第二层：<code>id</code> 印了太多数据，也被挡下。', async () => {
            await Promise.all([m.to(idc, { y: 298, o: 0.25 }, 800, E.inOut), m.to(un, { y: 298 }, 800, E.inOut), m.to(who, { y: 298 }, 800, E.inOut)]);
          }),
          shot('剩下两个都符合，选最简单的 <code>whoami</code>。', async () => {
            await Promise.all([m.to(un, { y: 410 }, 800, E.inOut), m.to(who, { y: 382, s: 1.15 }, 800, E.inOut)]);
            m.hot(who);
            await m.type(typed, 'whoami');
            await m.appear(out);
          }, 1500),
          end];
      },
    },

    pwd: {
      title: 'pwd 就是定位',
      make(m) {
        const typed = m.terminal();
        m.g([svg('line', { x1: 170, y1: 320, x2: 790, y2: 320, class: 'f-road' })], {});
        const stops = [['/', 170], ['home', 370], ['labex', 570], ['project', 780]].map(([s, x]) => m.chip(s, x, 320, { o: 1, s: 1 }));
        const pin = m.badge('你在这里', 780, 245);
        const out = m.screen('/home/labex/project');
        const c = m.crew(typed, 'pwd', '迷路的时候，先问：<strong>我现在在哪里？</strong>', { x: 640, y: 195 });
        const end = m.closing('pwd ＝ 定位', '迷路了，先问我在哪');
        return [c.shot,
          shot('小机器人站在目前的目录：<code>project</code>。', async () => { await m.pop(pin); }),
          shot('从最上层的 <code>/</code> 开始，一站一站把路径接起来。', async () => {
            for (const s of stops) { m.hot(s); await m.wait(380); }
          }),
          shot('完整的地址就是目前的位置。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    home: {
      title: '~ 就是回家的捷径',
      make(m) {
        const typed = m.terminal();
        const house = m.g([
          svg('path', { d: 'M-110 -10 L0 -110 L110 -10 Z', class: 'f-roof' }),
          svg('rect', { x: -84, y: -14, width: 168, height: 124, rx: 12, class: 'f-card' }),
          svg('rect', { x: -22, y: 42, width: 44, height: 68, rx: 8, class: 'f-acc' }),
          text('labex 的家', { y: 142, class: 'f-label' }),
        ], { x: 720, y: 260, o: 0, s: 0.7 });
        const key = m.t('~', { x: 360, y: 290 }, 'f-tilde');
        const path = m.t('/home/labex', { x: 370, y: 268, o: 0 }, 'f-big-name acc');
        const out = m.screen('/home/labex');
        const c = m.crew(typed, 'echo ~', '<code>~</code> 是一个代号，只要一个字。', { x: 130, y: 220 });
        const end = m.closing('~ ＝ 回家的捷径', '不管在哪，一个字就代表你家');
        return [c.shot,
          shot('<code>echo</code> 还没开始，<strong>Shell 先把 <code>~</code> 换掉</strong>。', async () => { m.hot(key); await m.to(key, { s: 1.25 }, 420, E.back); }),
          shot('换成你家的完整地址。', async () => { await Promise.all([m.fade(key, 300), m.to(path, { o: 1 }, 420)]); await m.appear(house); }),
          shot('所以 <code>echo</code> 印出来的是真正的路径。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    ls: {
      title: 'ls 就是手电筒',
      make(m) {
        const typed = m.terminal();
        m.darkRoom(585, 245, 690, 300);
        const beam = m.g([svg('path', { d: 'M0 0 L560 -120 L560 120 Z', class: 'f-beam' })], { x: 230, y: 250, o: 0, r: -8 });
        const items = ['Code', 'Desktop', 'golang', 'project'].map((n, i) => m.onDark(m.folder(n, { x: 345 + i * 158, y: 232, s: 0.68, o: 0.1 })));
        const out = m.screen('Code  Desktop  golang  project');
        const c = m.crew(typed, 'ls ~', '想知道一个目录里有什么？', { x: 130, y: 250 });
        const end = m.closing('ls ＝ 手电筒', '照一照，看看这里有什么');
        return [c.shot,
          shot('房间一片漆黑。打开手电筒。', async () => { await m.to(beam, { o: 1 }, 400); }),
          shot('扫过去，一个一个照亮里面的项目。', async () => { await m.stagger(items, (x) => m.to(x, { o: 1 }, 420), 330); }),
          shot('看到的名字全列在画面上。<code>ls</code> 只是看，东西都没动。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    cd: {
      title: 'cd 就是搭电梯',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: 180, y: 92, width: 150, height: 356, rx: 22, class: 'f-shaft' })], {});
        const ys = [130, 215, 300, 385];
        const floors = ['/', 'home', 'labex（家 ~）', 'project'].map((s, i) =>
          m.g([svg('rect', { x: 0, y: -36, width: 470, height: 72, rx: 18, class: 'f-floor' }), text(s, { x: 235, y: 8, class: 'f-line' })], { x: 360, y: ys[i] }));
        const bot = m.robot({ x: 255, y: 380, s: 0.72 });
        const end = m.closing('cd ＝ 搭电梯', '.. 上一层，~ 回家，/ 从大门走');
        const go = async (i) => {
          floors.forEach((f) => m.hot(f, false));
          await m.to(bot, { y: ys[i] - 5 }, 800, E.inOut);
          m.hot(floors[i]);
        };
        return [
          shot('现在在最下面的 <code>project</code> 这层。', async () => { m.hot(floors[3]); await m.type(typed, 'pwd'); }),
          shot('<code>..</code> 是上一层，电梯往上一格，来到家目录。', async () => { await m.retype(typed, 'cd ..'); await go(2); }),
          shot('没有 <code>/</code> 开头是相对路径：从这里往下一层。', async () => { await m.retype(typed, 'cd project'); await go(3); }),
          shot('<code>~</code> 是回家键，不管在哪都直达家目录。', async () => { await m.retype(typed, 'cd ~'); await go(2); }),
          shot('<code>/</code> 开头是绝对路径：先回到大厅，再照完整地址一路走。', async () => {
            await m.retype(typed, 'cd /home/labex/project');
            await go(0); await go(1); await go(2); await go(3);
          }, 1400),
          end];
      },
    },

    touch: {
      title: 'touch 就是放一张白纸',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: -260, y: -16, width: 520, height: 32, rx: 16, class: 'f-sieve' })], { x: 560, y: 390 });
        const doc = m.blank('file1.txt', { x: 560, y: 110, o: 0, s: 0.6 });
        const size = m.badge('0 字节', 790, 290);
        const c = m.crew(typed, 'touch file1.txt', '要创建一个新文件。', { x: 220, y: 220 });
        const end = m.closing('touch ＝ 放一张白纸', '文件建好了，但里面是空的');
        return [c.shot,
          shot('小机器人放下一张<strong>全新的白纸</strong>，写上名字。', async () => { await m.to(doc, { y: 285, o: 1, s: 1 }, 800, E.back); }),
          shot('纸上什么都没有，所以大小是 0。成功时也不会印任何消息。', async () => { await m.pop(size); }, 1400),
          end];
      },
    },

    redirect: {
      title: '> 就是把水管转向',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: -90, y: -60, width: 180, height: 120, rx: 22, class: 'f-machine' }), text('echo', { y: 8, class: 'f-machine-text' })], { x: 150, y: 270 });
        m.g([
          svg('path', { d: 'M240 270 H420', class: 'f-pipe' }),
          svg('path', { d: 'M420 270 V160 H640', class: 'f-pipe' }),
          svg('path', { d: 'M420 270 V360 H640', class: 'f-pipe' }),
        ], {});
        const valve = m.g([svg('circle', { r: 38, class: 'f-valve' }), svg('path', { d: 'M0 -22 L0 22 M-10 12 L0 22 L10 12', class: 'f-valve-arrow' })], { x: 420, y: 270, r: 180 });
        const mon = m.g([svg('rect', { x: -85, y: -58, width: 170, height: 106, rx: 14, class: 'f-term' }), text('画面', { y: 6, class: 'f-out' }), text('（没有输出）', { y: 82, class: 'f-hint' })], { x: 740, y: 160 });
        const doc = m.blank('file2.txt', { x: 740, y: 340, s: 0.8 });
        const size = m.badge('13 字节', 880, 262);
        const drops = ['Hello', ',', 'Linux'].map((s) => m.chip(s, 240, 270));
        const c = m.crew(typed, 'echo "Hello, Linux" > file2.txt', '<code>echo</code> 的输出本来会流向画面。', { x: 130, y: 165 });
        const end = m.closing('> ＝ 把水管转向', '不印在画面，全部流进文件');
        return [c.shot,
          shot('水管原本接到上面的<strong>画面</strong>。', async () => { m.hot(mon); await m.wait(700); m.hot(mon, false); }),
          shot('<code>&gt;</code> 就像转动阀门，把水管转向<strong>下面的文件</strong>。', async () => { await m.to(valve, { r: 0 }, 750, E.back); }),
          shot('文本顺着水管流进 <code>file2.txt</code>，画面上什么都没有。', async () => {
            await m.stagger(drops, async (d) => {
              await m.to(d, { o: 1, s: 1 }, 160);
              await m.to(d, { x: 420 }, 420, E.line);
              await m.to(d, { y: 360 }, 420, E.line);
              await m.to(d, { x: 700, o: 0 }, 420, E.line);
            }, 320);
            await m.pop(size);
          }, 1400),
          shot('要小心：如果文件本来有内容，<strong>旧内容会被整个盖掉</strong>。', async () => { m.hot(doc); await m.wait(900); }),
          end];
      },
    },

    mkdir: {
      title: 'mkdir 就是隔出一间新房间',
      make(m) {
        const typed = m.terminal();
        const flat = m.g([svg('rect', { x: -120, y: -14, width: 240, height: 28, rx: 12, class: 'f-folder' })], { x: 580, y: 300 });
        const folder = m.folder('testdir/', { x: 580, y: 270, o: 0, s: 0.5 });
        const empty = m.badge('里面是空的', 580, 412);
        const c = m.crew(typed, 'mkdir testdir', '<code>mkdir</code> 是 make directory，做一个目录。', { x: 230, y: 240 });
        const end = m.closing('mkdir ＝ 隔一间新房间', 'make directory，等你放东西进去');
        return [c.shot,
          shot('小机器人拿出一张纸板。', async () => { await m.to(c.bot, { x: 390, y: 230 }, 800, E.inOut); }),
          shot('隔板立起来，围出一间新的房间。', async () => { await m.fade(flat, 260); await m.appear(folder, 520); }),
          shot('新房间是空的，可以把文件放进去。', async () => { await m.pop(empty); }, 1400),
          end];
      },
    },

    lsl: {
      title: 'ls -l 就是放大镜',
      make(m) {
        const typed = m.terminal();
        const doc = m.doc('file2.txt', { x: 250, y: 270 });
        const glass = m.g([svg('circle', { r: 66, class: 'f-lens' }), svg('line', { x1: 48, y1: 48, x2: 100, y2: 100, class: 'f-handle' })], { x: 250, y: 255, s: 0.6, o: 0 });
        const fields = [['-rw-rw-r--', '类型与权限', 130], ['labex', '拥有者', 195], ['13', '大小（字节）', 260], ['Nov 9 14:06', '修改时间', 325], ['file2.txt', '名称', 390]].map(([v, k, y]) => ({
          v: m.chip(v, 590, y), k: m.t(k, { x: 790, y: y + 6, o: 0 }, 'f-hint'),
        }));
        const c = m.crew(typed, 'ls -l', '<code>ls</code> 只看名字，<code>-l</code> 是 long，看详细数据。', { x: 90, y: 160, s: 0.75 });
        const end = m.closing('ls -l ＝ 放大镜', '一个项目一行，数据全看得到');
        return [c.shot,
          shot('拿放大镜靠近文件。', async () => { await m.appear(glass); m.glow(doc, true); }),
          shot('藏在名字背后的数据，一栏一栏展开。', async () => {
            await m.stagger(fields, async (f) => { await m.appear(f.v); await m.to(f.k, { o: 1 }, 200); }, 260);
          }, 1500),
          end];
      },
    },

    lsa: {
      title: 'ls -a 就是全部开灯',
      make(m) {
        const typed = m.terminal();
        const room = m.darkRoom(520, 265, 830, 330);
        const lit = [['file1.txt', 170], ['file2.txt', 390], ['testdir/', 610]].map(([n, x]) => (n.endsWith('/') ? m.onDark(m.folder(n, { x, y: 255, s: 0.8 })) : m.onDark(m.doc(n, { x, y: 245, s: 0.8 }))));
        const hid = m.onDark(m.doc('.hiddenfile', { x: 820, y: 245, s: 0.8, o: 0.05 }));
        const lamp = m.badge('-a 全部开灯', 820, 410);
        const end = m.closing('ls -a ＝ 全部开灯', '点开头的隐藏文件也现身');
        m.robot({ x: 60, y: 160, s: 0.7 });
        return [
          shot('一般的 <code>ls</code> 只照亮看得到的东西。', async () => { await m.type(typed, 'ls'); await m.wait(600); }),
          shot('角落其实还有一个文件。名字用 <code>.</code> 开头的，就是<strong>隐藏文件</strong>。', async () => { await m.to(hid, { o: 0.22 }, 500); }),
          shot('<code>-a</code> 代表 all，把所有灯打开。', async () => {
            await m.retype(typed, 'ls -a');
            await m.pop(lamp);
            await Promise.all([m.to(room, { o: 0.2 }, 600), m.to(hid, { o: 1 }, 600)]);
            lit.concat(hid).forEach((a) => a.node.classList.remove('on-dark'));
            m.glow(hid, true);
          }, 1500),
          end];
      },
    },

    rmi: {
      title: 'rm -i：先问再碎',
      make(m) {
        const typed = m.terminal();
        const file = m.doc('file2.txt', { x: 200, y: 270 });
        const sh = shredder(m, 640, 300);
        const ask = m.bubble('确定要删除吗？', { x: 310, y: 150, o: 0, s: 0.7 });
        const c = m.crew(typed, 'rm -i file2.txt', '<code>-i</code> 是 interactive，动手前会先问。', { x: 200, y: 150 });
        const end = m.closing('rm -i ＝ 先问再碎', '回答 y 才动手，n 就保留');
        return [c.shot,
          shot('小机器人拿着文件，走到碎纸机前<strong>停下来问你</strong>。', async () => {
            await Promise.all([m.to(file, { x: 640, y: 170 }, 1100, E.inOut), m.to(c.bot, { x: 480, y: 150 }, 1100, E.inOut)]);
            await m.appear(ask);
          }),
          shot('你输入 <code>y</code>，它才动手。', async () => { await m.retype(typed, "rm: remove regular file 'file2.txt'? y"); await m.wait(700); await m.fade(ask); }),
          shot('纸被卷进碎纸机。如果回答 <code>n</code>，文件就会留着。', async () => {
            await m.to(file, { y: 300, s: 0.9 }, 800, E.line);
            await m.to(file, { o: 0 }, 1);
            await sh.fall();
          }),
          end];
      },
    },

    rmdir: {
      title: 'rmdir 只拆空房间',
      make(m) {
        const typed = m.terminal();
        const inner = m.doc('file2.txt', { x: 560, y: 205, s: 0.55 });
        const folder = m.folder('new_testdir/', { x: 560, y: 285 });
        const stop = m.bubble('里面还有东西！', { x: 560, y: 125, o: 0, s: 0.7 });
        const out = m.screen("rmdir: failed to remove 'new_testdir': Directory not empty", 480, 436, true);
        const c = m.crew(typed, 'rmdir new_testdir', '<code>rmdir</code> 只负责收掉<strong>空的</strong>目录。', { x: 200, y: 240 });
        const end = m.closing('rmdir ＝ 只拆空房间', '里面有东西，就拒绝动手');
        return [c.shot,
          shot('小机器人先往房间里看。', async () => { await m.to(c.bot, { x: 390, y: 225 }, 800, E.inOut); m.glow(inner, true); }),
          shot('里面还有 <code>file2.txt</code>，房间不是空的。', async () => { await m.appear(stop); await m.shake(folder); }),
          shot('它拒绝动手，印出错误消息，<strong>什么都没有被删除</strong>。', async () => { await m.appear(out); }, 1600),
          end];
      },
    },

    rmr: {
      title: 'rm -r：连房间带东西',
      make(m) {
        const typed = m.terminal();
        const inner = m.doc('file2.txt', { x: 220, y: 215, s: 0.55 });
        const folder = m.folder('testdir/', { x: 220, y: 300 });
        const sh = shredder(m, 660, 300);
        const c = m.crew(typed, 'rm -r testdir', '<code>-r</code> 是 recursive：连里面的东西一起处理。', { x: 420, y: 155 });
        const end = m.closing('rm -r ＝ 连房间带东西', '先清里面，再拆房间');
        return [c.shot,
          shot('顺序很重要：<strong>先处理里面的文件</strong>。', async () => {
            await m.to(inner, { x: 660, y: 180, s: 0.9 }, 1000, E.inOut);
            await m.to(inner, { y: 300 }, 600, E.line);
            await m.to(inner, { o: 0 }, 1);
            await sh.fall();
          }),
          shot('里面清空了，<strong>最后才是目录本身</strong>。', async () => {
            await m.to(folder, { x: 660, y: 180, s: 0.8 }, 1000, E.inOut);
            await m.to(folder, { y: 300 }, 600, E.line);
            await m.to(folder, { o: 0 }, 1);
            await sh.fall();
          }),
          end];
      },
    },

    rmrf: {
      title: 'rm -rf 就是推土机',
      make(m) {
        const typed = m.terminal();
        const folder = m.folder('temp_dir/', { x: 560, y: 300 });
        const file = m.doc('temp_file.txt', { x: 700, y: 305, s: 0.7 });
        const dozer = m.g([
          svg('rect', { x: -100, y: -50, width: 150, height: 74, rx: 12, class: 'f-acc' }),
          svg('rect', { x: -70, y: -92, width: 76, height: 46, rx: 10, class: 'f-face' }),
          svg('rect', { x: -110, y: 24, width: 170, height: 34, rx: 17, class: 'f-acc2' }),
          svg('path', { d: 'M60 -50 h34 v108 h-34 z', class: 'f-blade' }),
        ], { x: 150, y: 310 });
        const warn = m.g([svg('path', { d: 'M0 -46 L54 46 H-54 Z', class: 'f-tri' }), text('!', { y: 34, class: 'f-tri-text' })], { x: 840, y: 165, s: 0.6, o: 0 });
        const end = m.closing('rm -rf ＝ 推土机', '不问、不挡，按下前先看清楚');
        return [
          shot('<code>-r</code> 连内容一起，<code>-f</code> 是 force，<strong>不询问、不提示</strong>。', async () => { await m.type(typed, 'rm -rf temp_dir'); await m.wait(500); }),
          shot('推土机一路往前，没有任何一刻停下来问你。', async () => {
            await m.to(dozer, { x: 400 }, 1000, E.inOut);
            await Promise.all([
              m.to(dozer, { x: 1150 }, 1700, E.line),
              m.to(folder, { x: 1100, o: 0 }, 1500, E.line),
              m.to(file, { x: 1240, o: 0 }, 1500, E.line),
            ]);
          }),
          shot('目录和里面的文件一起消失了。路径打错一个字，也一样不会停。', async () => { await m.appear(warn); }, 1500),
          end];
      },
    },

    cat: {
      title: 'cat 就是整本摊开',
      make(m) {
        const typed = m.terminal();
        const { rows } = m.paper(['Hi,', 'I am Labby!'], 590, 270, 400);
        rows.forEach((r) => Object.assign(r.t, { o: 0 }) && m.applyActor(r.t));
        const nums = [m.chip('1', 350, rows[0].t.y - 6), m.chip('2', 350, rows[1].t.y - 6)];
        const c = m.crew(typed, 'cat /tmp/hello', '想看文件里写什么，全部的内容。', { x: 170, y: 240 });
        const end = m.closing('cat ＝ 整本摊开', '从头印到尾，-n 再标上行号');
        return [c.shot,
          shot('把文件从第一行摊开到最后一行。', async () => { await m.stagger(rows, (r) => m.to(r.t, { o: 1 }, 400), 500); }),
          shot('加上 <code>-n</code>，每一行旁边标上号码。号码只是显示用，<strong>文件没有改变</strong>。', async () => {
            await m.retype(typed, 'cat -n /tmp/hello');
            await m.stagger(nums, (n) => m.appear(n), 260);
          }, 1500),
          end];
      },
    },

    head: {
      title: 'head 就是看开头',
      make(m) {
        const typed = m.terminal();
        const { rows } = m.paper(['Hi,', 'I am Labby!'], 590, 250, 400);
        const out = m.screen('Hi,', 590, 420);
        const c = m.crew(typed, 'head -n1 /tmp/hello', '<code>head</code> 是头，<code>-n1</code> 是取 1 行。', { x: 170, y: 240 });
        const end = m.closing('head ＝ 头', '只看开头几行，不加 -n 默认 10 行');
        return [c.shot,
          shot('从<strong>最上面</strong>开始取。', async () => { await m.to(rows[0].hl, { o: 1 }, 320); await m.to(rows[1].t, { o: 0.3 }, 320); }),
          shot('取到的那一行印在画面上。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    tail: {
      title: 'tail 就是看尾巴',
      make(m) {
        const typed = m.terminal();
        const { rows } = m.paper(['Hi,', 'I am Labby!'], 590, 250, 400);
        const out = m.screen('I am Labby!', 590, 420);
        const c = m.crew(typed, 'tail -n1 /tmp/hello', '<code>tail</code> 是尾巴，<code>-n1</code> 是取 1 行。', { x: 170, y: 240 });
        const end = m.closing('tail ＝ 尾巴', '只看最后几行，新内容都在这里');
        return [c.shot,
          shot('从<strong>最下面</strong>往回取。', async () => { await m.to(rows[1].hl, { o: 1 }, 320); await m.to(rows[0].t, { o: 0.3 }, 320); }),
          shot('取到的那一行印在画面上。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    diff: {
      title: 'diff 就是大家来找碴',
      make(m) {
        const typed = m.terminal();
        const a = m.paper(['this is file1'], 270, 230, 320);
        const b = m.paper(['this is file2'], 690, 230, 320);
        m.t('file1', { x: 270, y: 300 }, 'f-label');
        m.t('file2', { x: 690, y: 300 }, 'f-label');
        const glass = m.g([svg('circle', { r: 52, class: 'f-lens' }), svg('line', { x1: 38, y1: 38, x2: 78, y2: 78, class: 'f-handle' })], { x: 270, y: 220, s: 0.6, o: 0 });
        const change = m.chip('1c1', 480, 372);
        const left = m.chip('< this is file1', 300, 425);
        const right = m.chip('> this is file2', 670, 425);
        const end = m.closing('diff ＝ 大家来找碴', '相同的不说，只报不同');
        m.robot({ x: 480, y: 170, s: 0.7 });
        return [
          shot('把两个文件并排放好。', async () => { await m.type(typed, 'diff file1 file2'); }),
          shot('拿放大镜逐行比对。', async () => { await m.appear(glass); await m.to(glass, { x: 690 }, 1000, E.inOut); }),
          shot('第 1 行不一样！<code>1c1</code> 意思是左边第 1 行<strong>换成</strong>右边第 1 行。', async () => {
            await Promise.all([m.to(a.rows[0].hl, { o: 1 }, 300), m.to(b.rows[0].hl, { o: 1 }, 300)]);
            await m.appear(change);
          }),
          shot('<code>&lt;</code> 指向左边的文件，<code>&gt;</code> 指向右边的文件。', async () => { await m.appear(left); await m.appear(right); }, 1500),
          end];
      },
    },
    manuscript: {
      title: '侦探比对两份稿件',
      make(m) {
        const typed = m.terminal();
        const lines1 = ['The old clock struck midnight.', 'A shadow moved across the room.', "The detective's eyes narrowed."];
        const lines2 = ['The old clock struck midnight.', 'A figure darted behind the curtains.', "The detective's eyes narrowed."];
        const a = m.paper(lines1, 250, 225, 440);
        const b = m.paper(lines2, 710, 225, 440);
        [a, b].forEach((p) => p.rows.forEach((r) => r.t.node.classList.add('sm')));
        m.t('manuscript_v1.txt', { x: 250, y: 345 }, 'f-label');
        m.t('manuscript_v2.txt', { x: 710, y: 345 }, 'f-label');
        const glass = m.g([svg('circle', { r: 34, class: 'f-lens' }), svg('line', { x1: 25, y1: 25, x2: 52, y2: 52, class: 'f-handle' })], { x: 480, y: a.rows[0].t.y - 6, s: 0.6, o: 0 });
        const same1 = m.badge('相同', 480, 175);
        const code = m.chip('2c2', 480, 392);
        const left = m.chip('< A shadow moved across the room.', 250, 442);
        const right = m.chip('> A figure darted behind the curtains.', 710, 442);
        const end = m.closing('2c2 ＝ 第 2 行被换掉', '只报不同，没列出来的都一样');
        return [
          shot('把两份稿件并排，开始逐行比对。', async () => { await m.type(typed, 'diff manuscript_v1.txt manuscript_v2.txt'); await m.appear(glass); }),
          shot('第 1 行一模一样，<code>diff</code> 不会报告。', async () => { await m.pop(same1); await m.wait(500); await m.fade(same1); }),
          shot('第 2 行不一样！找到差异了。', async () => {
            await m.to(glass, { y: a.rows[1].t.y - 6 }, 600, E.inOut);
            await Promise.all([m.to(a.rows[1].hl, { o: 1 }, 300), m.to(b.rows[1].hl, { o: 1 }, 300)]);
          }),
          shot('<code>2c2</code>：左边第 2 行<strong>换成</strong>右边第 2 行。', async () => { await m.appear(code); }),
          shot('<code>&lt;</code> 是第 1 版的内容，<code>&gt;</code> 是第 2 版的内容。', async () => { await m.appear(left); await m.appear(right); }, 1600),
          shot('第 3 行也相同，所以整份稿件<strong>只有这一行不同</strong>。', async () => { await m.to(glass, { y: a.rows[2].t.y - 6 }, 600, E.inOut); await m.wait(500); }),
          end];
      },
    },
    perm: {
      title: '权限字符串：一格类型，三组 rwx',
      make(m) {
        const typed = m.terminal();
        const S = '-rw-rw-r--';
        const xs = [230, 360, 400, 440, 540, 580, 620, 720, 760, 800];
        const chars = Array.from(S).map((ch, i) => m.t(ch, { x: 520 + (i - 4.5) * 40, y: 225, o: 0 }, 'f-perm'));
        const box = (cx, w) => m.g([svg('rect', { x: -w / 2, y: -44, width: w, height: 80, rx: 18, class: 'f-hl' })], { x: cx, y: 212, o: 0 });
        const boxes = [box(230, 70), box(400, 150), box(580, 150), box(760, 150)];
        const keys = [['类型', '一般文件', 230], ['拥有者', 'labex', 400], ['用户组', 'labex 用户组', 580], ['其他人', '其他所有人', 760]].map(([k, v, x]) => ({
          k: m.t(k, { x, y: 296, o: 0 }, 'f-row'), v: m.t(v, { x, y: 326, o: 0 }, 'f-hint'),
        }));
        const legend = [['r 读', 260], ['w 写', 400], ['x 运行', 550], ['- 不行', 710]].map(([s, x]) => m.chip(s, x, 400));
        const c = m.crew(typed, 'ls -l example.txt', '用 <code>ls -l</code> 看文件，最前面那串就是权限。', { x: 90, y: 400, s: 0.6 });
        const end = m.closing('1 格类型 ＋ 3 组 rwx', '依序是拥有者、用户组、其他人');
        const show = (i) => Promise.all([m.appear(boxes[i]), m.to(keys[i].k, { o: 1 }, 300), m.to(keys[i].v, { o: 1 }, 300)]);
        return [c.shot,
          shot('<code>-rw-rw-r--</code> 一共 10 格，看起来很乱，其实可以拆开。', async () => { await m.stagger(chars, (x) => m.to(x, { o: 1 }, 260), 60); }),
          shot('第 1 格是<strong>类型</strong>：<code>-</code> 是一般文件，<code>d</code> 是目录。', async () => {
            await m.to(chars[0], { x: xs[0] }, 600, E.inOut);
            await show(0);
          }),
          shot('剩下 9 格，<strong>每 3 格一组</strong>：拥有者、用户组、其他人。', async () => {
            await Promise.all(chars.slice(1).map((ch, i) => m.to(ch, { x: xs[i + 1] }, 700, E.inOut)));
            await m.stagger([1, 2, 3], show, 220);
          }),
          shot('每组都照 <code>r w x</code> 的顺序。是字母就代表可以，<code>-</code> 代表不行。', async () => { await m.stagger(legend, (x) => m.appear(x), 120); }),
          shot('所以：拥有者和用户组都能<strong>读、写</strong>，其他人<strong>只能读</strong>。', async () => {
            await m.stagger([1, 2, 4, 5, 7], async (i) => { m.hot(chars[i]); await m.to(chars[i], { s: 1.15 }, 200); }, 160);
          }, 1800),
          end];
      },
    },

    chown: {
      title: 'chown 就是过户',
      make(m) {
        const typed = m.terminal();
        m.doc('example.txt', { x: 560, y: 210 });
        const card = m.g([svg('rect', { x: -160, y: -34, width: 320, height: 68, rx: 20, class: 'f-card' })], { x: 560, y: 370, o: 0, s: 0.8 });
        const own = m.t('labex', { x: 488, y: 378, o: 0 }, 'f-line');
        const colon = m.t(':', { x: 560, y: 378, o: 0 }, 'f-line');
        const grp = m.t('labex', { x: 632, y: 378, o: 0 }, 'f-line');
        const kOwn = m.t('拥有者', { x: 488, y: 430, o: 0 }, 'f-hint');
        const kGrp = m.t('用户组', { x: 632, y: 430, o: 0 }, 'f-hint');
        const crown = m.g([
          svg('path', { d: 'M-36 -10 L-36 -42 L-16 -24 L0 -48 L16 -24 L36 -42 L36 -10 Z', class: 'f-crown' }),
          text('sudo', { y: 22, class: 'f-label' }),
        ], { x: 220, y: 150, o: 0, s: 0.6 });
        const same = m.badge('内容一个字都没变', 820, 210);
        const c = m.crew(typed, 'sudo chown root:root example.txt', '要把 <code>example.txt</code> 过户给 <code>root</code>。', { x: 220, y: 290 });
        const end = m.closing('chown ＝ 过户', '冒号前是拥有者，冒号后是用户组');
        const flip = async (a, str) => {
          await m.to(a, { o: 0, y: a.y - 12 }, 200);
          a.node.textContent = str;
          a.node.classList.add('hot');
          await m.to(a, { o: 1, y: a.y + 12 }, 360, E.back);
        };
        return [c.shot,
          shot('每个文件都挂着一张名牌：<strong>拥有者</strong>和<strong>用户组</strong>，现在都是 <code>labex</code>。', async () => {
            await m.appear(card);
            await m.stagger([own, colon, grp, kOwn, kGrp], (x) => m.to(x, { o: 1 }, 260), 90);
          }),
          shot('把文件送给别人，不是自己说了算。<code>sudo</code> 借来<strong>管理员的印章</strong>。', async () => { await m.appear(crown); }),
          shot('冒号<strong>前面</strong>换拥有者：<code>labex</code> → <code>root</code>。', async () => { await flip(own, 'root'); }),
          shot('冒号<strong>后面</strong>换用户组：<code>labex</code> → <code>root</code>。', async () => { await flip(grp, 'root'); }),
          shot('文件内容完全没动，只是换了主人。成功时一样不印任何消息。', async () => { await m.pop(same); }, 1500),
          end];
      },
    },

    chownr: {
      title: 'chown -R 就是整间过户',
      make(m) {
        const typed = m.terminal();
        m.g([svg('path', { d: 'M260 158 V300 M260 220 H298 M260 300 H308 M335 318 V380 H358', class: 'f-pipe' })], {});
        const rows = [['new-dir/', 300, 140], ['file1.txt', 360, 220], ['subdir/', 360, 300], ['file2.txt', 420, 380]];
        rows.forEach(([n, x, y]) => m.chip(n, x, y, { o: 1, s: 1 }));
        const tags = rows.map(([, , y]) => m.t('labex:labex', { x: 720, y: y + 7, o: 0 }, 'f-line'));
        const only = m.badge('不加 -R：只换这一个', 720, 92);
        const c = m.crew(typed, 'sudo chown -R root:root new-dir', '要把整个 <code>new-dir</code> 过户给 <code>root</code>。', { x: 110, y: 300, s: 0.7 });
        const end = m.closing('-R ＝ 整间过户', '房间和里面的每一样都换');
        return [c.shot,
          shot('<code>new-dir</code> 里面还有文件和小房间（子目录），<strong>每一个都有自己的名牌</strong>。', async () => { await m.stagger(tags, (x) => m.to(x, { o: 1 }, 300), 150); }),
          shot('如果<strong>不加 <code>-R</code></strong>，只有最上面的 <code>new-dir</code> 会换，里面的都不动。', async () => {
            m.hot(tags[0]); await m.pop(only); await m.wait(900);
            await m.fade(only); m.hot(tags[0], false);
          }),
          shot('加上 <code>-R</code>（Recursive，递归）：从这间房间开始，一层一层往下，<strong>全部换掉</strong>。', async () => {
            for (const t of tags) {
              await m.to(t, { o: 0 }, 160);
              t.node.textContent = 'root:root';
              m.hot(t);
              await m.to(t, { o: 1 }, 260);
            }
          }, 1500),
          end];
      },
    },

    mkdirp: {
      title: 'mkdir -p 就是一路盖到底',
      make(m) {
        const typed = m.terminal();
        const ghost = m.g([svg('rect', { x: -90, y: -70, width: 180, height: 140, rx: 18, class: 'f-slot' }), text('new-dir 还不存在', { y: 6, class: 'f-hint' })], { x: 470, y: 250, o: 0 });
        const a = m.folder('new-dir/', { x: 470, y: 250, o: 0, s: 0.5 });
        const b = m.folder('subdir/', { x: 470, y: 250, o: 0, s: 0.3 });
        const arrow = m.t('里面 →', { x: 610, y: 256, o: 0 }, 'f-hint');
        const err = m.screen('No such file or directory', 480, 436, true);
        const two = m.badge('一次盖好两层', 600, 410);
        const c = m.crew(typed, 'mkdir -p new-dir/subdir', '要创建 <code>new-dir</code> 里面的 <code>subdir</code>。', { x: 150, y: 250 });
        const end = m.closing('-p ＝ 一路盖到底', '中间缺的房间，自动补上');
        return [c.shot,
          shot('<code>subdir</code> 要放在 <code>new-dir</code> 里面，可是 <code>new-dir</code> <strong>还不存在</strong>。', async () => { await m.to(ghost, { o: 1 }, 400); }),
          shot('不加 <code>-p</code> 的话，<code>mkdir</code> 找不到上一层，直接报错放弃。', async () => { await m.shake(c.bot); await m.appear(err); }, 1500),
          shot('加上 <code>-p</code>（parents）：缺的上一层<strong>先补起来</strong>……', async () => {
            await Promise.all([m.fade(err), m.fade(ghost)]);
            await m.appear(a, 520);
          }),
          shot('……再把 <code>subdir</code> 盖在里面。', async () => {
            await m.to(b, { o: 1, s: 0.75 }, 300);
            await Promise.all([m.to(b, { x: 760 }, 700, E.inOut), m.to(arrow, { o: 1 }, 500)]);
            await m.pop(two);
          }, 1500),
          end];
      },
    },

    append: {
      title: '>> 就是接着往下写',
      make(m) {
        const typed = m.terminal();
        const L1 = '#!/bin/bash';
        const L2 = 'echo "Hello, World"';
        const hide = (x) => { x.o = 0; m.applyActor(x); };
        const main = m.paper([L1, L2], 330, 270, 400);
        const name = m.t('script.sh', { x: 330, y: 172, o: 0 }, 'f-label');
        hide(main.box); main.rows.forEach((r) => { hide(r.t); r.t.node.classList.add('sm'); });
        const alt = m.paper([L2], 750, 290, 320);
        const altName = m.t('如果第二次也用 >', { x: 750, y: 212, o: 0 }, 'f-hint');
        const lost = m.t('第一行不见了', { x: 750, y: 380, o: 0 }, 'f-warn-text');
        hide(alt.box); hide(alt.rows[0].t); alt.rows[0].t.node.classList.add('sm');
        const keep = m.badge('第一行还在', 330, 400);
        const end = m.closing('> 换新纸，>> 接着写', '一个箭头覆盖，两个箭头追加');
        const [r1, r2] = main.rows;
        return [
          shot('一个箭头 <code>&gt;</code>：创建 <code>script.sh</code>，写进第一行。', async () => {
            await m.type(typed, "echo '#!/bin/bash' > script.sh");
            await Promise.all([m.to(main.box, { o: 1 }, 400), m.to(name, { o: 1 }, 400)]);
            await m.to(r1.t, { o: 1 }, 300);
          }),
          shot('两个箭头 <code>&gt;&gt;</code>：新的一行<strong>接在最后面</strong>。', async () => {
            await m.retype(typed, "echo '" + L2 + "' >> script.sh");
            const y = r2.t.y;
            Object.assign(r2.t, { y: y + 30 }); m.applyActor(r2.t);
            await Promise.all([m.to(r2.t, { o: 1, y }, 500, E.back), m.to(r2.hl, { o: 1 }, 300)]);
          }),
          shot('第一行原封不动，文件现在有两行。', async () => { await m.to(r1.hl, { o: 1 }, 300); await m.pop(keep); }),
          shot('对照：如果第二次也用一个 <code>&gt;</code>，整张纸会换新，<strong>第一行就没了</strong>。', async () => {
            await Promise.all([m.to(alt.box, { o: 1 }, 400), m.to(altName, { o: 1 }, 400), m.to(alt.rows[0].t, { o: 1 }, 400)]);
            await m.to(lost, { o: 1 }, 300);
          }, 1600),
          end];
      },
    },

    chmod: {
      title: 'chmod 数字：每组三个开关',
      make(m) {
        const typed = m.terminal();
        const cols = [['拥有者', 240, [1, 1, 1]], ['用户组', 480, [1, 1, 0]], ['其他人', 720, [1, 0, 0]]];
        const vals = [['r', 4], ['w', 2], ['x', 1]];
        const built = cols.map(([title, cx]) => {
          const card = m.g([svg('rect', { x: -105, y: -150, width: 210, height: 300, rx: 24, class: 'f-card' }), text(title, { y: -112, class: 'f-row' })], { x: cx, y: 280, o: 0, s: 0.85 });
          const sws = vals.map(([ch, n], i) => {
            const y = 215 + i * 50;
            const label = m.t(ch + " = " + n, { x: cx - 40, y: y + 7, o: 0 }, 'f-line');
            label.node.classList.add('sm');
            const track = m.g([svg('rect', { x: -26, y: -15, width: 52, height: 30, rx: 15, class: 'f-switch' })], { x: cx + 50, y, o: 0 });
            const knob = m.actor(svg('circle', { r: 11, class: 'f-knob' }), { x: cx + 38, y, o: 0 });
            return { label, track, knob, n, ch };
          });
          const sum = m.t('0', { x: cx, y: 392, o: 0 }, 'f-big-name');
          const str = m.t('---', { x: cx, y: 418, o: 0 }, 'f-line');
          str.node.classList.add('sm');
          return { card, sws, sum, str, cx };
        });
        const total = m.chip('rwxrw-r--', 480, 456);
        const end = m.closing('读 4、写 2、运行 1', '每组加起来，就是那一位数字');
        const turnOn = async (col, on) => {
          let n = 0;
          let s = '';
          for (let i = 0; i < 3; i++) {
            const w = col.sws[i];
            if (on[i]) {
              m.hot(w.track);
              await m.to(w.knob, { x: col.cx + 62 }, 260, E.back);
              n += w.n;
              col.sum.node.textContent = String(n);
              col.sum.node.classList.add('acc');
              await m.to(col.sum, { s: 1.2 }, 120);
              await m.to(col.sum, { s: 1 }, 220, E.back);
            }
            s += on[i] ? w.ch : '-';
          }
          col.str.node.textContent = s;
        };
        return [
          shot('<code>764</code> 不是一个数字，而是<strong>三个数字</strong>，分给拥有者、用户组、其他人。', async () => {
            await m.type(typed, 'chmod 764 script.sh');
            await m.stagger(built, (b) => m.appear(b.card), 150);
          }),
          shot('每组有三个开关：读 <code>r</code> 是 4、写 <code>w</code> 是 2、运行 <code>x</code> 是 1。一开始全关，加起来是 0。', async () => {
            await m.stagger(built, (b) => Promise.all([
              ...b.sws.map((w) => Promise.all([m.to(w.label, { o: 1 }, 300), m.to(w.track, { o: 1 }, 300), m.to(w.knob, { o: 1 }, 300)])),
              m.to(b.sum, { o: 1 }, 300), m.to(b.str, { o: 1 }, 300)]), 120);
          }, 1600),
          shot('<strong>7</strong> = 4 + 2 + 1：拥有者三个全开，就是 <code>rwx</code>。', async () => { await turnOn(built[0], cols[0][2]); }, 1400),
          shot('<strong>6</strong> = 4 + 2：用户组可以读、写，就是 <code>rw-</code>。', async () => { await turnOn(built[1], cols[1][2]); }, 1400),
          shot('<strong>4</strong> = 只有读：其他人只能看，就是 <code>r--</code>。', async () => { await turnOn(built[2], cols[2][2]); }, 1400),
          shot('合起来，<code>764</code> 就是 <code>rwxrw-r--</code>。同理，<code>700</code> 是只有拥有者全开。', async () => { await m.appear(total); }, 1800),
          end];
      },
    },

    exec: {
      title: '运行权限 x 就是通行证',
      make(m) {
        const typed = m.terminal();
        const door = m.g([
          svg('rect', { x: -60, y: -110, width: 120, height: 214, rx: 10, class: 'f-door' }),
          svg('rect', { x: -18, y: -10, width: 36, height: 30, rx: 6, class: 'f-warn' }),
          svg('path', { d: 'M-11 -10 V-22 a11 11 0 0 1 22 0 V-10', class: 'f-no' }),
        ], { x: 640, y: 286 });
        m.g([svg('path', { d: 'M-72 108 V-122 H72 V108', class: 'f-frame' })], { x: 640, y: 286 });
        const perm = m.chip('rw-rw-r--', 640, 128);
        const permKey = m.t('拥有者的权限', { x: 800, y: 134, o: 0 }, 'f-hint');
        const doc = m.doc('script.sh', { x: 270, y: 330, s: 0.55 });
        const err = m.screen('zsh: permission denied: ./script.sh', 480, 436, true);
        const ok = m.screen('Hello, World');
        const c = m.crew(typed, './script.sh', '<code>./script.sh</code>：运行<strong>目前目录里的</strong> <code>script.sh</code>。', { x: 180, y: 300 });
        const end = m.closing('x ＝ 运行通行证', '没有 x，脚本只是一份文本文件');
        return [c.shot,
          shot('机器人拿着脚本，走到「运行」这扇门前。', async () => {
            await Promise.all([m.to(c.bot, { x: 450 }, 900, E.inOut), m.to(doc, { x: 545 }, 900, E.inOut)]);
          }),
          shot('门口检查权限：拥有者是 <code>rw-</code>，<strong>没有 x</strong>，门打不开。', async () => {
            await m.appear(perm); await m.to(permKey, { o: 1 }, 300);
            await m.shake(c.bot); await m.appear(err);
          }, 1600),
          shot('用 <code>chmod 764</code> 帮拥有者加上 <code>x</code>。', async () => {
            await m.fade(err);
            await m.retype(typed, 'sudo chmod 764 script.sh');
            await m.to(perm, { s: 1.15 }, 160);
            perm.node.querySelector('text').textContent = 'rwxrw-r--';
            m.hot(perm);
            await m.to(perm, { s: 1 }, 360, E.back);
          }),
          shot('再运行一次：门开了，脚本里的命令真的跑起来。', async () => {
            await m.retype(typed, './script.sh');
            await m.to(door, { o: 0.12 }, 500);
            await Promise.all([m.to(c.bot, { x: 810 }, 900, E.inOut), m.to(doc, { x: 900 }, 900, E.inOut)]);
            await m.appear(ok);
          }, 1600),
          end];
      },
    },
    reverse: {
      title: '解题：从权限字符串倒推数字',
      make(m) {
        const typed = m.terminal();
        const S = '-rwxrw----';
        const VAL = [4, 2, 1];
        const chars = Array.from(S).map((ch, i) => m.t(ch, { x: 480 + (i - 4.5) * 40, y: 205, o: 1 }, 'f-perm'));
        const goal = m.t('目标', { x: 480, y: 140 }, 'f-hint');
        const groups = [['拥有者', 240], ['用户组', 480], ['其他人', 720]].map(([who, cx], g) => {
          const cs = chars.slice(1 + g * 3, 4 + g * 3);
          const vals = cs.map((c, k) => {
            const on = c.node.textContent !== '-';
            const v = m.t(on ? String(VAL[k]) : '0', { x: cx + (k - 1) * 56, y: 268, o: 0 }, 'f-line');
            if (!on) v.node.classList.add('off');
            return v;
          });
          const sum = cs.reduce((n, c, k) => n + (c.node.textContent !== '-' ? VAL[k] : 0), 0);
          const total = m.t('= ' + sum, { x: cx, y: 352, o: 0 }, 'f-big-name acc');
          const label = m.t(who, { x: cx, y: 150, o: 0 }, 'f-row');
          return { cs, cx, vals, total, label };
        });
        const answer = m.chip('chmod 760', 480, 430);
        const end = m.closing('倒推：有字母就加分', 'r 4、w 2、x 1，每组加起来');
        const count = async (g) => {
          for (const v of g.vals) await m.appear(v, 300);
          await m.appear(g.total);
          g.cs.filter((c) => c.node.textContent !== '-').forEach((c) => m.hot(c));
        };
        return [
          shot('目标权限是 <code>-rwxrw----</code>。第 1 格是类型，<strong>不用算</strong>，先拿掉。', async () => {
            await m.to(chars[0], { o: 0, y: 160 }, 500);
          }),
          shot('剩下 9 格，每 3 格切成一组：拥有者、用户组、其他人。', async () => {
            await m.fade(goal, 200);
            await Promise.all(groups.flatMap((g) => g.cs.map((c, k) => m.to(c, { x: g.cx + (k - 1) * 56 }, 700, E.inOut))));
            await m.stagger(groups, (g) => m.to(g.label, { o: 1 }, 300), 120);
          }),
          shot('拥有者 <code>rwx</code>：三个都有，<strong>4 + 2 + 1 = 7</strong>。', async () => { await count(groups[0]); }, 1400),
          shot('用户组 <code>rw-</code>：没有 x，<strong>4 + 2 + 0 = 6</strong>。', async () => { await count(groups[1]); }, 1400),
          shot('其他人 <code>---</code>：什么都没有，<strong>0</strong>。', async () => { await count(groups[2]); }, 1400),
          shot('三个数字排在一起，就是 <code>760</code>。', async () => {
            await m.appear(answer);
            await m.type(typed, 'sudo chmod 760 target_file');
          }, 1600),
          end];
      },
    },
  });

  // 用户账号 -------------------------------------------------------------
  // 管理员印章（sudo）
  const seal = (m, x, y) => m.g([
    svg('path', { d: 'M-36 -10 L-36 -42 L-16 -24 L0 -48 L16 -24 L36 -42 L36 -10 Z', class: 'f-crown' }),
    text('sudo', { y: 22, class: 'f-label' }),
  ], { x, y, o: 0, s: 0.6 });

  // 用户名册 /etc/passwd：返回每一行的 { t, hl }
  function roster(m, x, y, lines, shown = []) {
    const hgt = 64 + lines.length * 40;
    m.g([svg('rect', { x: -230, y: -hgt / 2, width: 460, height: hgt, rx: 22, class: 'f-card' }), text('/etc/passwd　用户名册', { y: -hgt / 2 + 32, class: 'f-hint' })], { x, y });
    return lines.map((str, i) => {
      const yy = y - hgt / 2 + 76 + i * 40;
      const hl = m.g([svg('rect', { x: -214, y: -19, width: 428, height: 38, rx: 10, class: 'f-hl' })], { x, y: yy - 6, o: 0 });
      const t = m.t(str, { x, y: yy, o: shown[i] === 0 ? 0 : 1 }, 'f-line sm');
      shrink(t.node, 400);
      return { t, hl };
    });
  }

  const key = (m, init) => m.g([
    svg('circle', { cx: -24, cy: 0, r: 17, class: 'f-acc' }),
    svg('circle', { cx: -24, cy: 0, r: 6, class: 'f-face' }),
    svg('rect', { x: -8, y: -5, width: 56, height: 10, rx: 4, class: 'f-acc' }),
    svg('rect', { x: 30, y: 4, width: 9, height: 13, rx: 2, class: 'f-acc' }),
  ], init);

  const relabel = (chip, str) => { chip.node.querySelector('text').textContent = str; };

  Object.assign(Movie.films, {
    useradd: {
      title: 'useradd 就是在名册登记一行',
      make(m) {
        const typed = m.terminal();
        const rows = roster(m, 650, 240, ['root:x:0:0:…', 'labex:x:5000:5000:…', 'joker:x:5001:5001::/home/joker:/bin/sh'], [1, 1, 0]);
        const stamp = seal(m, 250, 170);
        const ghost = m.g([svg('rect', { x: -130, y: -36, width: 260, height: 72, rx: 18, class: 'f-slot' }), text('/home/joker 还没盖', { y: 6, class: 'f-hint' })], { x: 650, y: 400, o: 0 });
        const c = m.crew(typed, 'sudo useradd joker', '要帮新住户 <code>joker</code> 开一个账号。');
        const end = m.closing('useradd ＝ 名册登记一行', '只登记数据，家目录还没盖');
        return [c.shot,
          shot('开账号是管理员的工作，所以要用 <code>sudo</code> 借印章。不加就会被挡下：permission denied。', async () => { await m.appear(stamp); }),
          shot('<code>/etc/passwd</code> 是用户名册，一个账号一行。现在多了 <code>joker</code> 这一行。', async () => {
            await m.to(rows[2].hl, { o: 1 }, 300);
            await m.to(rows[2].t, { o: 1 }, 400);
            m.hot(rows[2].t);
          }, 1500),
          shot('名册上写着家在 <code>/home/joker</code>，但那个目录<strong>还没创建</strong>。', async () => { await m.to(ghost, { o: 1 }, 400); }, 1500),
          end];
      },
    },

    useraddm: {
      title: 'useradd -m：顺便盖好家',
      make(m) {
        const typed = m.terminal();
        const ghost = m.g([svg('rect', { x: -100, y: -70, width: 200, height: 140, rx: 18, class: 'f-slot' }), text('只有登记', { y: 6, class: 'f-hint' })], { x: 560, y: 240, o: 0 });
        const home = m.folder('/home/bob', { x: 560, y: 230, o: 0, s: 0.5 });
        const tagLine = m.t('drwxr-x---  bob bob', { x: 560, y: 392, o: 0 }, 'f-line');
        const keep = m.badge('其他人进不来', 800, 230);
        const c = m.crew(typed, 'sudo useradd -m bob', '这次创建 <code>bob</code>，多加一个 <code>-m</code>。', { x: 200, y: 250 });
        const end = m.closing('-m ＝ 顺便盖好家', '不加 -m，只有名册上的一行');
        return [c.shot,
          shot('不加 <code>-m</code>：只在名册登记，家目录的位置是空的。', async () => { await m.to(ghost, { o: 1 }, 400); }),
          shot('<code>-m</code> 是 make home：登记的同时，把 <code>/home/bob</code> 一起建好。', async () => { await m.fade(ghost); await m.appear(home, 520); }),
          shot('用 <code>ls -ld</code> 看这个目录：主人和用户组都是 <code>bob</code>。', async () => { await m.to(tagLine, { o: 1 }, 400); }),
          shot('权限最后三格是 <code>---</code>，其他人什么都不能做。', async () => { await m.pop(keep); }, 1500),
          end];
      },
    },

    passwd: {
      title: 'passwd 就是配钥匙',
      make(m) {
        const typed = m.terminal();
        m.g([svg('rect', { x: -220, y: -90, width: 440, height: 180, rx: 24, class: 'f-card' })], { x: 400, y: 240 });
        const ask1 = m.t('New password:', { x: 400, y: 215, o: 0 }, 'f-line');
        const ask2 = m.t('Retype new password:', { x: 400, y: 275, o: 0 }, 'f-line');
        const quiet = m.badge('打字时画面不会动', 400, 370);
        m.g([svg('rect', { x: -95, y: -70, width: 190, height: 140, rx: 18, class: 'f-machine' }), text('/etc/shadow', { y: 8, class: 'f-machine-text' })], { x: 790, y: 240 });
        const k = key(m, { x: 400, y: 370, o: 0, s: 0.6 });
        const ok = m.screen('password updated successfully');
        const c = m.crew(typed, 'sudo passwd joker', '新账号还没有密码。帮 <code>joker</code> 配一把钥匙。', { x: 110, y: 400, s: 0.7 });
        const end = m.closing('passwd ＝ 配钥匙', '打两次确认，画面不显示是正常的');
        return [c.shot,
          shot('输入新密码。画面上<strong>什么都不会显示</strong>，这是为了不让旁边的人看到。', async () => { await m.to(ask1, { o: 1 }, 300); await m.pop(quiet); }, 1500),
          shot('再打一次，确认没有打错。', async () => { await m.to(ask2, { o: 1 }, 300); }),
          shot('两次一样，钥匙就配好了。', async () => { await m.fade(quiet, 200); await m.pop(k); }),
          shot('密码不放在名册里（那一格只写 <code>x</code>），而是加密后锁进 <code>/etc/shadow</code>。', async () => {
            await m.to(k, { x: 790, y: 240, s: 0.5, o: 0 }, 900, E.inOut);
            await m.appear(ok);
          }, 1500),
          end];
      },
    },

    usermod: {
      title: 'usermod 就是改登记数据',
      make(m) {
        const typed = m.terminal();
        const cols = [['joker', 110, '名称'], ['x', 225, '密码'], ['5001', 320, 'UID'], ['5001', 430, 'GID'], ['/home/joker', 590, '家目录'], ['/bin/bash', 800, 'Shell']];
        const chips = cols.map(([s, x]) => m.chip(s, x, 170, { o: 1, s: 1 }));
        relabel(chips[5], '/bin/sh');
        const labels = cols.map(([, x, k]) => m.t(k, { x, y: 222, o: 0 }, 'f-hint'));
        m.t('加入的用户组', { x: 130, y: 326 }, 'f-hint');
        m.chip('joker', 270, 320, { o: 1, s: 1 });
        const club = m.chip('sudo', 380, 320);
        const warn = m.badge('少了 -a，原本的用户组会被换掉', 660, 320);
        const end = m.closing('usermod ＝ 改登记数据', '-d 改家、-s 改 Shell、-aG 加用户组');
        const flip = async (chip, str) => {
          await m.to(chip, { o: 0, y: 158 }, 200);
          relabel(chip, str);
          m.hot(chip);
          await m.to(chip, { o: 1, y: 170 }, 360, E.back);
        };
        return [
          shot('名册上 <code>joker</code> 那一行，拆开来是这几格。<code>usermod</code> 可以改其中的格子。', async () => { await m.stagger(labels, (x) => m.to(x, { o: 1 }, 260), 90); }),
          shot('<code>-d</code> 改家目录那一格：<code>/home/joker</code> 换成 <code>/home/wayne</code>。', async () => { await m.retype(typed, 'sudo usermod -d /home/wayne joker'); await flip(chips[4], '/home/wayne'); }, 1400),
          shot('<code>-s</code> 改 Shell 那一格：<code>/bin/sh</code> 换成 <code>/bin/bash</code>。', async () => { await m.retype(typed, 'sudo usermod -s /bin/bash joker'); await flip(chips[5], '/bin/bash'); }, 1400),
          shot('<code>-aG</code>：<code>G</code> 指定用户组，<code>a</code> 是 append（附加）。<code>joker</code> 多加入 <code>sudo</code> 用户组。', async () => { await m.retype(typed, 'sudo usermod -aG sudo joker'); await m.appear(club); m.hot(club); }, 1400),
          shot('一定要有 <code>a</code>。只写 <code>-G</code> 的话，原本的用户组会被整个换掉。', async () => { await m.pop(warn); }, 1600),
          end];
      },
    },

    su: {
      title: 'su - 就是换人登录',
      make(m) {
        const typed = m.terminal();
        const me = m.robot({ x: 260, y: 270 });
        const other = m.robot({ x: 680, y: 270, o: 0.3 });
        const n1 = m.badge('labex', 260, 350);
        const n2 = m.badge('joker', 680, 350);
        const ps = m.chip('joker@…:~$', 680, 160);
        const stamp = seal(m, 840, 270);
        const ask = m.screen('Password:');
        const end = m.closing('su - ＝ 换人登录', 'exit 换回原本的自己');
        return [
          shot('<code>su</code> 是 switch user：换成另一个用户。', async () => { await m.type(typed, 'su - joker'); await Promise.all([m.pop(n1), m.pop(n2)]); }),
          shot('要换成 <code>joker</code>，得先输入 <code>joker</code> 的密码。', async () => { await m.appear(ask); }, 1400),
          shot('通过后换 <code>joker</code> 上场。中间的 <code>-</code> 代表完整登录：家目录和环境一起换，提示字符也变了。', async () => {
            await m.fade(ask, 200);
            await Promise.all([m.to(me, { o: 0.3 }, 500), m.to(other, { o: 1 }, 500)]);
            await m.appear(ps);
          }, 1600),
          shot('<code>joker</code> 在 <code>sudo</code> 用户组里，所以也能借管理员印章，读到 <code>/etc/shadow</code>。', async () => { await m.appear(stamp); }, 1500),
          shot('输入 <code>exit</code> 离开，回到原本的 <code>labex</code>。', async () => {
            await Promise.all([m.fade(stamp), m.fade(ps), m.to(other, { o: 0.3 }, 500), m.to(me, { o: 1 }, 500)]);
          }, 1300),
          end];
      },
    },

    lock: {
      title: 'passwd -l 上锁，-u 解锁',
      make(m) {
        const typed = m.terminal();
        const door = m.g([
          svg('rect', { x: -90, y: -120, width: 180, height: 240, rx: 20, class: 'f-card' }),
          svg('circle', { cx: 50, cy: 10, r: 12, class: 'f-acc2' }),
          text('joker', { y: -60, class: 'f-row' }),
        ], { x: 640, y: 255 });
        const k = key(m, { x: 250, y: 265 });
        const locked = m.badge('已上锁', 640, 345);
        const open = m.badge('登录成功', 640, 345);
        const err = m.screen('su: Authentication failure', 480, 436, true);
        const end = m.closing('-l 上锁，-u 解锁', '密码还在，只是暂时不能用');
        return [
          shot('<code>-l</code> 是 lock：把 <code>joker</code> 的账号锁起来。', async () => { await m.type(typed, 'sudo passwd -l joker'); await m.pop(locked); }),
          shot('密码没有被删掉，只是不能用。这时 <code>su - joker</code>，就算密码打对也进不去。', async () => {
            await m.to(k, { x: 560, y: 265 }, 800, E.inOut);
            await m.shake(k);
            await m.appear(err);
            await m.to(k, { x: 250, y: 265 }, 600, E.inOut);
          }, 1500),
          shot('<code>-u</code> 是 unlock：把锁解开。', async () => { await m.retype(typed, 'sudo passwd -u joker'); await Promise.all([m.fade(err), m.fade(locked)]); }),
          shot('同一把钥匙又能用了，不用重设密码。', async () => {
            await m.to(k, { x: 600, y: 265 }, 800, E.inOut);
            m.hot(door);
            await m.pop(open);
          }, 1500),
          end];
      },
    },

    userdel: {
      title: 'userdel -r 就是退房清空',
      make(m) {
        const typed = m.terminal();
        const rows = roster(m, 280, 260, ['root:x:0:0:…', 'labex:x:5000:5000:…', 'joker:x:5001:5001:…', 'bob:x:5002:5002::/home/bob:/bin/sh']);
        const home = m.folder('/home/bob', { x: 760, y: 170, s: 0.8 });
        const sh = shredder(m, 760, 330);
        const gone = m.screen('No such file or directory', 480, 436, true);
        const c = m.crew(typed, 'sudo userdel -r bob', '<code>bob</code> 不需要了，把这个账号删掉。', { x: 580, y: 270, s: 0.8 });
        const end = m.closing('userdel -r ＝ 退房清空', '不加 -r，家目录会留下来');
        return [c.shot,
          shot('<code>userdel</code> 把名册上 <code>bob</code> 那一行划掉。', async () => {
            await m.to(rows[3].hl, { o: 1 }, 300);
            await m.wait(400);
            await Promise.all([m.fade(rows[3].t, 500), m.fade(rows[3].hl, 500)]);
          }),
          shot('<code>-r</code> 是 remove：连家目录 <code>/home/bob</code> 和里面的东西一起删。', async () => {
            await m.to(home, { y: 320, o: 0 }, 900, E.inOut);
            await sh.fall();
          }, 1300),
          shot('再去名册找 <code>bob</code>，什么都找不到；看 <code>/home/bob</code>，也不存在了。', async () => { await m.appear(gone); }, 1500),
          end];
      },
    },
    uname: {
      title: 'uname 就是看大楼的铭牌',
      make(m) {
        const typed = m.terminal();
        const plate = m.paper(['系统　Linux', '主机　6af99ac568b2…', '内核　6.8.0-111-generic', '硬件　x86_64', '操作系统　GNU/Linux'], 620, 262, 440);
        plate.rows.forEach((r) => { r.t.o = 0; m.applyActor(r.t); });
        const out = m.screen('Linux', 250, 420);
        const all = m.badge('-a ＝ all，全部', 250, 420);
        const c = m.crew(typed, 'uname', '你问服务台：这栋大楼跑的是什么系统？', { x: 200, y: 250 });
        const end = m.closing('uname ＝ 看铭牌', '-a 把整块铭牌念完');
        return [c.shot,
          shot('小机器人走到门口的铭牌前。不加选项，只念第一行：系统名称。', async () => {
            await m.to(c.bot, { x: 330, y: 250 }, 800, E.inOut);
            await Promise.all([m.to(plate.rows[0].hl, { o: 1 }, 300), m.to(plate.rows[0].t, { o: 1 }, 300)]);
            await m.appear(out);
          }),
          shot('加上 <code>-a</code>（all）：整块铭牌从头念到尾。', async () => {
            await m.fade(out);
            await m.retype(typed, 'uname -a');
            await m.stagger(plate.rows.slice(1), (r) => m.to(r.t, { o: 1 }, 300), 220);
          }),
          shot('主机名称、内核版本、硬件架构，全部接在同一行印出来。', async () => {
            await m.stagger(plate.rows.slice(1), (r) => m.to(r.hl, { o: 1 }, 240), 120);
            await m.pop(all);
          }, 1500),
          end];
      },
    },

    uptime: {
      title: 'uptime 就是大楼的营运纪录牌',
      make(m) {
        const typed = m.terminal();
        const out = m.screen('20:10:16 up 186 days, 6:39, 0 users, load average: 0.19, 0.29, 0.22', 480, 132);
        const card = (label, val, x) => m.g([
          svg('rect', { x: -82, y: -56, width: 164, height: 112, rx: 18, class: 'f-paper' }),
          text(label, { y: -16, class: 'f-hint' }),
          text(val, { y: 24, class: 'f-label' }),
        ], { x, y: 290, s: 0.7, o: 0 });
        const cards = [['现在时间', '20:10:16', 300], ['已经开机', '186 天 6:39', 478], ['登录人数', '0 users', 656], ['平均负载', '0.19 0.29 0.22', 834]].map(([a, b, x]) => card(a, b, x));
        const mins = m.badge('1 分、5 分、15 分钟', 780, 400);
        const c = m.crew(typed, 'uptime', '你问服务台：这栋大楼已经连续营运多久了？', { x: 120, y: 290 });
        const end = m.closing('uptime ＝ 开机多久', '顺便告诉你几人在线、忙不忙');
        return [c.shot,
          shot('答案只有一行，从左到右可以切成四段。', async () => { await m.appear(out); }),
          shot('第一段是现在时间。第二段 <code>up 186 days</code> 是已经连续开机多久。', async () => { await m.appear(cards[0]); await m.appear(cards[1]); }),
          shot('<code>0 users</code> 是现在有几个人登录。', async () => { await m.appear(cards[2]); }),
          shot('最后三个数字是<strong>平均负载</strong>：最近 1 分钟、5 分钟、15 分钟有多忙。数字越小越闲。', async () => { await m.appear(cards[3]); await m.pop(mins); }, 1600),
          end];
      },
    },

    top: {
      title: 'top 就是管理室的即时监视墙',
      make(m) {
        const typed = m.terminal();
        const wall = m.paper(['PID　USER　%CPU　COMMAND', '272　labex　0.3　tmux: server', '1　root　0.0　init.sh', '21　root　0.0　supervisord', '1394　labex　0.0　top'], 610, 262, 470);
        wall.rows.forEach((r) => { r.t.o = 0; m.applyActor(r.t); });
        const sums = [m.chip('共 42 个程序', 190, 330), m.chip('CPU 闲置 98.7%', 190, 376), m.chip('内存约 15 GB', 190, 422)];
        const quit = m.badge('按 q 离开', 610, 436);
        const c = m.crew(typed, 'top', '你走进管理室，想知道大楼里现在有哪些程序在跑。', { x: 190, y: 230 });
        const end = m.closing('top ＝ 即时监视墙', '一直更新，按 q 离开');
        const busy = wall.rows[1];
        return [c.shot,
          shot('墙上亮起一张表：<strong>每一行是一个正在运行的程序</strong>。', async () => { await m.stagger(wall.rows, (r) => m.to(r.t, { o: 1 }, 280), 160); }),
          shot('表的上方还有摘要：总共几个程序、CPU 有多闲、内存有多少。', async () => { await m.stagger(sums, (x) => m.appear(x), 200); }),
          shot('最忙的排在最上面。<code>%CPU</code> 是它现在用掉多少 CPU。', async () => { await m.to(busy.hl, { o: 1 }, 320); }),
          shot('这张表<strong>每隔几秒自动更新</strong>，数字会一直跳。', async () => {
            for (const v of ['0.7', '0.0', '0.3']) {
              await m.to(busy.hl, { o: 0.2 }, 200);
              busy.t.node.textContent = `272　labex　${v}　tmux: server`;
              await m.to(busy.hl, { o: 1 }, 260);
              await m.wait(420);
            }
          }),
          shot('它会一直占着画面，按 <code>q</code> 才会回到提示字符。', async () => { await m.pop(quit); }, 1500),
          end];
      },
    },
    tree: {
      title: 'tree 就是楼层平面图',
      make(m) {
        const typed = m.terminal();
        const rooms = [['config/', 'config.json', 380], ['docs/', 'README.md', 600], ['src/', 'main_app.py', 820]];
        const set = rooms.map(([room, file, x]) => ({
          room: m.folder(room, { x, y: 190, s: 0.7, o: 0 }),
          wire: m.g([svg('line', { x1: 0, y1: 0, x2: 0, y2: 36, class: 'f-stroke' })], { x, y: 266, o: 0 }),
          doc: m.doc(file, { x, y: 350, s: 0.55, o: 0 }),
        }));
        const ls = m.screen('config  docs  src', 600, 112);
        const sum = m.screen('3 directories, 3 files', 600, 112);
        const c = m.crew(typed, 'tree', '整理完了，想一眼看清楚整个项目长什么样子。', { x: 150, y: 260 });
        const end = m.closing('tree ＝ 楼层平面图', '一层一层画出来，每间有什么一目了然');
        return [c.shot,
          shot('如果用 <code>ls</code>，只看得到这一层的三间房间，<strong>看不到房间里面</strong>。', async () => {
            await m.stagger(set, (x) => m.appear(x.room), 150);
            await m.appear(ls);
          }),
          shot('<code>tree</code> 会一间一间走进去，把里面的东西也画出来，用线连到它所在的房间。', async () => {
            await m.fade(ls);
            await m.stagger(set, async (x) => { await m.to(x.wire, { o: 1 }, 260); await m.appear(x.doc); }, 260);
          }),
          shot('最后一行帮你算好总数：3 个目录、3 个文件。', async () => { await m.appear(sum); }, 1500),
          end];
      },
    },

    glob: {
      title: '* 就是服务台先点名',
      make(m) {
        const typed = m.terminal();
        const names = ['app_2023-01-15.log', 'app_2024-05-01.log', 'db_2023-02-20.log', 'old_logs.tar.gz'];
        const chips = names.map((n, i) => m.chip(n, 690, 150 + i * 66, { s: 1, o: 1 }));
        const hit = [0, 2];
        const pat = m.bubble('*_2023-*.log', { x: 330, y: 190, o: 0, s: 0.7 });
        const rule = m.t('前面随便 ＋ _2023- ＋ 随便 ＋ .log', { x: 330, y: 266, o: 0 }, 'f-hint');
        const c = m.crew(typed, 'rm *_2023-*.log', '你要服务台删掉所有 2023 年的日志文件。注意名字里的 <code>*</code>。', { x: 170, y: 380 });
        const end = m.closing('* ＝ 先点名，再动手', 'Shell 先换成文件名，命令才开始做事');
        return [c.shot,
          shot('服务台不会直接把 <code>*_2023-*.log</code> 交出去。它先拿着这个样式，到房间里<strong>一个一个对名字</strong>。', async () => {
            await m.appear(pat);
            await m.to(rule, { o: 1 }, 400);
          }),
          shot('<code>*</code> 可以代表任何长度的任何字。符合样式的只有两个。', async () => {
            await m.stagger(chips, async (x, i) => {
              if (hit.includes(i)) m.hot(x); else await m.to(x, { o: 0.35 }, 300);
            }, 220);
          }),
          shot('样式被换成这两个文件名。<code>rm</code> 真正收到的，是一张已经写好名字的清单。', async () => {
            await m.retype(typed, 'rm app_2023-01-15.log db_2023-02-20.log');
          }),
          shot('<code>rm</code> 照清单删掉。没对上的两个，连碰都没碰到。', async () => {
            await m.stagger(hit.map((i) => chips[i]), (x) => m.to(x, { o: 0, s: 0.6 }, 420), 160);
            await Promise.all([0, 1, 2, 3].filter((i) => !hit.includes(i)).map((i) => m.to(chips[i], { o: 1 }, 300)));
          }, 1500),
          end];
      },
    },

    tar: {
      title: 'tar 就是打包封箱',
      make(m) {
        const typed = m.terminal();
        const olds = [['app_2023-01-15.log', 150], ['db_2023-02-20.log', 340]];
        const docs = olds.map(([n, x]) => m.doc(n, { x, y: 270, s: 0.8 }));
        const copies = olds.map(([n, x]) => m.doc(n, { x, y: 270, s: 0.8, o: 0 }, true));
        const box = m.g([
          svg('path', { d: 'M-110 -60 L-82 -94 H82 L110 -60 Z', class: 'f-box-lid' }),
          svg('rect', { x: -110, y: -60, width: 220, height: 130, rx: 14, class: 'f-box' }),
          svg('rect', { x: -86, y: -10, width: 172, height: 36, rx: 8, class: 'f-paper' }),
          text('old_logs.tar.gz', { y: 14, class: 'f-hint' }),
        ], { x: 720, y: 290, s: 0.6, o: 0 });
        const zip = m.badge('-z 压扁', 720, 410);
        const list = m.screen('app_2023-01-15.log  db_2023-02-20.log', 480, 436);
        const c = m.crew(typed, 'tar -czf old_logs.tar.gz *_2023-*.log', '旧的日志文件要清掉，但怕以后还要查。先把它们打包成一箱。', { x: 520, y: 170 });
        const end = m.closing('tar ＝ 打包封箱', '-c 装箱、-z 压扁、-f 取名、-t 看清单');
        return [c.shot,
          shot('<code>-c</code> 是 create，准备一个新箱子。<code>-f</code> 后面紧接着箱子的名字。', async () => { await m.appear(box, 520); }),
          shot('<code>*_2023-*.log</code> 点名出两个文件，各<strong>复制一份</strong>装进箱子。原本的还留在原地。', async () => {
            await m.stagger(copies, async (x) => {
              await m.to(x, { o: 1 }, 1);
              await m.to(x, { x: 720, y: 270, s: 0.3 }, 900, E.inOut);
              await m.to(x, { o: 0 }, 200);
            }, 300);
          }),
          shot('<code>-z</code> 用 gzip 压缩：箱子被压扁，占的空间更小。', async () => {
            await m.to(box, { s: 0.82 }, 500, E.back);
            await m.pop(zip);
          }),
          shot('箱子封好了，才用 <code>rm</code> 把原本的旧文件删掉。', async () => {
            await m.fade(zip);
            await m.retype(typed, 'rm *_2023-*.log');
            await m.stagger(docs, (x) => m.to(x, { o: 0, s: 0.5 }, 420), 160);
          }),
          shot('想确认箱子里有什么，不用拆开：<code>-t</code> 只念出装箱清单。', async () => {
            await m.retype(typed, 'tar -tzf old_logs.tar.gz');
            m.hot(box);
            await m.appear(list);
          }, 1600),
          end];
      },
    },
    grep: {
      title: 'grep 就是荧光笔',
      make(m) {
        const typed = m.terminal();
        const log = m.paper(['10:00:01 INFO  …', '10:00:03 ERROR 付款失败', '10:00:04 INFO  …', '10:00:05 ERROR NullPointer', '10:00:06 INFO  …'], 330, 290, 400);
        const hit = [1, 3];
        const scan = m.g([svg('rect', { x: -200, y: -3, width: 400, height: 6, rx: 3, class: 'f-light' })], { x: 330, y: 160, o: 0 });
        const out = m.blank('error_report.txt', { x: 790, y: 270, s: 0.9 });
        const copies = hit.map((i) => m.chip(['ERROR 付款失败', 'ERROR NullPointer'][hit.indexOf(i)], 330, log.rows[i].t.y - 7));
        const c = m.crew(typed, 'grep "ERROR" app.log', '你要在日志文件里找出所有出错的地方。', { x: 610, y: 170 });
        const end = m.closing('grep ＝ 荧光笔', '整份扫过，只抄出有那个字的行');
        return [c.shot,
          shot('<code>grep</code> 从第一行开始，一行一行扫过整份文件。', async () => {
            await m.to(scan, { o: 1 }, 200);
            await m.to(scan, { y: 410 }, 1400, E.inOut);
            await m.to(scan, { o: 0 }, 200);
          }),
          shot('只要那一行里有 <code>ERROR</code>，就用荧光笔标起来。其他行不理。', async () => {
            await m.stagger(hit, (i) => m.to(log.rows[i].hl, { o: 1 }, 320), 300);
          }),
          shot('加上 <code>&gt; error_report.txt</code>，标起来的行就抄进文件，不印在画面上。', async () => {
            await m.retype(typed, 'grep "ERROR" app.log > error_report.txt');
            await m.stagger(copies, async (x) => {
              await m.to(x, { o: 1, s: 1 }, 200);
              await m.to(x, { x: 790, y: 270, s: 0.4 }, 900, E.inOut);
              await m.to(x, { o: 0 }, 200);
            }, 260);
            m.glow(out, true);
          }, 1500),
          end];
      },
    },

    pipe: {
      title: '| 就是输送带',
      make(m) {
        const typed = m.terminal();
        m.g([
          svg('rect', { x: -70, y: -90, width: 140, height: 180, rx: 20, class: 'f-machine' }),
          text('dmesg', { y: 8, class: 'f-machine-text' }),
        ], { x: 110, y: 230 });
        m.g([svg('rect', { x: 0, y: -6, width: 560, height: 12, rx: 6, class: 'f-belt' })], { x: 200, y: 404 });
        const sieve = m.g([
          svg('rect', { x: -14, y: -130, width: 28, height: 250, rx: 10, class: 'f-sieve' }),
          text('grep -i -E', { y: 150, class: 'f-hint' }),
        ], { x: 560, y: 210 });
        const file = m.blank('boot_issues.txt', { x: 880, y: 250, s: 0.8 });
        const lines = [['fail to add MMCONFIG', true], ['PCI: Using ACPI', false], ['RAS: Correctable Errors', true], ['Memory: 16GB', false], ['probe … failed', true]];
        const chips = lines.map(([str], i) => m.chip(str, 330, 120 + i * 50));
        const c = m.crew(typed, 'sudo dmesg', '<code>dmesg</code> 会吐出系统内核留下的消息。读这些要管理员权限，所以加 <code>sudo</code>。', { x: 110, y: 410 });
        const end = m.closing('| ＝ 输送带', '左边的输出，直接变成右边的输入');
        return [c.shot,
          shot('消息一行一行跑出来。很多，大部分都是正常的。', async () => { await m.stagger(chips, (x) => m.appear(x, 300), 140); }),
          shot('加上 <code>| grep -i -E \'fail|error\'</code>：<code>|</code> 是管道，输出不印在画面上，直接送上输送带交给 <code>grep</code>。', async () => {
            await m.retype(typed, "sudo dmesg | grep -i -E 'fail|error'");
            m.hot(sieve);
          }),
          shot('<code>grep</code> 只放行含有 fail 或 error 的行。<code>-i</code> 让 <code>Errors</code>、<code>failed</code> 这种大小写不同的也算数。', async () => {
            await m.stagger(chips, async (x, i) => {
              if (lines[i][1]) await m.to(x, { x: 690 }, 800, E.inOut);
              else { await m.to(x, { x: 440 }, 500, E.inOut); await m.to(x, { o: 0, y: x.y + 30 }, 400); }
            }, 180);
          }),
          shot('最后的 <code>&gt; boot_issues.txt</code> 把通过的行写进文件。', async () => {
            await m.retype(typed, "sudo dmesg | grep -i -E 'fail|error' > boot_issues.txt");
            await m.stagger(chips.filter((_, i) => lines[i][1]), async (x) => {
              await m.to(x, { x: 880, y: 250, s: 0.4 }, 800, E.inOut);
              await m.to(x, { o: 0 }, 200);
            }, 220);
            m.glow(file, true);
          }, 1500),
          end];
      },
    },

    diffr: {
      title: 'diff -r 就是两间房间点名',
      make(m) {
        const typed = m.terminal();
        const left = m.folder('server1_files/', { x: 220, y: 190, s: 0.75 });
        const right = m.folder('server2_files/', { x: 740, y: 190, s: 0.75 });
        const same = [m.chip('（两边都有的文件）', 220, 300), m.chip('（两边都有的文件）', 740, 300)];
        const only = m.chip('asset2.js', 220, 350);
        const out = m.screen('Only in server1_files/: asset2.js', 480, 436);
        const c = m.crew(typed, 'diff -r server1_files/ server2_files', '两台服务器的文件应该一模一样。你怀疑其中一台少了东西。', { x: 480, y: 250 });
        const end = m.closing('diff -r ＝ 两间房间点名', '只有一边有的，报 Only in');
        return [c.shot,
          shot('<code>-r</code> 让 <code>diff</code> 走进两个目录，把里面的文件名一个一个对照。', async () => {
            await Promise.all([m.appear(same[0]), m.appear(same[1])]);
            await m.appear(only);
          }),
          shot('两边都有的文件，会再比对内容。内容一样就不说话。', async () => {
            same.forEach((x) => m.hot(x));
            await m.wait(500);
            await Promise.all(same.map((x) => { m.hot(x, false); return m.to(x, { o: 0.4 }, 400); }));
          }),
          shot('只有一边才有的，就报告 <code>Only in</code>，告诉你它在哪一边。', async () => {
            m.hot(only);
            await m.shake(only);
            await m.appear(out);
          }, 1500),
          end];
      },
    },

    shebang: {
      title: '脚本就是一夹写好的工单',
      make(m) {
        const typed = m.terminal();
        const l1 = text('#!/bin/bash', { y: -48, class: 'f-line' });
        const l2 = text("echo 'Hello, World!'", { y: 12, class: 'f-line' });
        const board = m.g([
          svg('rect', { x: -150, y: -120, width: 300, height: 230, rx: 20, class: 'f-card' }),
          svg('rect', { x: -40, y: -132, width: 80, height: 24, rx: 8, class: 'f-machine' }),
          l1, l2,
          text('hello.sh', { y: 88, class: 'f-hint' }),
        ], { x: 220, y: 290 });
        shrink(l2, 262);
        const cover = m.g([svg('rect', { x: -138, y: -78, width: 276, height: 44, rx: 12, class: 'f-hl' })], { x: 220, y: 290, o: 0 });
        const step = m.g([svg('rect', { x: -138, y: -18, width: 276, height: 44, rx: 12, class: 'f-hl' })], { x: 220, y: 290, o: 0 });
        const bash = m.g([
          svg('rect', { x: -80, y: -60, width: 160, height: 120, rx: 22, class: 'f-machine' }),
          text('/bin/bash', { y: 8, class: 'f-machine-text' }),
        ], { x: 800, y: 290 });
        const out = m.screen('Hello, World!', 520, 440);
        const c = m.crew(typed, './hello.sh', '你把工单夹 <code>hello.sh</code> 递给服务台（Shell）。', { x: 520, y: 190 });
        const end = m.closing('#! ＝ 工单夹的封面', '第一行写明交给谁办，下面一行一件事');
        const moving = [board, cover, step];
        return [c.shot,
          shot('Shell 先看第一行。<code>#!</code> 开头的这一行叫 shebang，写着要交给 <code>/bin/bash</code> 办。', async () => {
            await m.to(c.bot, { x: 400 }, 600, E.inOut);
            await m.to(cover, { o: 1 }, 300);
          }),
          shot('于是整夹交给 <code>/bin/bash</code>。', async () => {
            m.glow(bash, true);
            await Promise.all(moving.map((a) => m.to(a, { x: 520 }, 900, E.inOut)).concat(m.to(c.bot, { x: 240 }, 900, E.inOut)));
          }),
          shot('<code>bash</code> 从上往下一行一行做。<code>#</code> 开头的那行对它来说只是注释，跳过；第二行 <code>echo</code> 印出 <code>Hello, World!</code>。', async () => {
            await m.to(cover, { o: 0 }, 250);
            await m.to(step, { o: 1 }, 300);
            await m.appear(out);
          }, 1500),
          end];
      },
    },

    chmodx: {
      title: 'chmod +x 就是盖上「可执行」的章',
      make(m) {
        const typed = m.terminal();
        const chars = Array.from('-rw-rw-r--');
        const cells = chars.map((ch, i) => m.t(ch, { x: 246 + i * 52, y: 240 }, 'f-big-name'));
        [['拥有者', 2], ['用户组', 5], ['其他人', 8]].forEach(([who, i]) => m.t(who, { x: 246 + i * 52, y: 300 }, 'f-hint'));
        const slots = [3, 6, 9].map((i) => m.g([svg('rect', { x: -24, y: -42, width: 48, height: 58, rx: 12, class: 'f-hl' })], { x: 246 + i * 52, y: 240, o: 0 }));
        const name = m.t('hello.sh', { x: 480, y: 160 }, 'f-label');
        const tips = [m.chip('+ 加上　- 拿掉', 330, 380), m.chip('u 拥有者　g 用户组　o 其他人', 650, 380)];
        const c = m.crew(typed, 'chmod +x hello.sh', '刚用 <code>touch</code> 做出来的 <code>hello.sh</code>，三组权限都没有 <code>x</code>：能读能写，就是不能执行。', { x: 110, y: 400 });
        const end = m.closing('chmod +x ＝ 盖上可执行的章', '加号加、减号拿，没写给谁就是三组');
        const first = { cap: c.shot.cap, play: async () => { await m.appear(name); await m.stagger(slots, (x) => m.to(x, { o: 1 }, 300), 120); } };
        return [first,
          shot('打 <code>chmod +x hello.sh</code>：<code>+</code> 是加上，<code>x</code> 是执行权限。前面没写给谁，就是三组一起加。', async () => {
            await c.shot.play();
            await m.stagger([3, 6, 9], async (i) => { cells[i].node.textContent = 'x'; cells[i].node.classList.add('acc'); await m.to(cells[i], { s: 1.25 }, 160); await m.to(cells[i], { s: 1 }, 320, E.back); }, 220);
          }, 1500),
          shot('想只给自己加，写 <code>chmod u+x</code>；要拿掉，用减号 <code>chmod -x</code>。文件内容完全没变，变的只有这一排开关。', async () => {
            await m.stagger(tips, (x) => m.appear(x), 200);
          }, 1500),
          end];
      },
    },

    shvar: {
      title: '$ 就是照名牌把东西拿出来',
      make(m) {
        const typed = m.terminal();
        const val = m.box('5', { x: 250, y: 320 });
        const tag = m.nametag('PRICE_PER_APPLE', { x: 250, y: 140 });
        const ref = m.chip('$PRICE_PER_APPLE', 700, 250);
        const out = m.screen('Price per apple: 5', 480, 436);
        const end = m.closing('$ ＝ 照名牌拿出来', 'Shell 先把 $名字 换成值，再交给命令');
        return [
          shot('<code>PRICE_PER_APPLE=5</code>：左边是名字，右边是值，<strong>等号两边不能有空格</strong>。Shell 准备好 5，挂上名牌。', async () => {
            await m.type(typed, 'PRICE_PER_APPLE=5');
            await m.appear(val);
            await m.appear(tag);
            await m.to(tag, { y: 236 }, 600, E.back);
          }),
          shot('要用的时候，在名字前面加 <code>$</code>：<code>echo "Price per apple: $PRICE_PER_APPLE"</code>。', async () => {
            await m.retype(typed, 'echo "Price per apple: $PRICE_PER_APPLE"');
            await m.appear(ref);
          }),
          shot('在 <code>echo</code> 看到之前，Shell 先照名牌找到 5，把 <code>$PRICE_PER_APPLE</code> 换掉。<code>echo</code> 拿到的只是一段普通文本。', async () => {
            m.hot(val);
            await m.shake(ref);
            ref.node.querySelector('text').textContent = '5';
            await m.to(ref, { s: 1.2 }, 160);
            await m.to(ref, { s: 1 }, 320, E.back);
          }),
          shot('画面上印出 <code>Price per apple: 5</code>。', async () => { await m.appear(out); }, 1400),
          end];
      },
    },

    shquote: {
      title: '双引号就是整包交出去',
      make(m) {
        const typed = m.terminal();
        const pre = (a) => { a.node.querySelectorAll('text').forEach((t) => { t.style.whiteSpace = 'pre'; }); return a; };
        const val = pre(m.box('Hello        world!', { x: 300, y: 250 }));
        const tag = m.nametag('greeting', { x: 300, y: 100 });
        const out1 = pre(m.screen('Greeting: Hello        world!', 480, 430));
        const pieces = ['Greeting:', 'Hello', 'world!'].map((w, i) => m.chip(w, 560 + i * 140, 250));
        const out2 = m.screen('Greeting: Hello world!', 480, 430);
        const end = m.closing('双引号 ＝ 整包交出去', '不加引号，连续的空格会被压成一个');
        return [
          shot('<code>greeting=\'Hello        world!\'</code>：单引号把两个字连同中间的 8 个空格包成一整包，存进 <code>greeting</code>。', async () => {
            await m.type(typed, "greeting='Hello        world!'");
            await m.appear(val);
            await m.appear(tag);
            await m.to(tag, { y: 166 }, 600, E.back);
          }),
          shot('<code>echo "Greeting: $greeting"</code>：双引号里的 <code>$greeting</code> 换成值后，<strong>整包</strong>交给 <code>echo</code>，空格一个不少。', async () => {
            await m.retype(typed, 'echo "Greeting: $greeting"');
            m.hot(val);
            await m.appear(out1);
          }, 1500),
          shot('如果不加引号：<code>echo Greeting: $greeting</code>。Shell 会把值按空格切开，变成好几块分别交给 <code>echo</code>。', async () => {
            await m.retype(typed, 'echo Greeting: $greeting');
            m.hot(val, false);
            await m.fade(out1);
            await m.stagger(pieces, (x) => m.appear(x), 160);
          }),
          shot('<code>echo</code> 再用<strong>一个</strong>空格把它们接起来。中间多的空格就不见了。', async () => {
            await Promise.all(pieces.map((x, i) => m.to(x, { x: 610 + i * 120 }, 500, E.inOut)));
            await m.appear(out2);
          }, 1500),
          end];
      },
    },

    escape: {
      title: '反斜线就是「下一个字照原样」',
      make(m) {
        const typed = m.terminal();
        const hk = m.chip('\\$HK', 330, 250);
        const price = m.chip('$PRICE_PER_APPLE', 640, 250);
        const val = m.box('5', { x: 640, y: 370 });
        const tag = m.nametag('PRICE_PER_APPLE', { x: 640, y: 286 });
        const out = m.screen('The price of an Apple today is: $HK 5', 480, 436);
        const end = m.closing('\\ ＝ 下一个字照原样', '\\$ 印出 $，反斜线自己不印');
        return [
          shot('想印出港币符号 <code>$HK</code>，可是 <code>$</code> 在双引号里代表「变量开头」。所以前面加一个反斜线：<code>\\$HK</code>。', async () => {
            await m.type(typed, 'echo "The price of an Apple today is: \\$HK $PRICE_PER_APPLE"');
            await m.stagger([hk, price], (x) => m.appear(x), 200);
          }),
          shot('Shell 从左到右看。<code>$PRICE_PER_APPLE</code> 前面没有反斜线，照名牌换成 <code>5</code>。', async () => {
            await Promise.all([m.appear(val), m.appear(tag)]);
            m.hot(val);
            await m.shake(price);
            price.node.querySelector('text').textContent = '5';
          }),
          shot('<code>\\$</code>：反斜线告诉 Shell「下一个字照原样」，所以 <code>$</code> 只是普通的钱号。反斜线完成任务后自己消失，不会印出来。', async () => {
            await m.to(hk, { s: 1.15 }, 200);
            hk.node.querySelector('text').textContent = '$HK';
            await m.to(hk, { s: 1 }, 320, E.back);
          }),
          shot('<code>echo</code> 拿到的是 <code>The price of an Apple today is: $HK 5</code>。', async () => {
            await Promise.all([m.fade(val), m.fade(tag)]);
            await m.appear(out);
          }, 1400),
          end];
      },
    },

    braces: {
      title: '${ } 就是把名字框起来',
      make(m) {
        const typed = m.terminal();
        const val = m.box('ABC', { x: 190, y: 330 });
        const tag = m.nametag('MyFirstLetters', { x: 190, y: 246 });
        const greedy = m.chip('$MyFirstLettersDEFGHIJ', 600, 200);
        const nobody = m.t('没有叫 MyFirstLettersDEFGHIJ 的名牌', { x: 600, y: 260 }, 'f-hint');
        nobody.o = 0;
        m.applyActor(nobody);
        const bad = m.screen('…alphabet are: ', 600, 330, true);
        const framed = m.chip('${MyFirstLetters}', 540, 200);
        const rest = m.chip('DEFGHIJ', 760, 200);
        const joined = m.chip('ABCDEFGHIJ', 650, 200);
        const out = m.screen('The first 10 letters in the alphabet are: ABCDEFGHIJ', 480, 436);
        const end = m.closing('${ } ＝ 把名字框起来', '名字后面紧接着别的字时，一定要框');
        return [
          shot('<code>MyFirstLetters</code> 存的是 <code>ABC</code>。想在后面接上 <code>DEFGHIJ</code>。', async () => {
            await Promise.all([m.appear(val), m.appear(tag)]);
          }),
          shot('（补充）如果直接写 <code>$MyFirstLettersDEFGHIJ</code>：Shell 会把后面的字母全部当成名字，去找一个叫 <code>MyFirstLettersDEFGHIJ</code> 的变量。', async () => {
            await m.type(typed, 'echo "…are: $MyFirstLettersDEFGHIJ"');
            await m.appear(greedy);
            await m.to(nobody, { o: 1 }, 300);
          }),
          shot('找不到就换成空的，不会报错。<code>ABC</code> 和 <code>DEFGHIJ</code> 都不见了。', async () => {
            await m.to(greedy, { o: 0.3 }, 300);
            await m.appear(bad);
          }, 1400),
          shot('写成 <code>${MyFirstLetters}DEFGHIJ</code>：大括号清楚地框出名字到哪里结束，后面的 <code>DEFGHIJ</code> 只是普通文字。', async () => {
            await m.retype(typed, 'echo "…are: ${MyFirstLetters}DEFGHIJ"');
            await Promise.all([m.fade(greedy), m.fade(nobody), m.fade(bad)]);
            await m.stagger([framed, rest], (x) => m.appear(x), 200);
            m.hot(val);
            await m.shake(framed);
            framed.node.querySelector('text').textContent = 'ABC';
          }),
          shot('接起来就是 <code>ABCDEFGHIJ</code>。', async () => {
            await Promise.all([m.to(framed, { x: 650, o: 0 }, 400, E.inOut), m.to(rest, { x: 650, o: 0 }, 400, E.inOut)]);
            await m.appear(joined);
            await m.appear(out);
          }, 1400),
          end];
      },
    },
  });

})();
