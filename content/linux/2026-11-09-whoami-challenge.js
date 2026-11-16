(function () {
  KnowledgeMap.add({
    id: 'whoami-challenge',
    topic: 'linux',
    group: 'users',
    date: '2026-11-09',
    title: '挑战：查出目前的用户',
    summary: '没有步骤教学，只有目标。从题目的线索，自己选出对的命令。',
    quiz: [
      { q: '题目只说「查出目前的用户名」。你会输入哪个命令？', answer: ['whoami', 'id -un'], why: '关键字是「目前的用户」，对应的就是 `whoami`。' },
      { q: '`whoami` 和 `id` 差在哪里？', choices: ['两个完全一样', '`id` 只印名称', '`whoami` 只印名称，`id` 还会列出编号和用户组'], answer: 2, why: '只要名称用 `whoami`，要完整身分数据用 `id`。' },
    ],
    sections: [
      {
        nav: '题目',
        kicker: '挑战',
        title: '题目要我们做什么？',
        lead: '任务只有一句话：**查看目前的用户身分**。完成后，终端机上只能显示用户名。',
        blocks: [
          {
            type: 'analogy',
            title: '上课 vs. 考试',
            text: '一般的实验像上课，老师带着你一步步做。**挑战**像考试，只告诉你目标，要用学过的知识自己完成。',
          },
          {
            type: 'text',
            title: '先从题目找线索',
            text: [
              '提示说要找「能显示目前 Shell 工作阶段用户名」的命令，所以重点是**目前的用户**。',
              '题目又要求画面上**只有用户名**，所以输出不能夹带其他数据。',
            ],
          },
        ],
      },
      {
        nav: '解法',
        kicker: '解答',
        title: 'whoami：一行就完成',
        blocks: [
          { type: 'movie', film: 'filter' },
          { type: 'terminal', prompt: 'labex:project/ $', lines: [{ cmd: 'whoami', out: 'labex' }] },
          {
            type: 'text',
            title: '为什么是它？',
            text: '`whoami` 回答「我现在是谁」，而且**只印出用户名**，刚好符合题目的两个条件。',
          },
          {
            type: "run",
            title: "逐一试跑，看谁符合题目",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {},
            commands: [
              {
                cmd: "echo labex",
                note: "印出了名字，但只是把打的字印出来，**没有真的去查**。",
                out: "labex",
                info: {
                  title: "不符合",
                  icon: "close",
                  rows: [
                    [
                      "查出目前的用户",
                      "否：只是印出打的字"
                    ],
                    [
                      "只显示名字",
                      "是"
                    ]
                  ]
                }
              },
              {
                cmd: "id root",
                note: "查的是别人，不是目前的用户。",
                out: "uid=0(root) gid=0(root) groups=0(root)",
                info: {
                  title: "不符合",
                  icon: "close",
                  rows: [
                    [
                      "查出目前的用户",
                      "否：查的是 root"
                    ],
                    [
                      "只显示名字",
                      "否"
                    ]
                  ]
                }
              },
              {
                cmd: "id",
                note: "查的是自己，但印出太多数据。",
                out: "uid=5000(labex) gid=5000(labex) groups=5000(labex),27(sudo),121(ssl-cert),5002(public)",
                info: {
                  title: "不符合",
                  icon: "close",
                  rows: [
                    [
                      "查出目前的用户",
                      "是"
                    ],
                    [
                      "只显示名字",
                      "否：还有编号和用户组"
                    ]
                  ]
                }
              },
              {
                cmd: "id -un",
                note: "查目前的用户，而且只印名字，**符合题目**。",
                out: "labex",
                info: {
                  title: "符合",
                  icon: "checkCircle",
                  rows: [
                    [
                      "查出目前的用户",
                      "!是"
                    ],
                    [
                      "只显示名字",
                      "!是"
                    ]
                  ]
                }
              },
              {
                cmd: "whoami",
                note: "同样**符合**，而且最简短，是这题最直接的答案。",
                out: "labex",
                info: {
                  title: "符合，最简单",
                  icon: "checkCircle",
                  rows: [
                    [
                      "查出目前的用户",
                      "!是"
                    ],
                    [
                      "只显示名字",
                      "!是"
                    ]
                  ]
                }
              }
            ]
          },
        ],
      },
      {
        nav: '注意',
        kicker: '容易搞错的地方',
        title: '做题时要留意什么？',
        blocks: [
          {
            type: 'text',
            title: '范例是「结果」，不是要输入的命令',
            text: [
              '题目的范例是在展示输出长什么样子，你要输入的是命令，不是把 `labex` 打进去。',
              '用户名也会依环境不同。在别台电脑上，同一个命令可能印出别的名字，这是正常的。',
            ],
          },
          {
            type: 'extra',
            title: '`echo $USER` 也能看名字吗？',
            text: [
              '通常可以。`$USER` 是一个**环境变量**，就像写著名字的便利贴，通常会显示你的用户名。',
              '但便利贴可以被改写。`whoami` 则是直接向系统查找，所以想确认真实身分时，用它比较可靠。',
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
            items: [
              ['挑战', '只给目标、不给步骤的练习，用来检验自己学会了没有。'],
              ['Shell 工作阶段', '你打开终端机后，正在进行的这一段操作。'],
              ['环境变量', '系统替程序记下的设置值，例如 `$USER`。'],
            ],
          },
          {
            type: 'recap',
            items: [
              '解题先找条件，再筛选命令。',
              '`whoami` 只印出目前的用户名。',
              '`id -un` 也符合题目，只是比较长。',
              '范例展示的是输出，不是要输入的内容。',
            ],
          },
        ],
      },
    ],
  });
})();
