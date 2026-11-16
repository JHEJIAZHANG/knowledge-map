(function () {
  const PROMPT = 'labex:project/ $';
  KnowledgeMap.add({
    id: 'create-and-list',
    topic: 'linux',
    group: 'files',
    date: '2026-11-09',
    title: '创建文件与目录，再用 ls 看清楚',
    summary: '用 touch、echo 和 mkdir 做出东西，再学会读懂 ls 的各种输出。',
    quiz: [
      { q: '创建一个空文件 `notes.txt`，要输入什么？', answer: 'touch notes.txt', why: '`touch` 会创建空文件。' },
      { q: '创建一个目录 `photos`，要输入什么？', answer: 'mkdir photos', why: '`mkdir` 是 make directory，创建目录。' },
      { q: '哪个选项能让 `ls` 把隐藏文件也列出来？', choices: ['`-l`', '`-a`', '`-R`'], answer: 1, why: '`-a` 是 all，连 `.` 开头的隐藏文件一起列出。`-l` 是看详细信息。' },
      { q: '`echo "Hi" > a.txt` 里的 `>` 做了什么？', choices: ['把输出写进 `a.txt`', '把 `a.txt` 印到屏幕上', '比较两个文件'], answer: 0, why: '`>` 把原本要印在屏幕上的文本改写进右边的文件。' },
    ],
    sections: [
      {
        nav: '创建',
        kicker: '动手做',
        title: '做出几个文件和目录',
        lead: '先进到 `project`，然后用三种方式创建东西。',
        blocks: [
          { type: 'movie', film: 'touch' },
          { type: 'movie', film: 'redirect' },
          { type: 'movie', film: 'mkdir' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'cd /home/labex/project' },
              { cmd: 'touch file1.txt' },
              { cmd: 'echo "Hello, Linux" > file2.txt' },
              { cmd: 'echo "Hidden file" > .hiddenfile' },
              { cmd: 'mkdir testdir' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '三个新朋友',
            text: [
              '`touch` 创建一个空文件。',
              '`>` 叫**重新导向**：本来 `echo` 会印在画面上，`>` 让输出改写进文件里。',
              '`mkdir` 是 make directory，创建目录。',
            ],
          },
          {
            type: 'analogy',
            span: 12,
            title: '`>` 就像把水管接到水桶',
            text: '`echo` 的输出本来流向屏幕，`>` 把水管转向，流进指定的文件，所以画面上什么都看不到。文件不存在会自动创建，**已经存在的话，旧内容会被盖掉**。',
          },
          {
            type: "run",
            title: "看着 project 目录一步步长出东西",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {},
            commands: [
              {
                cmd: "touch file1.txt",
                note: "创建一个空文件，大小是 0。"
              },
              {
                cmd: "echo \"Hello, Linux\" > file2.txt",
                note: "`>` 把输出改写进文件，所以画面上什么都没印。12 个字符加上换行（↵），共 13 字节。"
              },
              {
                cmd: "echo \"Hidden file\" > .hiddenfile",
                note: "文件名用 `.` 开头，就成了隐藏文件。"
              },
              {
                cmd: "mkdir testdir",
                note: "创建一个空目录，等一下可以把文件放进去。"
              },
              {
                cmd: "ls",
                note: "`ls` 默认略过 `.` 开头的隐藏文件，所以只列出三个。",
                out: "file1.txt  file2.txt  testdir"
              },
              {
                cmd: "ls -a",
                note: "`-a` 代表 all，连隐藏文件也列出来。`.` 是目前的目录，`..` 是上一层。",
                out: ".  ..  .hiddenfile  file1.txt  file2.txt  testdir"
              },
              {
                cmd: "ls -l testdir",
                note: "查看目录里面。`total 0` 表示它还是空的。",
                out: "total 0"
              }
            ]
          },
        ],
      },
      {
        nav: 'ls -l',
        kicker: '查看',
        title: 'ls -l：看详细数据',
        lead: '`ls` 只给名字，加上 `-l`（long）就会一个项目一行，列出完整信息。',
        blocks: [
          { type: 'movie', film: 'lsl' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls', out: 'file1.txt  file2.txt  testdir' },
              { cmd: 'ls -l', out: 'total 4\n-rw-rw-r-- 1 labex labex  0 Nov  9 14:06 file1.txt\n-rw-rw-r-- 1 labex labex 13 Nov  9 14:06 file2.txt\ndrwxrwxr-x 2 labex labex  6 Nov  9 14:07 testdir' },
            ],
          },
          {
            type: "run",
            title: "拆解 ls -l 的一行",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {
              ".hiddenfile": "Hidden file\n",
              "file1.txt": "",
              "file2.txt": "Hello, Linux\n",
              testdir: {}
            },
            commands: [
              {
                cmd: "ls -l",
                note: "一个项目一行，每一栏只回答一个问题。下面一栏一栏看 `file2.txt` 这行。",
                out: "total 4\n-rw-rw-r-- 1 labex labex  0 Nov  9 14:06 file1.txt\n-rw-rw-r-- 1 labex labex 13 Nov  9 14:06 file2.txt\ndrwxrwxr-x 2 labex labex  6 Nov  9 14:07 testdir",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "第一个字符 `-` 是一般文件，`d` 是目录。后面的 `rw-rw-r--` 是权限：谁能读、谁能写。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "!-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "先简单理解成「有几个名字指向它」，一般文件通常是 1。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "!1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "这个文件属于用户 `labex`，就是先前 `id` 查到的那个身分。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "!labex",
                      null
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "同时也属于用户组 `labex`。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "!labex",
                      null
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "大小的单位是字节。`file1.txt` 是空的所以是 0，`file2.txt` 是 13。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "!13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "文件最后一次被修改的时间。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "!Nov  9 14:06",
                      null
                    ],
                    [
                      "名称",
                      "file2.txt"
                    ]
                  ]
                }
              },
              {
                note: "最后一栏才是文件名。现在回头看整行，就读得懂了。",
                info: {
                  title: "拆解 file2.txt 这一行",
                  icon: "list",
                  rows: [
                    [
                      "类型与权限",
                      "-rw-rw-r--",
                      "第一个字：- 是文件，d 是目录"
                    ],
                    [
                      "链接数",
                      "1",
                      "有几个名字指向它"
                    ],
                    [
                      "拥有者",
                      "labex"
                    ],
                    [
                      "用户组",
                      "labex"
                    ],
                    [
                      "大小",
                      "13",
                      "单位是字节"
                    ],
                    [
                      "修改时间",
                      "Nov  9 14:06"
                    ],
                    [
                      "名称",
                      "!file2.txt",
                      null
                    ]
                  ]
                }
              }
            ]
          },
        ],
      },
      {
        nav: 'ls -a',
        kicker: '查看',
        title: 'ls -a 与 ls -la：连隐藏的也看',
        blocks: [
          { type: 'movie', film: 'lsa' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls -a', out: '.  ..  .hiddenfile  file1.txt  file2.txt  testdir' },
              { cmd: 'ls -la', out: 'total 12\ndrwxr-xr-x 1 labex labex   74 Nov  9 14:07 .\ndrwxr-x--- 1 labex labex 4096 Nov  9 14:07 ..\n-rw-rw-r-- 1 labex labex   12 Nov  9 14:06 .hiddenfile\n-rw-rw-r-- 1 labex labex    0 Nov  9 14:06 file1.txt\n-rw-rw-r-- 1 labex labex   13 Nov  9 14:06 file2.txt\ndrwxrwxr-x 2 labex labex    6 Nov  9 14:07 testdir' },
              { cmd: 'ls -l testdir', out: 'total 0' },
            ],
          },
          {
            type: 'text',
            title: '`.` 和 `..` 是什么？',
            text: '每个目录里都有这两个特殊项目：`.` 是**目前的目录**，`..` 是**上一层**。这就是 `cd ..` 能往上走的原因。',
          },
          {
            type: 'text',
            title: '选项可以合并',
            text: '`-la` 就是 `-l` 和 `-a` 一起用。`ls -l testdir` 查看目录里面，`total 0` 表示它还是空的。',
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
              ['重新导向 `>`', '把输出改写进文件，会覆盖旧内容。'],
              ['隐藏文件', '名称以 `.` 开头，`ls` 默认不显示。'],
              ['`.` / `..`', '目前的目录 / 上一层目录。'],
              ['权限', '规定谁可以读、写、运行。'],
            ],
          },
          {
            type: 'extra',
            span: 5,
            title: '为什么 testdir 大小不是 0？',
            text: [
              '目录显示的大小，是记录「里面有哪些名称」所占的空间，**不是里面文件的总和**，所以空目录也不一定是 0。',
              '第一行的 `total` 则是这些项目占用的磁盘区块数，不是文件数量。',
            ],
          },
          {
            type: 'recap',
            items: [
              '`touch` 创建空文件。',
              '`echo 文本 > 文件` 把文本写进文件。',
              '`mkdir` 创建目录。',
              '`ls -l` 看详细数据。',
              '`ls -a` 连隐藏文件也列出。',
            ],
          },
        ],
      },
    ],
  });
})();
