(function () {
  const P = '/home/labex/project';
  const AT_P = 'labex:project/ $';
  const AT_PX = 'labex:phoenix_project/ $';
  const AT_LOG = 'labex:logs/ $';
  const LSL = [
    'total 4',
    '-rw-rw-r-- 1 labex labex 31 Nov 15 20:38 README.md',
    'drwxrwxr-x 2 labex labex  6 Nov 15 20:43 config',
    '-rw-rw-r-- 1 labex labex  0 Nov 15 20:38 config.json',
    'drwxrwxr-x 2 labex labex  6 Nov 15 20:43 docs',
    '-rw-rw-r-- 1 labex labex  0 Nov 15 20:38 main_app.py',
    'drwxrwxr-x 2 labex labex  6 Nov 15 20:43 src',
  ].join('\n');
  const TREE = '.\n|-- config\n|   `-- config.json\n|-- docs\n|   `-- README.md\n`-- src\n    `-- main_app.py\n\n3 directories, 3 files';
  const BAK = 'total 0\n-rw-rw-r-- 1 labex labex 0 Nov 15 20:38 config.json\n-rw-rw-r-- 1 labex labex 0 Nov 15 20:55 config.json.bak';
  const LOGS1 = [
    'total 4',
    '-rw-rw-r-- 1 labex labex   0 Nov 15 20:38 app_2023-01-15.log',
    '-rw-rw-r-- 1 labex labex   0 Nov 15 20:38 app_2024-05-01.log',
    '-rw-rw-r-- 1 labex labex   0 Nov 15 20:38 db_2023-02-20.log',
    '-rw-rw-r-- 1 labex labex 143 Nov 15 21:01 old_logs.tar.gz',
  ].join('\n');
  const LOGS2 = 'total 4\n-rw-rw-r-- 1 labex labex   0 Nov 15 20:38 app_2024-05-01.log\n-rw-rw-r-- 1 labex labex 143 Nov 15 21:01 old_logs.tar.gz';
  const LIST = 'app_2023-01-15.log\ndb_2023-02-20.log';

  KnowledgeMap.add({
    id: 'organize-project',
    topic: 'linux',
    group: 'move',
    date: '2026-11-15',
    title: '实战：整理 phoenix 项目，打包旧记录',
    summary: '用 mkdir、mv 把散乱的文件分类归位，用 tree 检查，cp 留备份，最后用 tar 把旧记录打包再删除。',
    quiz: [
      { q: '在 `phoenix_project` 里，一次创建 `src`、`config`、`docs` 三个目录，要打什么？', answer: ['mkdir src config docs'], why: '`mkdir` 后面可以接好几个名字，一次全部建好。' },
      { q: '`mv shared_docs ~/project/phoenix_project/docs/` 运行完，`shared_docs` 会在哪里？', choices: ['被改名成 docs', '变成 docs 里面的 shared_docs', '被复制一份到 docs'], answer: 1, why: '目的地 `docs/` 是已经存在的目录，所以整个 `shared_docs` 被搬进去，变成 `docs/shared_docs`。' },
      { q: '`*_2023-*.log` 会符合下面哪一个文件名？', choices: ['app_2024-05-01.log', 'db_2023-02-20.log', 'old_logs.tar.gz'], answer: 1, why: '`*` 代表任何字。样式要求中间有 `_2023-`、结尾是 `.log`，只有 `db_2023-02-20.log` 符合。' },
      { q: '不解开 `old_logs.tar.gz`，只想看里面装了哪些文件，要打什么？', answer: ['tar -tzf old_logs.tar.gz', 'tar -tf old_logs.tar.gz', 'tar tzf old_logs.tar.gz'], why: '`-t` 是列出清单。`-z` 告诉它这是 gzip 压缩过的，`-f` 后面接文件名。' },
      { q: '`tar -czf old_logs.tar.gz …` 的 `-f` 为什么一定要放在最后？', choices: ['因为 f 后面要紧接着压缩包的名字', '因为 f 代表 force，要最后才生效', '没有规定，放哪里都可以'], answer: 0, why: '`-f` 会把**紧接在后面的那个字**当成压缩包的名字。写成 `-cfz` 的话，它会以为压缩包叫 `z`。' },
    ],
    sections: [
      {
        nav: '现况',
        kicker: '开始之前',
        title: '一个散乱的项目目录',
        lead: '`phoenix_project` 里的文件全部挤在同一层。旁边还有一个要并进来的 `shared_docs`，以及一堆新旧混在一起的日志文件。',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: AT_P,
            lines: [
              { cmd: 'ls', out: 'logs  phoenix_project  shared_docs' },
              { cmd: 'cd phoenix_project' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '要做的事',
            text: [
              '程序放 `src`、设置放 `config`、文档放 `docs`。',
              '改设置之前先留一份备份。',
              '2023 年的旧记录打包保存，再从文件夹里删掉。',
            ],
          },
        ],
      },
      {
        nav: '建目录',
        kicker: '分类',
        title: '一次建好三个目录',
        lead: '`mkdir` 后面可以接好几个名字，用空白隔开，一次全部建好。',
        blocks: [
          {
            type: 'terminal',
            span: 12,
            prompt: AT_PX,
            lines: [
              { cmd: 'mkdir src config docs' },
              { cmd: 'ls -l', out: LSL },
            ],
          },
          {
            type: 'text',
            title: '怎么分辨哪些是目录',
            text: [
              '看每一行的**第一个字符**：`d` 是目录，`-` 是一般文件。',
              '新建的 `config`、`docs`、`src` 都是 `d` 开头。',
            ],
          },
          {
            type: 'extra',
            title: '目录的大小为什么是 6',
            text: '目录的「大小」不是里面文件加起来的大小，而是目录自己那张名单占的空间。空目录的数字很小，不同系统会显示不同的值，不用在意。',
          },
        ],
      },
      {
        nav: '归位',
        kicker: '搬家',
        title: '把每个文件搬进它的目录',
        lead: '三次 `mv`，用了两种写目的地的方法：完整路径，以及用 `~` 开头的路径。',
        blocks: [
          {
            type: 'terminal',
            span: 12,
            prompt: AT_PX,
            lines: [
              { cmd: 'mv main_app.py /home/labex/project/phoenix_project/src' },
              { cmd: 'mv config.json ~/project/phoenix_project/config' },
              { cmd: 'mv README.md ~/project/phoenix_project/docs' },
            ],
          },
          {
            type: 'text',
            title: '`~` 是家目录的简写',
            text: [
              '`~` 就是 `/home/labex`，所以 `~/project/phoenix_project/config` 和完整路径指的是同一个地方。',
              '目的地是**已经存在的目录**，所以文件会被放进去，名字不变。',
            ],
          },
          {
            type: 'analogy',
            title: '收拾房间',
            text: '先把三个收纳箱摆好、粘贴标签，再把地上的东西一件一件放进对应的箱子。顺序反过来就会手忙脚乱。',
          },
        ],
      },
      {
        nav: 'tree',
        kicker: '检查',
        title: 'tree：把整个项目画成一张图',
        lead: '`ls` 一次只看一层。`tree` 会一层一层往下走，把每个目录里的东西都画出来。',
        blocks: [
          { type: 'movie', film: 'tree' },
          {
            type: 'terminal',
            span: 6,
            prompt: AT_PX,
            lines: [{ cmd: 'tree', out: TREE }],
          },
          {
            type: 'terms',
            span: 6,
            title: '这张图怎么看',
            items: [
              ['`.`', '最上面的点是「目前所在的目录」，也就是 `phoenix_project`。'],
              ['`|--`', '这一层还有下一个项目。'],
              ['反引号加 `--`', '这一层的最后一个项目。'],
              ['`|   `', '往下延伸的直线，表示外面那一层还没结束。'],
              ['`3 directories, 3 files`', '总共几个目录、几个文件。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '不是每台机器都有 `tree`',
            text: 'LabEx 的环境已经装好了。自己的 Ubuntu 如果出现 `command not found`，要先用 `sudo apt install tree` 安装。',
          },
        ],
      },
      {
        nav: '备份',
        kicker: '保险',
        title: '改设置之前，先留一份 .bak',
        lead: '在原本的文件名后面加上 `.bak`（backup），是最常见的备份命名方式。',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: AT_PX,
            lines: [
              { cmd: 'cp config/config.json config/config.json.bak' },
              { cmd: 'ls -l config', out: BAK },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '看时间就知道谁是新的',
            text: [
              '原本的 `config.json` 时间是 `20:38`，备份是 `20:55`，也就是运行 `cp` 的那一刻。',
              '`cp` 做出来的是一个**新文件**，所以时间是新的。',
            ],
          },
        ],
      },
      {
        nav: '搬目录',
        kicker: '整并',
        title: '把整个 shared_docs 搬进 docs',
        lead: '`mv` 搬目录不需要 `-r`，整个目录连同里面的东西会一起过去。',
        blocks: [
          {
            type: 'terminal',
            span: 12,
            prompt: AT_PX,
            lines: [
              { cmd: 'cd ..' },
              { cmd: 'ls', out: 'logs  phoenix_project  shared_docs', prompt: AT_P },
              { cmd: 'mv shared_docs ~/project/phoenix_project/docs/', prompt: AT_P },
              { cmd: 'ls ~/project/phoenix_project/docs/shared_docs/', out: 'api_spec.doc  team_guidelines.txt', prompt: AT_P },
            ],
          },
          {
            type: 'text',
            title: '`cp` 要 `-r`，`mv` 不用',
            text: [
              '`cp` 要把每个文件都重新做一份，所以得明确告诉它「连里面一起」。',
              '`mv` 在同一颗硬盘里只是改名单上的位置，目录里的东西自然跟着走。',
            ],
          },
          {
            type: 'text',
            title: '结尾的 `/` 有什么用',
            text: '`docs/` 结尾的斜线是在说「这是一个目录」。如果 `docs` 不存在，有斜线会直接报错；没有斜线的话，`shared_docs` 会被**改名**成 `docs`。',
          },
        ],
      },
      {
        nav: '通配符',
        kicker: '一次选很多个',
        title: '`*` 让你不用一个一个打文件名',
        lead: '`*_2023-*.log` 是一个样式，意思是「中间有 `_2023-`、结尾是 `.log` 的所有文件」。',
        blocks: [
          { type: 'movie', film: 'glob' },
          {
            type: 'terms',
            title: '`*_2023-*.log` 拆开来看',
            items: [
              ['`*`', '任何长度的任何字，也可以是零个字。这里会对上 `app` 或 `db`。'],
              ['`_2023-`', '一定要刚好出现这几个字。'],
              ['`*`', '再一次任意字，这里会对上月份和日期 `01-15`。'],
              ['`.log`', '结尾一定要是 `.log`。'],
            ],
          },
          {
            type: 'text',
            title: '是 Shell 在找，不是命令在找',
            text: [
              '按下 Enter 后，Shell 会先把样式换成符合的文件名，**再**交给 `tar` 或 `rm`。',
              '所以任何命令都能用 `*`，命令本身甚至不知道你用过它。',
            ],
          },
          {
            type: 'extra',
            title: '另一个通配符：`?`',
            text: '`?` 只代表**一个**任意字符。例如 `app_2023-0?-15.log` 可以对上 1 到 9 月的 15 号。',
          },
        ],
      },
      {
        nav: '打包',
        kicker: '封存',
        title: 'tar：先打包，确认之后才删',
        lead: '旧记录不想留在文件夹里，但又可能要查。先用 `tar` 打包成一个压缩包，再删掉原本的文件。',
        blocks: [
          { type: 'movie', film: 'tar' },
          {
            type: 'terminal',
            span: 12,
            prompt: AT_P,
            lines: [
              { cmd: 'cd logs' },
              { cmd: 'tar -czf old_logs.tar.gz *_2023-*.log', prompt: AT_LOG },
              { cmd: 'ls -l', out: LOGS1, prompt: AT_LOG },
              { cmd: 'rm *_2023-*.log', prompt: AT_LOG },
              { cmd: 'ls -l', out: LOGS2, prompt: AT_LOG },
              { cmd: 'tar -tzf old_logs.tar.gz', out: LIST, prompt: AT_LOG },
            ],
          },
          {
            type: 'terms',
            title: '`tar -czf` 的三个字母',
            items: [
              ['`-c`', 'create：创建一个新的压缩包。'],
              ['`-z`', '用 gzip 压缩。所以文件名惯例是 `.tar.gz`。'],
              ['`-f`', 'file：后面**紧接着**的就是压缩包的名字，所以 `f` 要放最后。'],
              ['`-t`', 'list：列出里面装了什么，不会解开。'],
            ],
          },
          {
            type: 'text',
            title: '`tar` 是复制，不是搬走',
            text: '打包完再 `ls -l`，两个 2023 的文件还在。`tar` 只是把它们**复制一份**装进箱子，原本的要自己用 `rm` 删。',
          },
          {
            type: 'run',
            title: '一步一步看整个项目怎么整理好',
            root: P,
            cwd: P,
            tree: {
              logs: { 'app_2023-01-15.log': '', 'app_2024-05-01.log': '', 'db_2023-02-20.log': '' },
              phoenix_project: { 'README.md': null, 'config.json': '', 'main_app.py': '' },
              shared_docs: { 'api_spec.doc': '', 'team_guidelines.txt': '' },
            },
            commands: [
              { cmd: 'ls', out: 'logs  phoenix_project  shared_docs', note: '三个目录。要整理的是 `phoenix_project`。' },
              { cmd: 'cd phoenix_project', note: '走进项目目录。' },
              { cmd: 'mkdir src config docs', note: '一次建好三个目录。' },
              { cmd: 'mv main_app.py /home/labex/project/phoenix_project/src', note: '程序搬进 `src`，用的是完整路径。' },
              { cmd: 'mv config.json ~/project/phoenix_project/config', note: '设置搬进 `config`。`~` 是 `/home/labex`。' },
              { cmd: 'mv README.md ~/project/phoenix_project/docs', note: '说明文档搬进 `docs`。' },
              { cmd: 'tree', out: TREE, note: '整个项目一层一层画出来，每个文件都在该在的地方。' },
              { cmd: 'cp config/config.json config/config.json.bak', note: '改设置之前，先留一份 `.bak` 备份。' },
              { cmd: 'cd ..', note: '回到上一层。' },
              { cmd: 'mv shared_docs ~/project/phoenix_project/docs/', note: '整个 `shared_docs` 连内容一起搬进 `docs`。' },
              { cmd: 'cd logs', note: '接着处理日志文件。' },
              { cmd: 'tar -czf old_logs.tar.gz *_2023-*.log', note: '`*_2023-*.log` 点名出两个文件，各复制一份装进 `old_logs.tar.gz`。' },
              { cmd: 'rm *_2023-*.log', note: '确定打包好了，才删掉原本的旧记录。' },
              { cmd: 'tar -tzf old_logs.tar.gz', out: LIST, note: '不用解开，就能确认两个旧记录都在箱子里。' },
            ],
          },
        ],
      },
      {
        nav: '总结',
        kicker: '回顾',
        title: '这一篇学到的',
        blocks: [
          {
            type: 'terms',
            items: [
              ['`mkdir a b c`', '一次创建好几个目录。'],
              ['`mv 文件 目录`', '目的地是已存在的目录，就把文件放进去。'],
              ['`mv 目录 目录/`', '搬整个目录不需要 `-r`。'],
              ['`tree`', '把目录画成树状图，最后算出总数。'],
              ['`cp 文件 文件.bak`', '改之前先留一份备份。'],
              ['`*`', '通配符：代表任何长度的任何字。'],
              ['`tar -czf 箱子.tar.gz 文件…`', '打包并压缩。'],
              ['`tar -tzf 箱子.tar.gz`', '列出压缩包里有什么。'],
            ],
          },
          {
            type: 'recap',
            items: [
              '先建好目录，再把文件搬进去。',
              '`~` 是家目录的简写，`~/project` 等于 `/home/labex/project`。',
              '`*` 是 Shell 先换成文件名，再交给命令。',
              '`tar` 是复制进箱子，原本的文件要自己删。',
              '先打包、确认，最后才删。',
            ],
          },
        ],
      },
    ],
  });
})();
