(function () {
  const PROMPT = 'labex:project/ $';
  const OLD = [
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
  const LINES = [
    '#!/bin/bash',
    '',
    'PRICE_PER_APPLE=5',
    'MyFirstLetters=ABC',
    "greeting='Hello        world!'",
    '',
    '# 转义特殊字符',
    'echo "The price of an Apple today is: \\$HK $PRICE_PER_APPLE"',
    '',
    '# 避免歧义',
    'echo "The first 10 letters in the alphabet are: ${MyFirstLetters}DEFGHIJ"',
    '',
    '# 保留空白字符',
    'echo $greeting',
    'echo "$greeting"',
  ];
  const OUT = 'The price of an Apple today is: $HK 5\nThe first 10 letters in the alphabet are: ABCDEFGHIJ\nHello world!\nHello        world!';
  const editor = (from, to) => LINES.slice(from - 1, to).map((cmd, i) => ({ prompt: String(from + i), cmd }));

  KnowledgeMap.add({
    id: 'quoting-variables',
    topic: 'linux',
    group: 'scripts',
    date: '2026-11-16',
    title: '引用变量：\\$、${ } 和双引号',
    summary: '三种要特别处理的情况：想印出 $ 本身、变量名后面紧接着别的字、变量值里有好几个空格。',
    quiz: [
      { q: '想在双引号里印出 `$` 符号本身，不被当成变量，要在 `$` 前面加什么？', answer: ['\\', '\\$'], hint: '一个符号', why: '反斜线 `\\` 是转义：让下一个字照原样，不做特殊处理。反斜线自己不会印出来。' },
      { q: '`MyFirstLetters=ABC`。要印出 `ABCDEFGHIJ`，哪一种写法正确？', choices: ['echo "$MyFirstLettersDEFGHIJ"', 'echo "${MyFirstLetters}DEFGHIJ"', 'echo "$MyFirstLetters DEFGHIJ"'], answer: 1, why: '第一种会去找一个叫 `MyFirstLettersDEFGHIJ` 的变量，找不到就是空的；第三种中间会多一个空格。' },
      { q: '`greeting=\'Hello        world!\'`，`echo $greeting`（不加引号）会印出什么？', choices: ['Hello        world!', 'Hello world!', '$greeting'], answer: 1, why: '不加引号时，Shell 把值按空格切开，`echo` 再用一个空格接起来。' },
      { q: '要原样印出 `greeting` 里的 8 个空格，要怎么写？', answer: ['echo "$greeting"', 'echo "${greeting}"'], why: '用双引号把变量包起来，值会整包交给 `echo`。' },
      { q: '在脚本里，`#` 开头的那一行是什么？', choices: ['会被印出来的标题', '注释：给人看的说明，bash 会跳过', '错误'], answer: 1, why: '`#` 后面到行尾都是注释。第一行的 `#!` 是特例，叫 shebang。' },
    ],
    sections: [
      {
        nav: '题目',
        kicker: '这一节的任务',
        title: '改写 variables.sh',
        lead: '沿用上一篇的 `variables.sh`，把内容换成新的版本。变量一样，`echo` 的写法变了。',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: '1',
            lines: editor(1, 15),
          },
          {
            type: 'text',
            span: 5,
            title: '多了三段 # 开头的行',
            text: [
              '`#` 开头的行是**注释**：写给人看的说明，bash 会直接跳过。',
              '题目用注释把脚本分成三段，每一段示范一种情况。',
              '文件已经在上一篇加过 `x` 权限，改内容不会影响权限，所以这次不用再 `chmod`。',
            ],
          },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [{ cmd: './variables.sh', out: OUT }],
          },
          {
            type: 'extra',
            span: 12,
            title: '这一篇只有题目文字',
            text: '你这次贴的是 LabEx 的题目说明，没有实际操作的记录。上面的输出是题目写的「应该会看到」。',
          },
        ],
      },
      {
        nav: '转义',
        kicker: '情况一',
        title: '\\$：把 $ 当普通字符印出来',
        lead: '在双引号里，`$` 代表「变量从这里开始」。想印出钱号本身，就在前面加反斜线 `\\`。',
        blocks: [
          { type: 'movie', film: 'escape' },
          {
            type: 'terminal',
            span: 7,
            prompt: '8',
            lines: editor(8, 8),
          },
          {
            type: 'text',
            span: 5,
            title: 'Shell 怎么读这一行',
            text: [
              '`\\$HK`：反斜线让 `$` 变成普通字符，印出 `$HK`。反斜线本身不印。',
              '`$PRICE_PER_APPLE`：前面没有反斜线，换成 `5`。',
              '结果：`The price of an Apple today is: $HK 5`。',
            ],
          },
          {
            type: 'terms',
            title: '在双引号里有特殊意思、需要转义的字',
            items: [
              ['`\\$`', '印出 `$`。'],
              ['`\\"`', '印出双引号本身，不会结束这段文字。'],
              ['`\\\\`', '印出一个反斜线。'],
            ],
          },
        ],
      },
      {
        nav: '大括号',
        kicker: '情况二',
        title: '${名字}：框出变量名到哪里结束',
        lead: 'Shell 读变量名时，会一直读到「不能当名字的字」为止。名字后面紧接着字母，就要用大括号框起来。',
        blocks: [
          { type: 'movie', film: 'braces' },
          {
            type: 'terminal',
            span: 7,
            prompt: '11',
            lines: editor(11, 11),
          },
          {
            type: 'text',
            span: 5,
            title: '为什么一定要框',
            text: [
              '变量名可以有字母、数字、底线。`DEFGHIJ` 也是字母，所以 Shell 分不出名字在哪里结束。',
              '写成 `${MyFirstLetters}`，名字就只到右大括号为止，`DEFGHIJ` 是接在后面的普通文字。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '什么时候不用框',
            text: '名字后面接的是空格、标点或中文这类不能当名字的字，就不会混淆，例如 `"$PRICE_PER_APPLE 元"`。不确定的时候，一律写 `${名字}` 也完全没问题。',
          },
        ],
      },
      {
        nav: '空白',
        kicker: '情况三',
        title: '$greeting 和 "$greeting" 不一样',
        lead: '变量值里有好几个连续空格时，有没有用双引号包起来，印出来的结果不一样。',
        blocks: [
          { type: 'movie', film: 'shquote' },
          {
            type: 'terminal',
            span: 6,
            prompt: '14',
            lines: editor(14, 15),
          },
          {
            type: 'terms',
            span: 6,
            title: '两行的结果',
            items: [
              ['`echo $greeting`', '`Hello world!`：值被按空格切成两块，`echo` 用一个空格接回来。'],
              ['`echo "$greeting"`', '`Hello        world!`：值整包交给 `echo`，8 个空格都在。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '上一篇的「Greeting」也是这个道理',
            text: '上一篇的 `echo "Greeting: $greeting"` 能保留空格，靠的就是那对双引号。用到变量时，养成包一层双引号的习惯，就不会被这个问题咬到。',
          },
        ],
      },
      {
        nav: '总结',
        kicker: '总结',
        title: '整段操作重看一次',
        lead: '右边是 `project` 目录。`variables.sh` 沿用上一篇的文件，只有内容被换掉。',
        blocks: [
          {
            type: 'run',
            title: '改写脚本，再跑一次',
            root: '/home/labex/project',
            cwd: '/home/labex/project',
            perms: true,
            tree: { 'variables.sh': `${OLD.join('\n')}\n` },
            meta: { 'variables.sh': 'rwxrwxr-x labex labex' },
            commands: [
              { edit: { file: 'variables.sh', content: `${LINES.join('\n')}\n` }, note: '在编辑器把内容整个换成新版本，存档。权限还是 `-rwxrwxr-x`，不用再 `chmod`。' },
              { cmd: './variables.sh', out: OUT, note: '`\\$HK` 印出 `$HK`，`${MyFirstLetters}DEFGHIJ` 接成 `ABCDEFGHIJ`，最后两行一个压掉空格、一个保留。' },
            ],
          },
          {
            type: 'recap',
            items: [
              '`#` 开头的行是注释，bash 会跳过。',
              '`\\$`：在双引号里印出 `$` 本身，反斜线不印。',
              '`${名字}`：名字后面紧接着字母、数字或底线时，用大括号框出名字。',
              '`"$变量"`：用双引号包起来，值里的空格才会原样保留。',
            ],
          },
        ],
      },
    ],
  });
})();
