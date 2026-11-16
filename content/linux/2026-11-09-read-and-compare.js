(function () {
  const PROMPT = 'labex:project/ $';
  const P = '/home/labex/project';
  const HELLO = 'Hi,\nI am Labby!\n';
  const pickCard = (title, pick) => ({ title, icon: 'file', bytes: { text: HELLO, pick } });

  KnowledgeMap.add({
    id: 'read-and-compare',
    topic: 'linux',
    group: 'view',
    date: '2026-11-09',
    title: 'cat、head、tail、diff：查看与比较文件',
    summary: '想看全部用 cat，只看开头或结尾用 head 和 tail，想知道两个文件差在哪用 diff。',
    quiz: [
      { q: '只看 `file.txt` 的前 3 行，要输入什么？', answer: ['head -n 3 file.txt', 'head -n3 file.txt', 'head -3 file.txt'], why: '`head` 看开头，`-n` 后面接要几行。' },
      { q: '只看 `file.txt` 的最后 1 行，要输入什么？', answer: ['tail -n 1 file.txt', 'tail -n1 file.txt', 'tail -1 file.txt'], why: '`tail` 看结尾，`-n` 后面接要几行。' },
      { q: '想帮每一行加上行号，要用哪个？', choices: ['`head -c`', '`cat -n`', '`diff -r`'], answer: 1, why: '`cat -n` 会在每一行前面加上行号。' },
      { q: '想知道两个文件差在哪里，要用哪个命令？', choices: ['`diff`', '`cat`', '`tail`'], answer: 0, why: '`diff` 会列出两个文件不一样的地方。' },
    ],
    sections: [
      {
        nav: '差别',
        kicker: '开始之前',
        title: '四个命令，都只是「看」',
        lead: '这一篇的命令都不会修改文件，可以放心练习。',
        blocks: [
          {
            type: 'analogy',
            title: '就像读一本书',
            text: '`cat` 是从第一页读到最后一页；`head` 只翻开头几页；`tail` 直接翻到结尾。',
          },
          {
            type: 'analogy',
            title: '`diff` 是大家来找碴',
            text: '把两份文档放在一起比对，只告诉你**不一样的地方**，相同的部分完全不提。',
          },
        ],
      },
      {
        nav: 'cat',
        kicker: '命令 1',
        title: 'cat：印出整个文件',
        blocks: [
          { type: 'movie', film: 'cat' },
          {
            type: 'terminal',
            prompt: PROMPT,
            lines: [
              { cmd: 'cat /tmp/hello', out: 'Hi,\nI am Labby!' },
              { cmd: 'cat -n /tmp/hello', out: '     1  Hi,\n     2  I am Labby!' },
            ],
          },
          {
            type: 'text',
            title: '全部印出来',
            text: [
              '`cat` 会把文件内容从头到尾印在画面上。',
              '加上 `-n`（number）会在每一行前面标行号。行号只是显示用，**文件本身没有被改动**。',
            ],
          },
        ],
      },
      {
        nav: 'head',
        kicker: '命令 2',
        title: 'head：只看开头',
        blocks: [
          { type: 'movie', film: 'head' },
          {
            type: 'terminal',
            prompt: PROMPT,
            lines: [
              { cmd: 'head -n1 /tmp/hello', out: 'Hi,' },
              { cmd: 'head -c1 /tmp/hello', out: 'H' },
            ],
          },
          {
            type: 'text',
            title: '`-n` 算行，`-c` 算字节',
            text: [
              '`-n1` 表示取前 **1 行**，`-c1` 表示取前 **1 个字节**。',
              '`-c1` 只拿到字母 `H`，后面没有换行，所以下一个提示字符不会自动换到新的一行。',
            ],
          },
        ],
      },
      {
        nav: 'tail',
        kicker: '命令 3',
        title: 'tail：只看结尾',
        blocks: [
          { type: 'movie', film: 'tail' },
          {
            type: 'terminal',
            prompt: PROMPT,
            lines: [
              { cmd: 'tail -n1 /tmp/hello', out: 'I am Labby!' },
              { cmd: 'tail -c1 /tmp/hello', out: '\n' },
              { cmd: 'tail -c2 /tmp/hello', out: '!' },
            ],
          },
          {
            type: 'text',
            title: '为什么 `tail -c1` 是空的？',
            text: [
              '文件每一行的结尾都有一个看不见的**换行字符**，它也占 1 个字节。',
              '所以最后 1 个字节就是换行，印出来只看到一行空白；取最后 2 个，才会看到 `!`。',
            ],
          },
          {
            type: 'run',
            title: '看看每个命令拿到了哪些字节',
            root: '/tmp',
            cwd: P,
            tree: { hello: HELLO },
            commands: [
              { cmd: 'cat /tmp/hello', out: 'Hi,\nI am Labby!', note: '`cat` 拿到全部 16 个字节。`↵` 是换行字符，平常看不见，但它真的存在文件里。', info: pickCard('取到全部', [0, 16]) },
              { cmd: 'cat -n /tmp/hello', out: '     1  Hi,\n     2  I am Labby!', note: '内容一样是全部，`-n` 只是在显示时加上行号。', info: { ...pickCard('取到全部，再加上行号', [0, 16]), rows: [['第 1 行', 'Hi,'], ['第 2 行', 'I am Labby!']] } },
              { cmd: 'head -n1 /tmp/hello', out: 'Hi,', note: '从开头取 1 行，也就是到第一个换行为止。', info: pickCard('取开头 1 行', [0, 4]) },
              { cmd: 'head -c1 /tmp/hello', out: 'H', note: '`-c` 是一个一个字节算，只取第 1 个。', info: pickCard('取开头 1 个字节', [0, 1]) },
              { cmd: 'tail -n1 /tmp/hello', out: 'I am Labby!', note: '从结尾往回取 1 行。', info: pickCard('取结尾 1 行', [4, 16]) },
              { cmd: 'tail -c1 /tmp/hello', out: '\n', note: '最后 1 个字节就是换行，所以画面上只有一行空白。', info: pickCard('取结尾 1 个字节', [15, 16]) },
              { cmd: 'tail -c2 /tmp/hello', out: '!', note: '往回多取一个，`!` 就出现了，后面跟着换行。', info: pickCard('取结尾 2 个字节', [14, 16]) },
            ],
          },
        ],
      },
      {
        nav: 'diff',
        kicker: '命令 4',
        title: 'diff：比较两个文件',
        lead: '`diff` 只会列出不同的地方。如果两边完全相同，它什么都不印。',
        blocks: [
          { type: 'movie', film: 'diff' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [
              { cmd: 'diff file1 file2', out: '1c1\n< this is file1\n---\n> this is file2' },
              { cmd: 'diff -r /home/labex/Desktop /home/labex/Code', out: 'Only in /home/labex/Desktop: code.desktop\nOnly in /home/labex/Desktop: gedit.desktop\nOnly in /home/labex/Desktop: gvim.desktop\nOnly in /home/labex/Desktop: xfce4-terminal.desktop' },
            ],
          },
          {
            type: 'run',
            title: '读懂 diff 的输出',
            root: P,
            cwd: P,
            tree: {},
            startInfo: { title: '比较的方向', icon: 'book', rows: [['左边', 'diff 后面第 1 个', '输出用 < 标示'], ['右边', 'diff 后面第 2 个', '输出用 > 标示']] },
            commands: [
              {
                cmd: 'diff file1 file2',
                out: '1c1\n< this is file1\n---\n> this is file2',
                note: '输出先说哪里不同，再分别列出两边的内容。',
                info: { title: '逐行解读', icon: 'list', rows: [['1c1', '!左边第 1 行 → 右边第 1 行', 'c 是 change，表示这行被换掉'], ['<', 'this is file1', '左边文件（file1）的内容'], ['---', '分隔线', '上面是左边，下面是右边'], ['>', 'this is file2', '右边文件（file2）的内容']] },
              },
              {
                note: '先记住方向：`<` 指向左边的文件，`>` 指向右边的文件，就像箭头指着内容的来源。',
                info: { title: '符号指向来源', icon: 'bulb', rows: [['<', '!file1', '第 1 个文件'], ['>', '!file2', '第 2 个文件']] },
              },
              {
                cmd: 'diff -r /home/labex/Desktop /home/labex/Code',
                out: 'Only in /home/labex/Desktop: code.desktop\nOnly in /home/labex/Desktop: gedit.desktop\nOnly in /home/labex/Desktop: gvim.desktop\nOnly in /home/labex/Desktop: xfce4-terminal.desktop',
                note: '`-r` 会比较整个目录。`Only in` 表示这个项目只存在其中一边。',
                info: { title: '只有 Desktop 才有', icon: 'folder', rows: [['code.desktop', '只在 Desktop'], ['gedit.desktop', '只在 Desktop'], ['gvim.desktop', '只在 Desktop'], ['xfce4-terminal.desktop', '只在 Desktop']] },
              },
              {
                note: '输出里完全没有 `Only in /home/labex/Code`，代表 `Code` 里没有 `Desktop` 缺少的项目。',
                info: { title: '没出现也是一种答案', icon: 'bulb', rows: [['Only in Desktop', '!4 个项目'], ['Only in Code', '0 个项目']] },
              },
            ],
          },
        ],
      },
      {
        nav: '总结',
        kicker: '整理一下',
        title: '这一篇学到的事',
        blocks: [
          {
            type: 'terms',
            span: 7,
            items: [
              ['字节', '数据的基本单位，一个英文本母占 1 个字节。'],
              ['换行字符', '行尾看不见的字符，也占 1 个字节。'],
              ['`-n`', '`cat` 是加行号；`head`、`tail` 是指定行数。'],
              ['`-c`', '`head`、`tail` 用字节来计算。'],
              ['`1c1`', '左边第 1 行被换成右边第 1 行。'],
            ],
          },
          {
            type: 'extra',
            span: 5,
            title: '几个实用的小知识',
            text: [
              '`head` 和 `tail` 不加 `-n` 时，默认取 10 行。`-n1` 也可以写成 `-n 1`。',
              '`-c` 算的是字节，不是字数。中文本通常占 3 个字节，用 `-c` 可能会把一个字切成两半。',
              '`tail -f` 会持续显示文件添加的内容，常用来观察不断更新的日志文件，按 Ctrl+C 结束。',
            ],
          },
          {
            type: 'recap',
            items: [
              '`cat` 看全部，`-n` 加行号。',
              '`head` 看开头，`tail` 看结尾。',
              '`-n` 算行，`-c` 算字节。',
              '`diff` 只列出不同的地方。',
              '`diff -r` 比较整个目录。',
            ],
          },
        ],
      },
    ],
  });
})();
