(function () {
  const PROMPT = 'labex:project/ $';

  KnowledgeMap.add({
    id: 'delete-files',
    topic: 'linux',
    group: 'files',
    date: '2026-11-09',
    title: 'rm：删除文件与目录',
    summary: '终端机没有资源回收桶。学会 rm、rm -i、rmdir、rm -r 的差别，也要知道哪里危险。',
    quiz: [
      { q: '要删除目录 `testdir` 和里面所有的东西，要输入什么？', answer: ['rm -r testdir', 'rm -R testdir', 'rm -rf testdir', 'rm -r testdir/'], why: '`-r` 是递归，连目录里的内容一起删。' },
      { q: '`rmdir` 可以删除哪一种目录？', choices: ['任何目录', '只有空的目录', '只有隐藏的目录'], answer: 1, why: '`rmdir` 只删空目录，里面有东西就会拒绝。' },
      { q: '想在删除前先被问一次，要加哪个选项？', choices: ['`-f`', '`-r`', '`-i`'], answer: 2, why: '`-i` 会逐一询问。`-f` 刚好相反，是不问直接删。' },
      { q: '用 `rm` 删掉的文件，可以从资源回收桶救回来吗？', choices: ['可以', '不行'], answer: 1, why: '终端机没有资源回收桶，删了就没了。' },
    ],
    sections: [
      {
        nav: '注意',
        kicker: '开始之前',
        title: '删了就没了',
        blocks: [
          {
            type: 'analogy',
            span: 12,
            title: '`rm` 不是丢进垃圾桶，是直接丢进碎纸机',
            text: '平常在电脑上删文件，还能从资源回收桶救回来。用 `rm` 删除的文件**不会进回收桶**，按下 Enter 就删了，通常也不会再问你一次。',
          },
        ],
      },
      {
        nav: 'rm',
        kicker: '命令 1',
        title: 'rm：删除文件',
        blocks: [
          { type: 'movie', film: 'rm' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [
              { cmd: 'pwd', out: '/home/labex/project' },
              { cmd: 'ls -la', out: 'total 12\ndrwxr-xr-x 1 labex labex  124 Nov  9 14:54 .\ndrwxr-x--- 1 labex labex 4096 Nov  9 14:56 ..\n-rw-rw-r-- 1 labex labex   12 Nov  9 14:06 .hiddenfile\n-rw-rw-r-- 1 labex labex    0 Nov  9 14:11 file1_copy.txt\n-rw-rw-r-- 1 labex labex   13 Nov  9 14:06 file2.txt\ndrwxrwxr-x 2 labex labex   23 Nov  9 14:48 new_testdir\n-rw-rw-r-- 1 labex labex    0 Nov  9 14:06 original_file1.txt\ndrwxrwxr-x 2 labex labex   23 Nov  9 14:54 testdir' },
              { cmd: 'rm original_file1.txt' },
              { cmd: 'ls -la', out: 'total 12\ndrwxr-xr-x 1 labex labex   98 Nov  9 14:56 .\ndrwxr-x--- 1 labex labex 4096 Nov  9 14:57 ..\n-rw-rw-r-- 1 labex labex   12 Nov  9 14:06 .hiddenfile\n-rw-rw-r-- 1 labex labex    0 Nov  9 14:11 file1_copy.txt\n-rw-rw-r-- 1 labex labex   13 Nov  9 14:06 file2.txt\ndrwxrwxr-x 2 labex labex   23 Nov  9 14:48 new_testdir\ndrwxrwxr-x 2 labex labex   23 Nov  9 14:54 testdir' },
            ],
          },
          {
            type: 'text',
            span: 12,
            title: '好习惯：先看再删',
            text: '这段操作先用 `pwd` 和 `ls -la` 确认位置与内容，删除后再用 `ls -la` 检查，`original_file1.txt` 那一行不见了。删除前后都看一眼，就不容易出错。',
          },
        ],
      },
      {
        nav: 'rm -i',
        kicker: '命令 2',
        title: 'rm -i：删之前先问我',
        blocks: [
          { type: 'movie', film: 'rmi' },
          {
            type: 'terminal',
            prompt: PROMPT,
            lines: [
              { cmd: 'rm -i file2.txt', out: "rm: remove regular file 'file2.txt'? y" },
              { cmd: 'ls', out: 'file1_copy.txt  new_testdir  testdir' },
            ],
          },
          {
            type: 'text',
            title: '多一道确认',
            text: '`-i` 是 interactive（交互），会逐一询问。输入 `y` 才删除，输入 `n` 就保留，适合在不太确定的时候使用。',
          },
        ],
      },
      {
        nav: '目录',
        kicker: '命令 3',
        title: 'rmdir 与 rm -r：删除目录',
        lead: '这里出现了一个错误消息，它其实是在保护你。',
        blocks: [
          { type: 'movie', film: 'rmdir' },
          { type: 'movie', film: 'rmr' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls new_testdir', out: 'file2.txt' },
              { cmd: 'rmdir new_testdir', out: "rmdir: failed to remove 'new_testdir': Directory not empty", err: true },
              { cmd: 'ls', out: 'file1_copy.txt  new_testdir  testdir' },
              { cmd: 'ls testdir', out: 'file2.txt' },
              { cmd: 'rm -r testdir' },
              { cmd: 'ls', out: 'file1_copy.txt  new_testdir' },
              { cmd: 'rm .hiddenfile' },
              { cmd: 'ls -a', out: '.  ..  file1_copy.txt  new_testdir' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '两个命令的差别',
            text: [
              '`rmdir` **只能删除空目录**。`new_testdir` 里还有 `file2.txt`，所以它拒绝运行，目录完好无缺。',
              '`rm -r` 会连同里面的所有内容一起删除，`testdir` 和里面的文件就一起消失了。',
              '隐藏文件只要写对完整文件名，一样用 `rm` 删除。',
            ],
          },
          {
            type: "run",
            title: "一步步清理 project",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {
              ".hiddenfile": "Hidden file\n",
              "file1_copy.txt": "",
              "file2.txt": "Hello, Linux\n",
              new_testdir: {
                "file2.txt": "Hello, Linux\n"
              },
              "original_file1.txt": "",
              testdir: {
                "file2.txt": "Hello, Linux\n"
              }
            },
            commands: [
              {
                cmd: "rm original_file1.txt",
                note: "直接删除，没有任何提示，也没有资源回收桶。"
              },
              {
                cmd: "rm -i file2.txt",
                note: "`-i` 会先询问，输入 `y` 才真的删。目录里的 `file2.txt` 是不同的文件，不受影响。",
                out: "rm: remove regular file 'file2.txt'? y"
              },
              {
                cmd: "ls",
                note: "少了两个文件。",
                out: "file1_copy.txt  new_testdir  testdir"
              },
              {
                cmd: "ls new_testdir",
                note: "先看目录里面：还有一个 `file2.txt`。",
                out: "file2.txt"
              },
              {
                cmd: "rmdir new_testdir",
                note: "`rmdir` 只能删空目录，里面还有文件，所以被拒绝，什么都没有变。",
                out: "rmdir: failed to remove 'new_testdir': Directory not empty",
                err: true
              },
              {
                cmd: "ls testdir",
                note: "`testdir` 里面也有文件。",
                out: "file2.txt"
              },
              {
                cmd: "rm -r testdir",
                note: "`-r` 连同目录里的 `file2.txt` 一起删掉。"
              },
              {
                cmd: "ls",
                note: "`testdir` 不见了，`new_testdir` 还在。",
                out: "file1_copy.txt  new_testdir"
              },
              {
                cmd: "rm .hiddenfile",
                note: "隐藏文件也是一般文件，写对完整名称就能删。"
              },
              {
                cmd: "ls -a",
                note: "连隐藏文件都看过了，只剩下两个项目。",
                out: ".  ..  file1_copy.txt  new_testdir"
              }
            ]
          },
        ],
      },
      {
        nav: 'rm -rf',
        kicker: '命令 4',
        title: 'rm -rf：最强也最危险',
        blocks: [
          { type: 'movie', film: 'rmrf' },
          {
            type: 'terminal',
            prompt: PROMPT,
            lines: [
              { cmd: 'mkdir temp_dir' },
              { cmd: 'touch temp_dir/temp_file.txt' },
              { cmd: 'ls -R temp_dir', out: 'temp_dir:\ntemp_file.txt' },
              { cmd: 'rm -rf temp_dir' },
              { cmd: 'ls', out: 'file1_copy.txt  new_testdir' },
            ],
          },
          {
            type: 'text',
            title: '拆开来看',
            text: [
              '`-r` 是连同内容一起删，`-f` 是 force（强制），**不询问也不提醒**，文件不存在也不报错。',
              '`ls -R` 的大写 `R` 同样是递归的意思，会把目录里每一层都列出来，删除前可以先用它确认。',
            ],
          },
          {
            type: "run",
            title: "rm -rf 怎么删掉整个目录",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {
              "file1_copy.txt": "",
              new_testdir: {
                "file2.txt": "Hello, Linux\n"
              }
            },
            commands: [
              {
                cmd: "mkdir temp_dir",
                note: "创建一个暂存目录来练习。"
              },
              {
                cmd: "touch temp_dir/temp_file.txt",
                note: "给路径就能直接在子目录里创建文件，不用先 `cd` 进去。"
              },
              {
                cmd: "ls -R temp_dir",
                note: "`-R` 把每一层都列出来，删除前可以先确认里面有什么。",
                out: "temp_dir:\ntemp_file.txt"
              },
              {
                cmd: "rm -rf temp_dir",
                note: "`-r` 连内容一起，`-f` 不询问，整个目录一次删掉。"
              },
              {
                cmd: "ls",
                note: "暂存目录没了，其他东西不受影响。",
                out: "file1_copy.txt  new_testdir"
              }
            ]
          },
          {
            type: 'extra',
            span: 12,
            title: '使用 rm -rf 的安全守则',
            text: [
              '这个命令不会给你反悔的机会。运行前先用 `pwd` 确认位置，用 `ls` 确认目标，路径也要**完整写清楚**再按 Enter。',
              '路径打错一个字符，或多了一个空格，都可能删到完全不同的地方。绝对不要对 `/` 或 `~` 这种上层目录运行，也不要随便加上 `sudo`。',
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
              ['`-i`', 'interactive，每次删除前都询问。'],
              ['`-r`', 'recursive，连同目录里的内容一起处理。'],
              ['`-f`', 'force，不询问、不提示。'],
              ['`Directory not empty`', '目录里还有东西，`rmdir` 无法删除。'],
            ],
          },
          {
            type: 'recap',
            items: [
              '`rm` 删除的文件不会进回收桶。',
              '`rm -i` 会先确认。',
              '`rmdir` 只能删空目录。',
              '`rm -r` 连内容一起删。',
              '`rm -rf` 前一定要确认路径。',
            ],
          },
        ],
      },
    ],
  });
})();
