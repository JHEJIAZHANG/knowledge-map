/* Python 文章的补充内容。格式说明见 content/topics.js。
 * 这个文件里的东西都不在原始笔记里，页面上会标成「补充」。
 * 错误消息照 LabEx 的 Python 3.10.12 写。
 */
(function () {
  const KM = window.KnowledgeMap;
  const TB = 'Traceback (most recent call last):\n  File "<stdin>", line 1, in <module>\n';
  const alt = (rows, title) => ({ type: 'alt', title, rows });

  KM.deepen('python-repl', {
    story: {
      title: '帮饮料店算一笔账',
      lead: '朋友的饮料店要你帮忙算钱。你手边只有一台 Linux 服务器，没有计算机。',
      steps: [
        { say: '先进入 Python 交互模式。', cmd: 'python', note: '提示字符变成 `>>>`，接下来打的都是 Python。' },
        { py: true, say: '三杯 45 元的奶茶，加一杯 60 元的果汁，一共多少？', cmd: '3 * 45 + 60', note: '显示 `195`。先乘后加，不用括号。' },
        { py: true, say: '这个数字等一下还要用，挂个名牌存起来。', cmd: 'total = 3 * 45 + 60', note: '没有输出，但 `total` 已经记住 195 了。' },
        { py: true, say: '客人付了 200 元，要找多少？', cmd: '200 - total', note: '显示 `5`。' },
        { py: true, say: '改成会问人的版本：让店员自己输入客人付了多少。', cmd: 'paid = int(input("付多少钱？ "))', note: '`input()` 交回来是文本，所以外面直接包一层 `int()`。' },
        { py: true, say: '把找零印出来给店员看。', cmd: 'print("找零", paid - total)', note: '逗号会自动补一个空格。' },
        { py: true, say: '做完了，回到 Shell。', cmd: 'exit()', note: '`total` 和 `paid` 跟着消失。要留下来，之后得写成 `.py` 文件。' },
      ],
    },
    poster: {
      title: '交互模式里的五个动作',
      lanes: [
        { name: '进出', flow: true, nodes: [
          { cmd: 'python', does: '进入，提示字符变成 `>>>`' },
          { cmd: 'exit()', does: '离开，名字全部清掉' },
        ] },
        { name: '记住', flow: true, nodes: [
          { cmd: 'x = 42', does: '右边先算好，再挂上名牌' },
          { cmd: 'x', does: '显示名牌挂着的值' },
        ] },
        { name: '问与答', flow: true, nodes: [
          { cmd: 'input("问题")', does: '印出问题，等你回答，交回文本' },
          { cmd: 'int(…)', does: '文本换成整数' },
          { cmd: 'print(…)', does: '印出来，逗号变空格' },
        ] },
      ],
      line: '打一行跑一行；值要挂上名牌才留得住，离开就全部清掉。',
    },
    at: {
      进入: [
        {
          type: 'oops', py: true, title: '在 >>> 后面打 Shell 命令',
          wrong: 'ls',
          out: `${TB}NameError: name 'ls' is not defined`,
          why: '进了 Python 之后，面前的柜员只听得懂 Python。对它来说，`ls` 只是一个没定义过的名字，所以报 `NameError`。',
          rightLabel: '先离开 Python，再打 Shell 命令', right: 'exit()',
          fix: '先看提示字符：`>>>` 是 Python，`$` 才是 Shell。',
        },
        {
          type: 'behind', title: '打 python 时，后面发生了什么',
          cmd: 'python',
          places: [
            { where: 'Shell（zsh）', what: '把画面交给 Python，自己在后面等', rows: ['提示字符 labex:project/ $', ['edit', '暂停，等 python 结束']] },
            { where: 'Python', what: '启动，准备一张空的名字表', rows: [['add', '印出版本号'], ['add', '名字表：（空的）'], ['add', '提示字符 >>>']] },
          ],
          note: '`exit()` 时 Python 结束，名字表整张丢掉，Shell 接回画面。所以变量不会留到下一次。',
        },
      ],
      计算: [
        alt([
          { from: '(10 * 5) + (20 / 4)', to: [
            ['10 * 5 + 20 / 4', '先乘除后加减，括号可以省，结果一样是 `55.0`'],
            ['10 * 5 + 20 // 4', '`//` 是整除，结果是整数 `55`'],
          ] },
        ]),
      ],
      变量: [
        {
          type: 'behind', py: true, title: '`y = x` 没有复制任何东西',
          cmd: 'y = x',
          places: [
            { where: '名字表', what: '多一个名字', rows: ['x → 100', ['add', 'y → 100（和 x 挂在同一个值上）']] },
            { where: '值', what: '还是只有一个 100', rows: ['100'] },
          ],
          note: '之后打 `x = 42`，只有 `x` 的名牌移走，`y` 还挂在 100 上。总结里的动画演示第 13 步可以看到。',
        },
      ],
      print: [
        {
          type: 'oops', py: true, title: '少了结尾的引号',
          wrong: 'print("Hello, LabEx!)',
          out: '  File "<stdin>", line 1\n    print("Hello, LabEx!)\n          ^\nSyntaxError: unterminated string literal (detected at line 1)',
          why: '文本从 `"` 开始，Python 一直找不到结尾的 `"`，不知道文本到哪里结束。`^` 指着文本开头的位置。',
          right: 'print("Hello, LabEx!")',
          fix: '引号要成对。看到 `unterminated string`，就去找少了哪一个引号。',
        },
        {
          type: 'oops', py: true, title: '开头打成大写',
          wrong: 'Print("Hello, LabEx!")',
          out: `${TB}NameError: name 'Print' is not defined. Did you mean: 'print'?`,
          why: 'Python 会区分大小写，`Print` 和 `print` 是两个名字。Python 3.10 还会猜你想打的是哪一个。',
          right: 'print("Hello, LabEx!")',
        },
        alt([
          { from: 'print("My name is", name)', to: [
            ['print(f"My name is {name}")', 'f 字符串：引号前加 `f`，大括号里放变量'],
            ['print("My name is " + name)', '用 `+` 把文本接起来；空格要自己加在引号里'],
          ] },
        ]),
      ],
      input: [
        {
          type: 'behind', py: true, title: 'input() 一行做了三件事',
          cmd: 'name = input("What is your name? ")',
          places: [
            { where: '画面', what: '印出问题', rows: [['add', 'What is your name? ']] },
            { where: '键盘', what: '停下来等你', rows: [['read', 'Alice'], ['read', 'Enter']] },
            { where: '名字表', what: '把你打的字挂上名牌', rows: [['add', "name → 'Alice'（str 文本）"]] },
          ],
          note: '在你按 Enter 之前，Python 什么都不做。交回来的一定是文本。',
        },
        alt([
          { from: 'print("Hello,", name)', to: [['print(f"Hello, {name}")', 'f 字符串的写法']] },
        ]),
      ],
      转换: [
        {
          type: 'oops', py: true, title: '忘了换成数字就拿来算',
          wrong: 'age_str + 1',
          out: `${TB}TypeError: can only concatenate str (not "int") to str`,
          why: '`age_str` 是文本 `\'25\'`。文本的 `+` 是「接起来」，不能和数字 `1` 接，所以报 `TypeError`。',
          right: 'int(age_str) + 1',
          fix: '`input()` 拿到的值要算之前，先用 `int()` 换成整数。',
        },
        {
          type: 'oops', py: true, title: '输入的不是纯数字',
          wrong: 'int("twenty-five")',
          out: `${TB}ValueError: invalid literal for int() with base 10: 'twenty-five'`,
          why: '`int()` 只认得纯数字的文本。如果用户在 `input()` 打了英文字或「25岁」，换算就会失败。',
          right: 'int("25")',
          fix: '之后学到 `try` / `except`，就能在换算失败时请用户重新输入。',
        },
        alt([
          { from: 'age = int(age_str)', to: [['age = int(input("How old are you? "))', '问完马上换成整数，少一个变量']] },
          { from: 'print("Next year, you will be", age + 1)', to: [['print(f"Next year, you will be {age + 1}")', '大括号里也可以放算式']] },
        ]),
      ],
      离开: [
        {
          type: 'oops', py: true, title: '只打 exit，没加括号',
          wrong: 'exit',
          out: 'Use exit() or Ctrl-D (i.e. EOF) to exit',
          why: '`exit` 后面没有括号，只是「提到」这个函数，没有「叫它做事」。Python 3.10 会提醒你正确的打法，但不会离开。',
          right: 'exit()',
          fix: '名字后面加 `()` 才是真的运行它。`print()`、`input()` 也是一样。',
        },
        alt([
          { from: 'exit()', to: [['quit()', '效果一样'], ['Ctrl + D', '按键：同时按 Ctrl 和 D，也会离开']] },
        ]),
      ],
    },
  });
})();
