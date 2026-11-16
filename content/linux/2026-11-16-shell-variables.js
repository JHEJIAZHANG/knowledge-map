(function () {
  const PROMPT = 'labex:project/ $';
  const OUT = 'Price per apple: 5\nMy first letters: ABC\nGreeting: Hello        world!';
  const LINES = [
    '#!/bin/bash',
    '',
    'PRICE_PER_APPLE=5',
    'MyFirstLetters=ABC',
    "greeting='Hello        world!'",
    '',
    'echo "Price per apple: $PRICE_PER_APPLE"',
    'echo "My first letters: $MyFirstLetters"',
    'echo "Greeting: $greeting"',
  ];
  const SCRIPT = `${LINES.join('\n')}\n`;
  // 编辑器画面：左边是行号
  const editor = (from, to) => LINES.slice(from - 1, to).map((cmd, i) => ({ prompt: String(from + i), cmd }));

  KnowledgeMap.add({
    id: 'shell-variables',
    topic: 'linux',
    group: 'scripts',
    date: '2026-11-16',
    title: 'Shell 变量：存一个值，用 $ 拿出来',
    summary: '在脚本里用「名字=值」创建变量，再用 $名字 把值放进 echo。顺便看引号怎么影响空格。',
    quiz: [
      { q: '哪一行能正确创建变量？', choices: ['PRICE = 5', 'PRICE=5', '$PRICE=5'], answer: 1, why: '等号两边不能有空格，名字前面也不加 `$`。`$` 是「拿出来用」的时候才加。' },
      { q: '要在 `echo` 里印出变量 `greeting` 的值，变量名前面要加什么符号？', answer: ['$', '$greeting'], hint: '一个符号', why: '`$greeting` 会被 Shell 换成 `greeting` 存的值。' },
      { q: "`echo 'Greeting: $greeting'`（单引号）会印出什么？", choices: ['Greeting: Hello        world!', 'Greeting: $greeting', 'Greeting:'], answer: 1, why: '单引号里的东西原样保留，`$` 不会被换成值。要换值得用双引号。' },
      { q: '`echo Greeting: $greeting`（完全不加引号）会印出什么？', choices: ['Greeting: Hello        world!', 'Greeting: Hello world!', 'Greeting: $greeting'], answer: 1, why: '没加引号时，Shell 会把值按空格切开再交给 `echo`，`echo` 用一个空格接回来，多的空格就不见了。' },
      { q: '`MyFirstLetters` 和 `myfirstletters` 是同一个变量吗？', choices: ['是', '不是，大小写不同就是不同的名字'], answer: 1, why: '变量名会区分大小写。打错大小写不会报错，只会拿到空的值。' },
    ],
    sections: [
      {
        nav: '题目',
        kicker: '这一节的任务',
        title: '写一个定义变量的脚本',
        lead: '和上一篇一样：建文件、在编辑器写内容、加执行权限、运行。这次脚本里多了变量。',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'touch /home/labex/project/variables.sh' },
              { cmd: 'chmod +x /home/labex/project/variables.sh' },
              { cmd: './variables.sh', out: OUT },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '和上一篇的差别',
            text: [
              '这次 `touch` 和 `chmod` 用的是**绝对路径** `/home/labex/project/variables.sh`，在哪个目录打都一样。',
              '运行时用的是 `./variables.sh`，所以要先站在 `project` 目录里。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '这一篇只有题目文字',
            text: '你这次贴的是 LabEx 的题目说明，没有实际操作的记录。上面的输出是题目写的「应该会看到」，不是你画面上的结果。',
          },
        ],
      },
      {
        nav: '创建',
        kicker: '创建变量',
        title: '名字=值',
        lead: '用等号把值存进一个名字。**等号两边不能有空格**，这是 Shell 和大部分程序语言最不一样的地方。',
        blocks: [
          { type: 'movie', film: 'shvar' },
          {
            type: 'terminal',
            span: 6,
            prompt: '1',
            lines: editor(1, 5),
          },
          {
            type: 'terms',
            span: 6,
            title: '三个变量',
            items: [
              ['`PRICE_PER_APPLE=5`', '存一个数字。'],
              ['`MyFirstLetters=ABC`', '存一段文本。值里没有空格，可以不加引号。'],
              ["`greeting='Hello        world!'`", '值里有空格，一定要用引号包起来。'],
            ],
          },
          {
            type: 'extra',
            title: 'Shell 变量其实都是文本',
            text: [
              '题目说 `PRICE_PER_APPLE` 是「整数变量」，`MyFirstLetters` 是「字符串变量」。这样理解没问题，但严格说，Shell 变量存的都是文本：`5` 就是一个字「5」。',
              '要拿来算数学时，才会用专门的写法（之后会学到）把它当数字看。',
            ],
          },
          {
            type: 'extra',
            title: '变量名的规则',
            text: [
              '可以用英文字母、数字、底线，不能用数字开头。',
              '大小写不同就是不同的名字。',
              '习惯上：全大写加底线（像 `PRICE_PER_APPLE`）多用在设置值；小写多用在一般变量。题目里的 `MyFirstLetters` 只是示范，两种都可以。',
            ],
          },
          {
            type: 'analogy',
            title: '和 Python 的变量很像',
            text: '前一篇 Python 的 `x = 42`，在 Shell 里写成 `x=42`：一样是把名牌挂到值上，只是 Shell 的等号两边不能留空格。',
          },
        ],
      },
      {
        nav: '使用',
        kicker: '使用变量',
        title: '$名字：把值拿出来',
        lead: '名字前面加 `$`，Shell 就会在运行命令之前，把它换成变量存的值。',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: '7',
            lines: editor(7, 9),
          },
          {
            type: 'text',
            span: 5,
            title: '换的人是 Shell',
            text: [
              '`echo` 根本不知道有变量这回事。',
              'Shell 先把 `$PRICE_PER_APPLE` 换成 `5`，`echo` 拿到的是 `Price per apple: 5` 这一段普通文本。',
            ],
          },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [{ cmd: './variables.sh', out: OUT }],
          },
        ],
      },
      {
        nav: '引号',
        kicker: '引号与空格',
        title: '为什么 8 个空格都还在',
        lead: '`greeting` 的值中间有 8 个空格。印出来时一个都没少，是因为 `echo` 那一行用了**双引号**。',
        blocks: [
          { type: 'movie', film: 'shquote' },
          {
            type: 'terms',
            title: '三种写法，结果不一样',
            items: [
              ['`echo "Greeting: $greeting"`', '双引号：`$greeting` 换成值，空格原样保留。印出 `Greeting: Hello        world!`。'],
              ["`echo 'Greeting: $greeting'`", '单引号：什么都不换。印出 `Greeting: $greeting`。'],
              ['`echo Greeting: $greeting`', '不加引号：值被按空格切开，再用一个空格接回来。印出 `Greeting: Hello world!`。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '补充：题目最后一句的说法',
            text: [
              '题目说：「当使用单引号定义变量且在 echo 语句中不加引号时，空格得到了保留。」但脚本里的 `echo "Greeting: $greeting"` 其实**有**加双引号。',
              '空格能保留，靠的是两件事：定义时用单引号把空格包进值里，以及使用时用双引号把值整包交给 `echo`。少了后者，空格就会被压成一个。',
            ],
          },
        ],
      },
      {
        nav: '总结',
        kicker: '总结',
        title: '整段操作重看一次',
        lead: '右边是 `project` 目录。脚本运行完，变量就跟着消失，不会留在你的终端机里。',
        blocks: [
          {
            type: 'run',
            title: '从空文件到印出三行',
            root: '/home/labex/project',
            cwd: '/home/labex/project',
            perms: true,
            tree: {},
            commands: [
              { cmd: 'touch /home/labex/project/variables.sh', note: '用绝对路径做出空文件。' },
              { edit: { file: 'variables.sh', content: SCRIPT }, note: '在编辑器写进 shebang、三个变量和三行 `echo`，存档。' },
              { cmd: 'chmod +x /home/labex/project/variables.sh', note: '加上执行权限，变成 `-rwxrwxr-x`。' },
              { cmd: './variables.sh', out: OUT, note: '每个 `$变量` 先换成值，再交给 `echo`。双引号让 8 个空格都留着。' },
            ],
          },
          {
            type: 'recap',
            items: [
              '`名字=值` 创建变量，等号两边不能有空格。',
              '值里有空格，要用引号包起来。',
              '`$名字` 把值拿出来；换值的是 Shell，不是 `echo`。',
              '双引号会换值、保留空格；单引号什么都不换；不加引号会把多的空格压掉。',
              '变量名会区分大小写。',
            ],
          },
        ],
      },
    ],
  });
})();
