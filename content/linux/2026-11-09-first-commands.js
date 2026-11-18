(function () {
  const PROMPT = 'labex:project/ $';
  KnowledgeMap.add({
    id: 'linux-first-commands',
    topic: 'linux',
    group: 'terminal',
    date: '2026-11-09',
    title: '第一次用终端机：打招呼，然后确认我是谁',
    summary: '用 echo 让电脑说话，再用 whoami 和 id 查出目前登录的是谁、有哪些身分。',
    quiz: [
      { q: '想让终端机把一段文本印出来，要用哪个命令？', choices: ['`whoami`', '`echo`', '`id`'], answer: 1, why: '`echo` 会把后面的文本原样印出来。' },
      { q: '只想知道目前登录的用户名，要输入什么？', answer: ['whoami', 'id -un'], why: '`whoami` 只印出用户名。`id -un` 也会得到一样的结果。' },
      { q: '`id` 的输出里，`uid` 是什么？', choices: ['用户的编号', '用户组的编号', '文件的大小'], answer: 0, why: '`uid` 是用户编号，`gid` 才是用户组编号。' },
    ],
    sections: [
      {
        nav: '开始',
        kicker: '开始之前',
        title: '用打字跟电脑对话',
        blocks: [
          {
            type: 'analogy',
            title: '终端机就像聊天窗口',
            text: '平常我们用鼠标点按钮；在终端机里，则是**打一行字告诉电脑要做什么**，电脑做完会把结果印在下一行。',
          },
          {
            type: 'text',
            title: '先看懂提示字符',
            text: [
              '`labex:project/ $` 不是命令，而是电脑在说「我准备好了，请输入」。',
              '`labex` 是目前的用户，`project/` 是目前所在的文件夹，`$` 的后面才是你要输入的内容。',
            ],
          },
        ],
      },
      {
        nav: 'echo',
        kicker: '命令 1',
        title: 'echo：叫电脑把话说出来',
        lead: '`echo` 的意思是「回音」，你给它什么文本，它就印出什么。',
        blocks: [
          { type: 'movie', film: 'echo' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'echo "Hello World"', out: 'Hello World' }] },
          {
            type: 'text',
            title: '注意输出的样子',
            text: '输入时有引号，输出却**没有引号**。引号是写给 Shell 看的，不是要印出来的内容。下面的动画会一步步说明。',
          },
          {
            type: "run",
            title: "一行命令是怎么被运行的？",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {},
            startInfo: {
              title: "echo 做的事",
              icon: "terminal",
              rows: [
                [
                  "输入",
                  "你在命令后面打的文本"
                ],
                [
                  "处理",
                  "Shell 运行 echo"
                ],
                [
                  "输出",
                  "原样印到终端机"
                ]
              ]
            },
            commands: [
              {
                cmd: "echo \"Hello World\"",
                note: "`echo` 把收到的文本原样印出来。引号只是把两个字绑成一组，用完就拿掉，所以输出没有引号。",
                out: "Hello World",
                info: {
                  title: "逐段拆解",
                  icon: "terminal",
                  rows: [
                    [
                      "命令",
                      "echo",
                      "要做的事：印出文本"
                    ],
                    [
                      "参数",
                      "\"Hello World\"",
                      "引号让两个字算成同一个参数"
                    ],
                    [
                      "输出",
                      "!Hello World",
                      "引号不见了"
                    ]
                  ]
                }
              }
            ]
          },
        ],
      },
      {
        nav: 'whoami',
        kicker: '命令 2',
        title: 'whoami：我现在是谁？',
        blocks: [
          { type: 'movie', film: 'whoami' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'whoami', out: 'labex' }] },
          {
            type: 'text',
            title: '名字就是功能',
            text: '命令名称就是英文的 **who am I**。它回答目前操作电脑的用户名，这里是 `labex`。',
          },
        ],
      },
      {
        nav: 'id',
        kicker: '命令 3',
        title: 'id：看完整的身分数据',
        lead: '`whoami` 只回答名字，`id` 则会把编号和所属用户组全部列出来。',
        blocks: [
          { type: 'movie', film: 'id' },
          { type: 'terminal', span: 7, prompt: PROMPT, lines: [{ cmd: 'id', out: 'uid=5000(labex) gid=5000(labex) groups=5000(labex),27(sudo),121(ssl-cert),5002(public)' }] },
          {
            type: 'analogy',
            span: 5,
            title: '身分证，加上你参加的社团',
            text: '身分证字号**给系统看**，姓名**给人看**，指的是同一个人。社团则像用户组，一个人可以加入很多个。',
          },
          {
            type: "run",
            title: "拆解 id 的输出",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {},
            commands: [
              {
                cmd: "id",
                note: "一行输出其实分成三段，每一段都是「编号(名字)」的格式。",
                out: "uid=5000(labex) gid=5000(labex) groups=5000(labex),27(sudo),121(ssl-cert),5002(public)",
                info: {
                  title: "id 的输出分成三段",
                  icon: "book",
                  rows: [
                    [
                      "uid",
                      "5000(labex)",
                      "用户编号（名字）"
                    ],
                    [
                      "gid",
                      "5000(labex)",
                      "主要用户组"
                    ],
                    [
                      "groups",
                      "5000(labex), 27(sudo), 121(ssl-cert), 5002(public)",
                      "加入的所有用户组"
                    ]
                  ]
                }
              },
              {
                note: "**uid** 是用户编号。系统认得的是 5000，`labex` 是方便人阅读的名字。",
                info: {
                  title: "id 的输出分成三段",
                  icon: "book",
                  rows: [
                    [
                      "uid",
                      "!5000(labex)",
                      "用户编号（名字）"
                    ],
                    [
                      "gid",
                      "5000(labex)",
                      "主要用户组"
                    ],
                    [
                      "groups",
                      "5000(labex), 27(sudo), 121(ssl-cert), 5002(public)",
                      "加入的所有用户组"
                    ]
                  ]
                }
              },
              {
                note: "**gid** 是主要用户组。创建新文件时，文件通常会属于这个用户组。",
                info: {
                  title: "id 的输出分成三段",
                  icon: "book",
                  rows: [
                    [
                      "uid",
                      "5000(labex)",
                      "用户编号（名字）"
                    ],
                    [
                      "gid",
                      "!5000(labex)",
                      "主要用户组"
                    ],
                    [
                      "groups",
                      "5000(labex), 27(sudo), 121(ssl-cert), 5002(public)",
                      "加入的所有用户组"
                    ]
                  ]
                }
              },
              {
                note: "**groups** 列出所有加入的用户组。在 Ubuntu 这类系统上，`sudo` 用户组的成员通常可以暂时借用管理员权限。",
                info: {
                  title: "id 的输出分成三段",
                  icon: "book",
                  rows: [
                    [
                      "uid",
                      "5000(labex)",
                      "用户编号（名字）"
                    ],
                    [
                      "gid",
                      "5000(labex)",
                      "主要用户组"
                    ],
                    [
                      "groups",
                      "!5000(labex), 27(sudo), 121(ssl-cert), 5002(public)",
                      "加入的所有用户组"
                    ]
                  ]
                }
              }
            ]
          },
        ],
      },
      {
        nav: 'id root',
        kicker: '命令 4',
        title: 'id root：查别人的数据',
        blocks: [
          { type: 'movie', film: 'idroot' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'id root', out: 'uid=0(root) gid=0(root) groups=0(root)' }] },
          {
            type: 'text',
            title: '在后面加上账号名称',
            text: '`id` 后面接账号名称，就能查找那个人。**root** 是 Linux 的最高权限管理员，uid 固定是 **0**。',
          },
        ],
      },
      {
        nav: 'id -un',
        kicker: '命令 5',
        title: 'id -un：只要名字',
        blocks: [
          { type: 'movie', film: 'idun' },
          { type: 'terminal', prompt: PROMPT, lines: [{ cmd: 'id -un', out: 'labex' }] },
          {
            type: 'text',
            title: '选项：调整命令的行为',
            text: '命令后面以 `-` 开头的叫**选项**。`-un` 让 `id` 只回答用户名，所以结果和 `whoami` 相同。',
          },
          {
            type: "run",
            title: "同一个 id，换个问法",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {},
            commands: [
              {
                cmd: "id",
                note: "不加任何东西：印出自己的完整数据。",
                out: "uid=5000(labex) gid=5000(labex) groups=5000(labex),27(sudo),121(ssl-cert),5002(public)",
                info: {
                  title: "查自己",
                  icon: "user",
                  rows: [
                    [
                      "查找对象",
                      "目前的用户"
                    ],
                    [
                      "结果",
                      "!uid、gid、groups 全部列出"
                    ]
                  ]
                }
              },
              {
                cmd: "id root",
                note: "后面加上账号名称就改查别人。root 是最高权限管理员，编号固定是 0。",
                out: "uid=0(root) gid=0(root) groups=0(root)",
                info: {
                  title: "查别人",
                  icon: "user",
                  rows: [
                    [
                      "查找对象",
                      "root"
                    ],
                    [
                      "uid",
                      "!0",
                      "管理员的编号"
                    ],
                    [
                      "groups",
                      "root"
                    ]
                  ]
                }
              },
              {
                cmd: "id -u",
                note: "`-u` 代表 user，只留下用户编号。",
                out: "5000",
                info: {
                  title: "只要编号",
                  icon: "user",
                  rows: [
                    [
                      "-u",
                      "user",
                      "只显示 uid"
                    ],
                    [
                      "结果",
                      "!5000"
                    ]
                  ]
                }
              },
              {
                cmd: "id -un",
                note: "`-n` 代表 name，把编号换成名字。`-un` 是 `-u -n` 的缩写。",
                out: "labex",
                info: {
                  title: "编号换成名字",
                  icon: "user",
                  rows: [
                    [
                      "-u",
                      "user",
                      "只显示 uid"
                    ],
                    [
                      "-n",
                      "name",
                      "显示名字而不是数字"
                    ],
                    [
                      "结果",
                      "!labex"
                    ]
                  ]
                }
              },
              {
                cmd: "whoami",
                note: "结果和 `id -un` 一样。想快速确认身分时，`whoami` 比较好记。",
                out: "labex",
                info: {
                  title: "最简单的问法",
                  icon: "user",
                  rows: [
                    [
                      "等同于",
                      "id -un"
                    ],
                    [
                      "结果",
                      "!labex"
                    ]
                  ]
                }
              }
            ]
          },
        ],
      },
      {
        nav: '总结',
        kicker: '整理一下',
        title: '这一章学到的事',
        blocks: [
          {
            type: 'terms',
            span: 7,
            items: [
              ['终端机', '让你打字下命令的窗口。'],
              ['Shell', '听懂命令、把工作交给电脑的程序。'],
              ['命令', '要电脑做的事，例如 `echo`、`id`。'],
              ['参数', '交给命令处理的数据，例如 `root`。'],
              ['选项', '调整命令行为的开关，例如 `-un`。'],
              ['uid / gid', '用户编号 / 用户组编号。'],
            ],
          },
          {
            type: 'extra',
            span: 5,
            title: '为什么要常常确认「我是谁」？',
            text: [
              'Linux 能做什么事，取决于你现在的身分。同一个命令，一般用户可能被拒绝，root 却能直接运行，也可能因此改坏系统。',
              '提示符号也有线索：一般用户多半是 `$`，root 多半是 `#`。不过样式可以自订，最准确的还是问 `whoami`。',
            ],
          },
          {
            type: 'recap',
            items: [
              '`echo` 把文本印出来，引号不会出现在输出中。',
              '`whoami` 回答目前的用户名。',
              '`id` 列出 uid、gid 和所有用户组。',
              '`id root` 查别人，root 的 uid 是 0。',
              '`id -un` 只回答名字，等同 `whoami`。',
            ],
          },
        ],
      },
    ],
  });
})();
