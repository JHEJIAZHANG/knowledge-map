(function () {
  const PROMPT = 'labex:project/ $';
  const HOME = 'labex:~/ $';

  KnowledgeMap.add({
    id: 'navigate-directories',
    topic: 'linux',
    group: 'paths',
    date: '2026-11-09',
    title: '我在哪里？用 pwd、ls、cd 认路',
    summary: '先知道自己站在哪里，看看周围有什么，再走到想去的目录。',
    quiz: [
      { q: '想知道自己现在在哪个目录，要输入什么？', answer: 'pwd', why: '`pwd` 会印出目前位置的完整路径。' },
      { q: '不管现在在哪里，要直接回到家目录，输入什么？', answer: ['cd ~', 'cd'], why: '`~` 代表家目录，所以是 `cd ~`。' },
      { q: '要回到上一层目录，输入什么？', answer: ['cd ..', 'cd ../'], why: '`..` 代表上一层。' },
      { q: '`ls` 是用来做什么的？', choices: ['切换目录', '列出目录里有什么', '显示目前位置'], answer: 1, why: '`ls` 看周围有什么，`cd` 才是走过去，`pwd` 是看自己在哪。' },
    ],
    sections: [
      {
        nav: '目录',
        kicker: '开始之前',
        title: '文件都放在一棵「目录树」上',
        blocks: [
          {
            type: 'analogy',
            title: '就像一栋大楼',
            text: 'Linux 的**目录**就是文件夹。最上层是 `/`，像大楼的大门；往下走会经过一层层的房间。你在终端机里，永远「站在」某一个房间。',
          },
          {
            type: 'text',
            title: '路径就是地址',
            text: [
              '`/home/labex/project` 从左读到右：从大门 `/` 进去，到 `home`，再到 `labex`，最后是 `project`。',
              '这种**从 `/` 开始写的完整地址**叫绝对路径，不管你站在哪里，它指的都是同一个地方。',
            ],
          },
        ],
      },
      {
        nav: 'pwd',
        kicker: '命令 1',
        title: 'pwd：我现在在哪里？',
        blocks: [
          { type: 'movie', film: 'pwd' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'pwd', out: '/home/labex/project' }] },
          {
            type: 'text',
            title: 'print working directory',
            text: '`pwd` 会印出你目前所在的**工作目录**完整路径。迷路的时候，先打它就对了。',
          },
        ],
      },
      {
        nav: '~',
        kicker: '符号',
        title: '~：回家的捷径',
        blocks: [
          { type: 'movie', film: 'home' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'echo ~', out: '/home/labex' }] },
          {
            type: 'text',
            title: '~ 代表你的家目录',
            text: [
              '每个用户都有自己的**家目录**，`labex` 的家目录是 `/home/labex`，用一个 `~` 就能代表。',
              '这和先前的引号一样，是 Shell 先把 `~` 换成真正的路径，`echo` 收到的已经是 `/home/labex`。',
            ],
          },
        ],
      },
      {
        nav: 'ls',
        kicker: '命令 2',
        title: 'ls：这里有什么？',
        blocks: [
          { type: 'movie', film: 'ls' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'ls' }, { cmd: 'ls ~', out: 'Code  Desktop  golang  project' }] },
          {
            type: 'text',
            title: '没有输出也是一种答案',
            text: [
              '第一次 `ls` 什么都没印，因为 `project` 目前**没有可显示的东西**，这不是错误。',
              '后面接路径，就能查看别的地方，自己不用走过去。`ls ~` 列出的是家目录里的内容。',
            ],
          },
        ],
      },
      {
        nav: 'cd',
        kicker: '命令 3',
        title: 'cd：走到别的目录',
        lead: '`cd` 是 change directory。走动之后注意看提示字符，它会跟着改变。',
        blocks: [
          { type: 'movie', film: 'cd' },
          {
            type: 'terminal',
            prompt: PROMPT,
            lines: [
              { cmd: 'cd ..' },
              { cmd: 'cd project', prompt: HOME },
              { cmd: 'cd ~' },
              { cmd: 'cd /home/labex/project', prompt: HOME },
            ],
          },
          {
            type: 'text',
            title: '三种写法',
            text: [
              '`..` 代表**上一层**。`cd project` 是**相对路径**，从目前位置往下走。',
              '`cd ~` 直接回家；`cd /home/labex/project` 是绝对路径，从任何地方都能直达。',
            ],
          },
          {
            type: "run",
            title: "跟着命令在目录树上走",
            root: "/",
            cwd: "/home/labex/project",
            tree: {
              home: {
                labex: {
                  Code: {},
                  Desktop: {},
                  golang: {},
                  project: {}
                }
              }
            },
            commands: [
              {
                cmd: "pwd",
                note: "印出目前位置的完整路径。对照右边的树，由上往下就是 `/home/labex/project`。",
                out: "/home/labex/project"
              },
              {
                cmd: "ls",
                note: "`project` 里面没有东西，所以什么都没印，这不是错误。"
              },
              {
                cmd: "ls ~",
                note: "后面接路径，就能看别的地方，自己不用走过去。`~` 是家目录。",
                out: "Code  Desktop  golang  project"
              },
              {
                cmd: "cd ..",
                note: "`..` 是上一层，来到 `labex`。这里是家目录，所以提示字符变成 `~/`。"
              },
              {
                cmd: "cd project",
                note: "没有 `/` 开头，是相对路径：从目前的位置往下走。"
              },
              {
                cmd: "cd ~",
                note: "不管在哪里，`cd ~` 都会直接回家目录。"
              },
              {
                cmd: "cd /home/labex/project",
                note: "开头是 `/`，是绝对路径：从最上层沿着完整地址走到目的地。"
              }
            ]
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
              ['目录', '文件夹，用来装文件和其他目录。'],
              ['工作目录', '你目前所在的位置，`pwd` 印出来的就是它。'],
              ['家目录 `~`', '每个用户专属的起始位置。'],
              ['绝对路径', '从 `/` 开始的完整地址。'],
              ['相对路径', '从目前位置算起的路线，例如 `project`、`..`。'],
            ],
          },
          {
            type: 'extra',
            span: 5,
            title: '提示字符里就有位置',
            text: '`labex:project/ $` 中间的 `project/` 是目前所在的目录，回到家目录时会显示 `~/`。这是这个环境的显示方式，别台电脑的样式可能不同，所以要确认完整路径时，还是用 `pwd`。',
          },
          {
            type: 'recap',
            items: [
              '`pwd` 显示目前的位置。',
              '`ls` 列出内容，后面可接路径。',
              '`cd ..` 往上一层。',
              '`cd ~` 回家目录。',
              '`/` 开头是绝对路径，其他是相对路径。',
            ],
          },
        ],
      },
    ],
  });
})();
