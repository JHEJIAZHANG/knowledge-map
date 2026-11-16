(function () {
  const SHELL = 'labex:project/ $';
  const PY = '>>>';
  const BANNER = 'Python 3.10.12 (main, Mar 22 2024, 16:50:05) [GCC 11.4.0] on linux\nType "help", "copyright", "credits" or "license" for more information.';

  KnowledgeMap.add({
    id: 'python-repl',
    topic: 'python',
    group: 'py-basics',
    date: '2026-11-16',
    title: '第一次用 Python：交互模式、变量、print 和 input',
    summary: '打 python 进入交互模式，拿它当计算机，用变量记住值，用 print 印出来，用 input 问问题，再用 int() 把文本换成数字。',
    quiz: [
      { q: '在 Shell 打 `python` 之后，提示字符会变成什么？', choices: ['$', '>>>', '#'], answer: 1, why: '看到 `>>>` 就代表进了 Python 交互模式，接下来打的要是 Python 代码，不是 Shell 命令。' },
      { q: '`(10 * 5) + (20 / 4)` 的结果为什么是 `55.0`，而不是 `55`？', choices: ['括号让结果变成小数', '`/` 除法的结果一定是小数（float）', 'Python 算错了'], answer: 1, why: '在 Python 3 里，`/` 不管能不能整除都会得到小数。`20 / 4` 是 `5.0`，加上 `50` 就是 `55.0`。' },
      { q: '依序运行 `x = 100`、`y = x`、`x = 42` 之后，`y` 是多少？', choices: ['42', '100', '会出错'], answer: 1, why: '`y = x` 是把名牌 `y` 挂在 `x` 当时挂着的 100 上。之后 `x` 改挂到 42，`y` 不受影响，还是 100。' },
      { q: '`name = "Alice"` 之后，直接打 `name` 和打 `print(name)`，画面上差在哪里？', choices: ['完全一样', '直接打 `name` 会显示引号：`\'Alice\'`；`print` 不会', '`print(name)` 会显示引号'], answer: 1, why: '直接打名字，交互模式会显示「这个值长什么样」，文本带引号。`print` 是把内容念出来，不念引号。' },
      { q: '`age_str` 是用 `input()` 拿到的 `\'25\'`。要把它换成整数，要怎么写？', answer: ['int(age_str)', 'age = int(age_str)', 'age=int(age_str)'], hint: '用一个内置函数', why: '`input()` 交回来的一定是文本。`int()` 会把只有数字的文本换成整数，才能拿来加减。' },
      { q: '要离开 Python 交互模式、回到 Shell，要打什么？', answer: ['exit()', 'quit()'], why: '`exit()` 的括号不能省。只打 `exit`，Python 会告诉你要用 `exit()`。' },
    ],
    sections: [
      {
        nav: '进入',
        kicker: '交互模式',
        title: '打 python，进入交互模式',
        lead: '在 Shell 打 `python`，会进入 Python 的「交互模式」：你打一行，它马上运行一行，再把结果显示出来。',
        blocks: [
          { type: 'movie', film: 'python' },
          {
            type: 'terminal',
            span: 12,
            prompt: SHELL,
            lines: [{ cmd: 'python', out: BANNER }],
          },
          {
            type: 'terms',
            title: '进来时印出的两行',
            items: [
              ['`Python 3.10.12`', 'Python 的版本。`3` 是大版本，现在学的都是 Python 3。'],
              ['`(main, Mar 22 2024, 16:50:05)`', '这个 Python 是从哪个分支、什么时候编译出来的。平常不用管。'],
              ['`[GCC 11.4.0] on linux`', '用 GCC 这个编译器做出来，跑在 Linux 上。'],
              ['`Type "help", …`', '提示你可以打 `help()` 等命令查说明。'],
              ['`>>>`', '提示字符。看到它，代表 Python 在等你打下一行。'],
            ],
          },
          {
            type: 'analogy',
            title: '像换了一位柜员',
            text: '原本的服务台（Shell）听得懂 `ls`、`cd`。打 `python` 之后，你面前换成一位只听得懂 Python 的柜员。在这里打 `ls` 是没用的，它听不懂。',
          },
          {
            type: 'extra',
            title: '交互模式和 .py 文件',
            text: [
              '交互模式适合试试看、算东西：打一行马上看到结果。缺点是离开之后什么都不会留下。',
              '之后要写比较长的程序，会把代码存成 `.py` 文件，再用 `python 文件名.py` 一次运行整个文件。',
            ],
          },
        ],
      },
      {
        nav: '计算',
        kicker: '当计算机用',
        title: '先把 Python 当成计算机',
        lead: '在 `>>>` 后面打算式，按 Enter，结果就显示在下一行。',
        blocks: [
          {
            type: 'terminal',
            span: 6,
            prompt: PY,
            lines: [
              { cmd: '2 + 3', out: '5' },
              { cmd: '(10 * 5) + (20 / 4)', out: '55.0' },
            ],
          },
          {
            type: 'text',
            span: 6,
            title: '为什么是 55.0？',
            text: [
              '`10 * 5` 是 `50`，`20 / 4` 是 `5.0`。',
              '在 Python 3 里，`/` 除法的结果**一定是小数**（float），就算刚好整除也一样。整数加小数，结果也是小数，所以是 `55.0`。',
            ],
          },
          {
            type: 'terms',
            title: '算术符号',
            items: [
              ['`+` `-`', '加、减。'],
              ['`*`', '乘。键盘上没有 ×，用星号代替。'],
              ['`/`', '除。结果一定是小数。'],
              ['`//`（补充）', '整除：只留商的整数部分。`20 // 4` 是 `5`，`7 // 2` 是 `3`。'],
              ['`%`（补充）', '余数：`7 % 2` 是 `1`。'],
              ['`( )`', '先算括号里面的。和数学一样，没有括号时也是先乘除后加减。'],
            ],
          },
        ],
      },
      {
        nav: '变量',
        kicker: '变量',
        title: '用变量记住一个值',
        lead: '`x = 42` 的意思是：把名字 `x` 挂在 42 上。之后打 `x`，就会拿到 42。',
        blocks: [
          { type: 'movie', film: 'pyvar' },
          {
            type: 'terminal',
            span: 6,
            prompt: PY,
            lines: [
              { cmd: 'x = 42' },
              { cmd: 'x', out: '42' },
              { cmd: 'x = 100' },
              { cmd: 'x', out: '100' },
              { cmd: 'y = x' },
              { cmd: 'y', out: '100' },
              { cmd: 'name = "Alice"' },
              { cmd: 'name', out: "'Alice'" },
            ],
          },
          {
            type: 'text',
            span: 6,
            title: '一行一行看',
            text: [
              '`x = 42` 没有任何输出。它只是把值存起来，不会显示。',
              '直接打名字 `x`，交互模式就显示它挂着的值。',
              '`x = 100` 把 `x` 改挂到 100。旧的 42 就拿不到了。',
              '`y = x` 让 `y` 也挂在 `x` 当时挂着的 100 上。',
              '文本要用引号包起来。直接打 `name` 时，显示的 `\'Alice\'` 也带着引号，告诉你这是一段文本。',
            ],
          },
          {
            type: 'analogy',
            title: '变量是名牌，不是盒子',
            text: '值是一个盒子，变量是绑在盒子上的名牌。`=` 不是数学的「等于」，而是「把左边的名牌挂到右边的盒子上」。一个盒子可以挂好几个名牌。',
          },
          {
            type: 'extra',
            title: '变量名的规则',
            text: [
              '可以用英文字母、数字和底线 `_`，但不能用数字开头：`age_str` 可以，`2x` 不行。',
              '大小写不同就是不同的名字：`name` 和 `Name` 是两个变量。',
              '习惯上用小写字母，单字之间用底线隔开，例如 `age_str`。',
            ],
          },
        ],
      },
      {
        nav: 'print',
        kicker: '输出',
        title: 'print：把东西印在画面上',
        lead: '`print()` 会把括号里的东西印出来。文本不印引号；用逗号隔开好几样东西，中间会自动补一个空格。',
        blocks: [
          { type: 'movie', film: 'pyprint' },
          {
            type: 'terminal',
            span: 6,
            prompt: PY,
            lines: [
              { cmd: 'print("Hello, LabEx!")', out: 'Hello, LabEx!' },
              { cmd: 'x = 42' },
              { cmd: 'print(x)', out: '42' },
              { cmd: 'name = "Alice"' },
              { cmd: 'print("My name is", name)', out: 'My name is Alice' },
            ],
          },
          {
            type: 'text',
            span: 6,
            title: '三个重点',
            text: [
              '`"Hello, LabEx!"` 有引号，是文本，原样印出来（不含引号）。',
              '`x` 和 `name` 没有引号，是变量，Python 会先换成它们挂着的值再印。',
              '`"My name is"` 后面没有空格，印出来却有，是逗号让 `print` 自动补上的。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '直接打名字，和用 print 印，有什么不同',
            text: [
              '在交互模式里，直接打 `name` 会显示 `\'Alice\'`（带引号），`print(name)` 会显示 `Alice`（不带引号）。',
              '而且「直接打名字就显示」只在交互模式有用。写成 `.py` 文件运行时，只有 `print` 印的东西才会出现在画面上。',
            ],
          },
        ],
      },
      {
        nav: 'input',
        kicker: '输入',
        title: 'input：问一个问题，等你回答',
        lead: '`input()` 会先印出括号里的问题，然后停下来等你打字。按下 Enter，你打的内容就会交回来，可以用变量接住。',
        blocks: [
          { type: 'movie', film: 'pyinput' },
          {
            type: 'terminal',
            span: 6,
            prompt: PY,
            lines: [
              { cmd: 'name = input("What is your name? ")', out: 'What is your name? Alice' },
              { cmd: 'print("Hello,", name)', out: 'Hello, Alice' },
            ],
          },
          {
            type: 'text',
            span: 6,
            title: '发生了什么',
            text: [
              '第一行印出 `What is your name? `，然后等你。`Alice` 是你自己打的，不是 Python 印的。',
              '按下 Enter，`Alice` 交回来，挂上名牌 `name`。',
              '第二行用 `print` 打招呼，逗号又补了一个空格。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '问题后面为什么要留一个空格',
            text: '`"What is your name? "` 的问号后面有一个空格。少了它，你打的字会紧贴着问号：`What is your name?Alice`。这个空格只是为了好看。',
          },
        ],
      },
      {
        nav: '转换',
        kicker: '类型转换',
        title: 'int()：把文本换成数字',
        lead: '`input()` 交回来的**一定是文本**。想拿来加减，要先用 `int()` 换成整数。',
        blocks: [
          { type: 'movie', film: 'pyint' },
          {
            type: 'terminal',
            span: 7,
            prompt: PY,
            lines: [
              { cmd: 'age_str = input("How old are you? ")', out: 'How old are you? 25' },
              { cmd: 'age = int(age_str)' },
              { cmd: 'print("Next year, you will be", age + 1)', out: 'Next year, you will be 26' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '为什么要多一步',
            text: [
              '你打的 `25` 交回来是文本 `\'25\'`，只是「2」和「5」两个字。',
              '`int(age_str)` 把它换成整数 `25`，存进 `age`。',
              '`age + 1` 才能算出 `26`。',
            ],
          },
          {
            type: 'terms',
            title: '目前见过的三种类型',
            items: [
              ['`int`', '整数，例如 `42`、`25`。'],
              ['`float`', '小数，例如 `55.0`。`/` 除出来的都是这种。'],
              ['`str`', '文本（string），用引号包起来，例如 `"Alice"`。`input()` 交回来的都是这种。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '变量名里的 _str',
            text: '`age_str` 这个名字是在提醒自己：这里面装的还是文本。换成数字之后存进 `age`。用名字标出类型，是避免搞混的小习惯。',
          },
        ],
      },
      {
        nav: '离开',
        kicker: '离开',
        title: 'exit()：回到 Shell',
        lead: '打 `exit()` 离开交互模式，提示字符变回 `labex:project/ $`。',
        blocks: [
          {
            type: 'terminal',
            span: 6,
            prompt: PY,
            lines: [{ cmd: 'exit()' }],
          },
          {
            type: 'text',
            span: 6,
            title: '离开之后',
            text: [
              '`exit()` 的括号不能省。',
              '刚刚定义的 `x`、`name`、`age` 全部会消失。下次再打 `python`，又是从空的开始。',
            ],
          },
        ],
      },
      {
        nav: '总结',
        kicker: '总结',
        title: '整段操作重看一次',
        lead: '右边是 Python「记住的名字」：每个名字现在挂着什么值，一步一步看它怎么变。',
        blocks: [
          {
            type: 'run',
            title: '从进入到离开 Python',
            root: '/home/labex/project',
            cwd: '/home/labex/project',
            tree: {},
            startInfo: {
              title: '还在 Shell 里',
              icon: 'terminal',
              rows: [['提示字符', 'labex:project/ $', '服务台在等你打命令'], ['下一步', '!python', '进入 Python 交互模式']],
            },
            commands: [
              { cmd: 'python', out: BANNER, note: '进入交互模式。印出版本号，提示字符变成 `>>>`。' },
              { cmd: '2 + 3', out: '5', note: '算式直接显示结果，但没有存起来，名字表还是空的。' },
              { cmd: '(10 * 5) + (20 / 4)', out: '55.0', note: '`/` 的结果一定是小数，所以整个算式是 `55.0`。' },
              { cmd: 'x = 42', note: '把名牌 `x` 挂在 42 上。这一行没有任何输出。' },
              { cmd: 'x', out: '42', note: '打名字，就显示它挂着的值。' },
              { cmd: 'x = 100', note: '`x` 改挂到 100。' },
              { cmd: 'x', out: '100' },
              { cmd: 'y = x', note: '`y` 也挂在同一个 100 上，不是复制一份。' },
              { cmd: 'y', out: '100' },
              { cmd: 'name = "Alice"', note: '文本要用引号包起来。' },
              { cmd: 'name', out: "'Alice'", note: '直接显示文本时会带引号。' },
              { cmd: 'print("Hello, LabEx!")', out: 'Hello, LabEx!', note: '`print` 印出来的文本不带引号。' },
              { cmd: 'x = 42', note: '`x` 又改挂回 42。注意 `y` 还是 100，不会跟着变。' },
              { cmd: 'print(x)', out: '42' },
              { cmd: 'name = "Alice"', note: '又存了一次同样的文本，名字表看起来一样。' },
              { cmd: 'print("My name is", name)', out: 'My name is Alice', note: '逗号隔开的两样东西，中间自动补一个空格。' },
              { cmd: 'name = input("What is your name? ")', out: 'What is your name? Alice', note: '印出问题，等你打 `Alice` 按 Enter，再把它挂上 `name`。' },
              { cmd: 'print("Hello,", name)', out: 'Hello, Alice' },
              { cmd: 'age_str = input("How old are you? ")', out: 'How old are you? 25', note: '你打的 `25` 交回来是文本 `\'25\'`。' },
              { cmd: 'age = int(age_str)', note: '`int()` 换成整数 25，存进 `age`。`age_str` 还在。' },
              { cmd: 'print("Next year, you will be", age + 1)', out: 'Next year, you will be 26', note: '`age + 1` 只是拿来算，`age` 本身还是 25。' },
              { cmd: 'exit()', note: '离开 Python 回到 Shell，名字表全部清空。' },
            ],
          },
          {
            type: 'recap',
            items: [
              '`python` 进入交互模式，提示字符变成 `>>>`；`exit()` 离开。',
              '交互模式会直接显示算式的结果。`/` 的结果一定是小数。',
              '`变量 = 值`：右边先算好，再把左边的名字挂上去。',
              '`print()` 印出内容：文本不印引号，逗号会变成一个空格。',
              '`input()` 印出问题、等你回答，交回来的一定是文本。',
              '文本要先用 `int()` 换成整数，才能拿来加减。',
            ],
          },
        ],
      },
    ],
  });
})();
