(function () {
  const P = '/home/labex/project';
  const PROMPT = 'labex:project/ $';
  const LS = [
    'total 0',
    '-rwx------ 1 root root  0 Nov 10 16:33 example.txt',
    'drwxrwxr-x 3 root root 37 Nov 10 16:57 new-dir',
  ].join('\n');
  const LA = [
    'total 8',
    'drwxr-xr-x 1 labex labex   73 Nov 10 17:34 .',
    'drwxr-x--- 1 labex labex 4096 Nov 10 17:48 ..',
    '-rwx------ 1 root  root     0 Nov 10 16:33 example.txt',
    'drwxrwxr-x 3 root  root    37 Nov 10 16:57 new-dir',
    '-rw-rw-r-- 1 labex labex   32 Nov 10 17:47 script.sh',
    'drwx------ 2 labex labex    6 Nov 10 17:31 test-dir',
  ].join('\n');
  const SCRIPT = '#!/bin/bash\necho "Hello, World"';
  const DENIED = 'zsh: permission denied: ./script.sh';
  const ROOT = 'root root';

  // 接续上一篇结束时的状态
  const before = {
    'example.txt': '',
    'new-dir': { 'file1.txt': 'Hello, world\n', subdir: { 'file2.txt': 'Another file\n' } },
  };
  const owned = {
    'example.txt': `rw-rw-r-- ${ROOT}`,
    'new-dir': `rwxrwxr-x ${ROOT}`,
    'new-dir/file1.txt': `rw-rw-r-- ${ROOT}`,
    'new-dir/subdir': `rwxrwxr-x ${ROOT}`,
    'new-dir/subdir/file2.txt': `rw-rw-r-- ${ROOT}`,
  };

  KnowledgeMap.add({
    id: 'chmod',
    topic: 'linux',
    group: 'users',
    date: '2026-11-10',
    title: '权限数字：chmod 与运行脚本',
    summary: '用 4、2、1 算出权限数字，学会 chmod，并让自己写的脚本跑起来。',
    quiz: [
      { q: '`rwx------` 换成数字是多少？', hint: '输入三位数字', answer: '700', why: '拥有者 4 + 2 + 1 = 7，用户组和其他人都是 0。' },
      { q: '`rw-r--r--` 换成数字是多少？', hint: '输入三位数字', answer: '644', why: '拥有者 4 + 2 = 6，用户组 4，其他人 4。' },
      { q: '`x`（运行）这个权限是几分？', choices: ['4', '2', '1'], answer: 2, why: '`r` 是 4，`w` 是 2，`x` 是 1。' },
      { q: '要运行目前目录里的 `script.sh`，要输入什么？', answer: './script.sh', why: '`./` 代表「目前目录里的」。文件还要有 `x` 权限才跑得起来。' },
    ],
    sections: [
      {
        nav: '数字',
        kicker: '先学算法',
        title: '读 4、写 2、运行 1',
        lead: '`chmod` 是 change mode。最常见的写法是**三个数字**，依序给拥有者、用户组、其他人。',
        blocks: [
          { type: 'movie', film: 'chmod' },
          {
            type: 'analogy',
            span: 5,
            title: '每组三个开关',
            text: '读、写、运行是三个开关，分别值 4、2、1。打开的开关加起来，就是那一组的数字。三个数字刚好不会重复，所以任何组合都只有一种算法。',
          },
          {
            type: 'terms',
            span: 7,
            items: [
              ['`7` = 4+2+1', '`rwx`：读、写、运行都可以。'],
              ['`6` = 4+2', '`rw-`：读、写。'],
              ['`5` = 4+1', '`r-x`：读、运行。'],
              ['`4`', '`r--`：只能读。'],
              ['`0`', '`---`：什么都不行。'],
            ],
          },
        ],
      },
      {
        nav: 'chmod 700',
        kicker: '只给自己',
        title: 'chmod 700：只有拥有者能用',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls -l example.txt', out: '-rw-rw-r-- 1 root root 0 Nov 10 16:33 example.txt' },
              { cmd: 'sudo chmod 700 example.txt' },
              { cmd: 'ls -l', out: LS },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '700 拆开看',
            text: [
              '`7`：拥有者 `root` 可以读、写、运行。',
              '`0`、`0`：用户组和其他人**什么都不行**。',
              '`example.txt` 的主人已经是 `root`，所以要 `sudo` 才能改。现在连 `labex` 都读不到它了。',
            ],
          },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'mkdir test-dir' },
              { cmd: 'chmod 700 /home/labex/project/test-dir' },
              { cmd: 'ls -ld test-dir', out: 'drwx------ 2 labex labex 6 Nov 10 17:31 test-dir' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '目录也能设权限',
            text: [
              '`test-dir` 是 `labex` 自己建的，所以**不用 sudo**。',
              '路径写完整的绝对路径也可以。',
              '`ls -ld`：`-d` 只看目录本身，不列出里面的东西。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '目录的 r、w、x 意思不一样',
            text: '对目录来说，`r` 是可以列出里面有什么，`w` 是可以在里面添加或删除文件，`x` 是可以**进入**（`cd`）。`700` 代表只有你自己能进去。',
          },
          {
            type: 'run',
            title: '改权限：别人的文件和自己的目录',
            root: P,
            cwd: P,
            perms: true,
            tree: before,
            meta: owned,
            commands: [
              { cmd: 'sudo chmod 700 example.txt', note: '`7` 给拥有者全开，`0` `0` 给用户组和其他人全关。亮起来的是改变的字符。' },
              { cmd: 'ls -l', out: LS, note: '`example.txt` 变成 `-rwx------`。' },
              { cmd: 'mkdir test-dir', note: '新目录默认是 `rwxrwxr-x`，主人是 `labex`。' },
              { cmd: 'chmod 700 /home/labex/project/test-dir', note: '自己的目录，不用 `sudo`。用户组和其他人的权限全部关掉。' },
              { cmd: 'ls -ld test-dir', out: 'drwx------ 2 labex labex 6 Nov 10 17:31 test-dir', note: '`-d` 只看目录本身：`drwx------`。' },
            ],
          },
        ],
      },
      {
        nav: '运行脚本',
        kicker: '动手写',
        title: '写一个脚本，让它跑起来',
        lead: '脚本就是把命令写进文件，之后一次运行。新文件默认没有 `x`，要先给它运行权限。',
        blocks: [
          { type: 'movie', film: 'append' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: "echo '#!/bin/bash' > script.sh" },
              { cmd: 'echo \'echo "Hello, World"\' >> script.sh' },
              { cmd: 'cat script.sh', out: SCRIPT },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '这两行在做什么？',
            text: [
              '第一行 `#!/bin/bash` 告诉系统：用 bash 来运行这个文件。',
              '第二行就是要运行的命令。',
              '`>` 创建并写入，`>>` 接在最后面。',
            ],
          },
          { type: 'movie', film: 'exec' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: './script.sh', out: DENIED, err: true },
              { cmd: 'ls -la', out: LA },
              { cmd: 'sudo chmod 764 script.sh' },
              { cmd: './script.sh', out: 'Hello, World' },
              { cmd: 'ls -l script.sh', out: '-rwxrw-r-- 1 labex labex 32 Nov 10 17:47 script.sh' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '为什么一开始被拒绝？',
            text: [
              '新文件是 `-rw-rw-r--`，三组都**没有 `x`**。',
              '`764` 之后变成 `-rwxrw-r--`，拥有者有了 `x`，就能运行。',
            ],
          },
          {
            type: 'extra',
            title: '其实不需要 sudo',
            text: '`script.sh` 的主人是 `labex` 自己，直接 `chmod 764 script.sh` 就可以。只有改别人的文件时（像 `example.txt`）才需要 `sudo`。',
          },
          {
            type: 'extra',
            title: '`./` 不能省略',
            text: '只打 `script.sh`，Shell 会到系统放命令的文件夹去找，找不到。`./` 明确指出「目前目录里的这个文件」。',
          },
          {
            type: 'run',
            title: '从写脚本到运行成功',
            root: P,
            cwd: P,
            perms: true,
            tree: { ...before, 'test-dir': {} },
            meta: { ...owned, 'example.txt': `rwx------ ${ROOT}`, 'test-dir': 'rwx------ labex labex' },
            commands: [
              { cmd: "echo '#!/bin/bash' > script.sh", note: '`>` 创建 `script.sh`，写进第一行。' },
              { cmd: 'echo \'echo "Hello, World"\' >> script.sh', note: '`>>` 把第二行接在后面，第一行保留。' },
              { cmd: 'cat script.sh', out: SCRIPT, note: '确认内容：两行都在，共 32 字节。' },
              { cmd: './script.sh', out: DENIED, err: true, note: '权限是 `-rw-rw-r--`，**没有 `x`**，被拒绝运行。' },
              { cmd: 'ls -la', out: LA, note: '检查一下：`script.sh` 确实没有 `x`。' },
              { cmd: 'sudo chmod 764 script.sh', note: '`7` 拥有者 `rwx`、`6` 用户组 `rw-`、`4` 其他人 `r--`。拥有者多了 `x`。' },
              { cmd: './script.sh', out: 'Hello, World', note: '有了 `x`，脚本运行成功，印出 `Hello, World`。' },
              { cmd: 'ls -l script.sh', out: '-rwxrw-r-- 1 labex labex 32 Nov 10 17:47 script.sh', note: '最后确认权限：`-rwxrw-r--`。' },
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
            type: 'recap',
            items: [
              '读 `4`、写 `2`、运行 `1`，每组加起来就是一位数字。',
              '`chmod 764`：拥有者 `rwx`、用户组 `rw-`、其他人 `r--`。',
              '`chmod 700`：只有拥有者能用。',
              '改别人的文件要 `sudo`，改自己的不用。',
              '脚本要有 `x` 才能用 `./脚本名称` 运行。',
            ],
          },
        ],
      },
    ],
  });
})();
