(function () {
  const P = '/home/labex/project';
  const PROMPT = 'labex:project/ $';
  const LA = [
    'total 4',
    'drwxr-xr-x 1 labex labex   25 Nov 10 16:33 .',
    'drwxr-x--- 1 labex labex 4096 Nov 10 16:33 ..',
    '-rw-rw-r-- 1 labex labex    0 Nov 10 16:33 example.txt',
  ].join('\n');
  const L1 = '-rw-rw-r-- 1 labex labex 0 Nov 10 16:33 example.txt';
  const L2 = '-rw-rw-r-- 1 root root 0 Nov 10 16:33 example.txt';
  const LR = [
    'new-dir:',
    'total 4',
    '-rw-rw-r-- 1 labex labex 13 Nov 10 16:57 file1.txt',
    'drwxrwxr-x 2 labex labex 23 Nov 10 16:59 subdir',
    '',
    'new-dir/subdir:',
    'total 4',
    '-rw-rw-r-- 1 labex labex 13 Nov 10 16:59 file2.txt',
  ].join('\n');

  KnowledgeMap.add({
    id: 'owner-chown',
    topic: 'linux',
    group: 'users',
    date: '2026-11-10',
    title: '文件的主人：读懂权限，用 chown 过户',
    summary: '看懂 ls -l 开头那串 -rw-rw-r--，再用 sudo chown 把文件和整个文件夹换给别的用户。',
    quiz: [
      { q: '`-rw-rw-r--` 的第 1 格 `-` 代表什么？', choices: ['这是一般文件', '这是目录', '没有任何权限'], answer: 0, why: '第 1 格是类型：`-` 是一般文件，`d` 是目录。' },
      { q: '把 `example.txt` 的拥有者和用户组都换成 `root`，要输入什么？', answer: 'sudo chown root:root example.txt', why: '冒号前是拥有者，冒号后是用户组。把文件给别人需要 `sudo`。' },
      { q: '要连目录里的所有东西一起过户，`chown` 要加哪个选项？', choices: ['`-a`', '`-R`', '`-i`'], answer: 1, why: '`-R` 是递归，目录里的每一层都会一起换。' },
      { q: '权限是 `rw-rw-r--` 的文件，「其他人」可以做什么？', choices: ['可以读也可以写', '什么都不能做', '只能读'], answer: 2, why: '最后三格 `r--` 是其他人的权限，只有 `r`。' },
    ],
    sections: [
      {
        nav: '权限字符串',
        kicker: '先看懂',
        title: '读懂 -rw-rw-r--',
        lead: '每个文件都记着两件事：**谁是主人**，以及**谁可以做什么**。用 `ls -l` 就看得到。',
        blocks: [
          { type: 'movie', film: 'perm' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'touch example.txt' },
              { cmd: 'ls -la', out: LA },
              { cmd: 'ls -l example.txt', out: L1 },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '一行拆成这几栏',
            text: [
              '`-rw-rw-r--`：类型，加上三组权限。',
              '`1`：链接数，先不用管。',
              '`labex labex`：前面是**拥有者**，后面是**用户组**。',
              '`0`：大小。刚用 `touch` 创建，所以是空的。',
            ],
          },
          {
            type: 'terms',
            items: [
              ['`r` read', '可以读内容。'],
              ['`w` write', '可以修改内容。'],
              ['`x` execute', '可以当成程序运行。'],
              ['拥有者', '文件的主人，通常是创建它的人。'],
              ['用户组', '一群用户，同用户组的人共用这组权限。'],
              ['其他人', '不是拥有者、也不在用户组里的所有人。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '`.` 和 `..` 开头是 d',
            text: '`ls -la` 多列出了 `.`（目前目录）和 `..`（上一层）。它们的第 1 格是 `d`，代表目录。最上面的 `total 4` 是这些项目占用的磁盘区块数，初学先不用管。',
          },
        ],
      },
      {
        nav: 'chown',
        kicker: '换主人',
        title: 'chown：把文件过户给别人',
        lead: '`chown` 是 change owner，写法是 `chown 拥有者:用户组 文件`。',
        blocks: [
          { type: 'movie', film: 'chown' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo chown root:root example.txt' },
              { cmd: 'ls -l example.txt', out: L2 },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '发生了什么？',
            text: [
              '拥有者和用户组都从 `labex` 变成 `root`。',
              '权限 `-rw-rw-r--` **没有变**，换的只是主人。',
            ],
          },
          {
            type: 'extra',
            title: '为什么要加 sudo？',
            text: '一般用户不能把文件送给别人，否则就能把东西塞到别人名下。`sudo` 是「用管理员身分运行」，只有被允许的账号能用。还记得 `id` 里的 `27(sudo)` 用户组吗？就是这个权限。',
          },
          {
            type: 'extra',
            title: '只换其中一个也可以',
            text: '`chown root example.txt` 只换拥有者，用户组不变；`chown :root example.txt` 只换用户组。',
          },
          {
            type: 'run',
            title: '创建文件，再过户给 root',
            root: P,
            cwd: P,
            perms: true,
            tree: {},
            commands: [
              { cmd: 'touch example.txt', note: '创建空文件。新文件的主人是创建它的 `labex`。' },
              { cmd: 'ls -la', out: LA, note: '`-l` 看详细数据，`-a` 连 `.` 和 `..` 也列出来。' },
              {
                cmd: 'ls -l example.txt',
                out: L1,
                note: '只看这一个文件。把这一行拆开来看。',
                info: {
                  title: '-rw-rw-r-- 1 labex labex 0 …',
                  icon: 'file',
                  rows: [
                    ['类型', '-', '一般文件（目录是 d）'],
                    ['拥有者权限', '!rw-', '读、写'],
                    ['用户组权限', 'rw-', '读、写'],
                    ['其他人权限', 'r--', '只能读'],
                    ['拥有者', '!labex'],
                    ['用户组', 'labex'],
                    ['大小', '0', '字节'],
                  ],
                },
              },
              { cmd: 'sudo chown root:root example.txt', note: '用管理员身分，把拥有者和用户组都换成 `root`。亮起来的是变动的字段。' },
              { cmd: 'ls -l example.txt', out: L2, note: '确认：主人换成 `root`，权限没变。' },
            ],
          },
        ],
      },
      {
        nav: 'mkdir -p',
        kicker: '准备文件夹',
        title: '一次建好多层文件夹',
        lead: '要练习整个文件夹过户，先做一个有内容的 `new-dir`。',
        blocks: [
          { type: 'movie', film: 'mkdirp' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'mkdir -p new-dir/subdir' },
              { cmd: 'echo "Hello, world" > new-dir/file1.txt' },
              { cmd: 'echo "Another file" > new-dir/subdir/file2.txt' },
              { cmd: 'ls -lR new-dir', out: LR },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '两个新选项',
            text: [
              '`-p`（parents）：中间缺的目录自动创建。',
              '`-R`（Recursive）：先列 `new-dir`，再进去列 `new-dir/subdir`，每一段开头都标出目录名称。',
              '`file1.txt` 是 13 字节：`Hello, world` 12 个字符，加上结尾的换行。',
            ],
          },
        ],
      },
      {
        nav: 'chown -R',
        kicker: '整间过户',
        title: 'chown -R：连同里面一起换',
        lead: '只换文件夹本身不够，里面的文件还是 `labex` 的。加上 `-R` 才会一路换到底。',
        blocks: [
          { type: 'movie', film: 'chownr' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [{ cmd: 'sudo chown -R root:root new-dir' }],
          },
          {
            type: 'text',
            span: 5,
            title: '怎么确认？',
            text: '再跑一次 `ls -lR new-dir`，每一行的拥有者和用户组都会变成 `root`。',
          },
          {
            type: 'run',
            title: '建好文件夹，再整间过户',
            root: P,
            cwd: P,
            perms: true,
            tree: { 'example.txt': '' },
            meta: { 'example.txt': 'rw-rw-r-- root root' },
            commands: [
              { cmd: 'mkdir -p new-dir/subdir', note: '`new-dir` 不存在，`-p` 先把它建好，再建 `subdir`。两层一起出现。' },
              { cmd: 'echo "Hello, world" > new-dir/file1.txt', note: '`>` 把文本写进新文件。' },
              { cmd: 'echo "Another file" > new-dir/subdir/file2.txt', note: '路径可以一路写到子文件夹里。' },
              { cmd: 'ls -lR new-dir', out: LR, note: '`-R` 一层一层往下列。现在每一个的主人都是 `labex`。' },
              { cmd: 'sudo chown -R root:root new-dir', note: '`-R` 从 `new-dir` 开始往下，**四个项目全部**换成 `root`。' },
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
              '`ls -l` 开头 10 格：1 格类型，加上拥有者、用户组、其他人各 3 格。',
              '`r` 读、`w` 写、`x` 运行，`-` 代表没有。',
              '`sudo chown 拥有者:用户组 文件` 换主人。',
              '`-R` 连同文件夹里的所有东西一起换。',
              '`mkdir -p` 一次建好多层目录，`ls -R` 一层层列出。',
            ],
          },
        ],
      },
    ],
  });
})();
