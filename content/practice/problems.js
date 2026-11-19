// 练习场题库：把学过的东西串起来，在模拟终端机里作答，按「提交」自动检查
//
// 格式：
//   KnowledgeMap.problem({
//     id, title,
//     level: 1 | 2 | 3,             简单、中等、困难
//     topic: 'linux' | 'shell-script' | 'python',
//     uses: ['文章 id', …],          这题用到哪几篇（题目页会链接过去）
//     story: '情境，一两句',
//     setup: { tree, meta, users, groups, abs, cwd },   起始的文件（tree 放在 /home/labex/project 底下）
//     checks: [{ say: '要求', …条件 }],   条件写法见 js/shell.js 的 judge
//     hints: ['提示一', '提示二'],     一次打开一条
//     answer: ['命令', { edit: '文件', text: '内容' }, …],   参考解答；加载时会自动跑一次，确认真的能通过
//     why: ['解说', …],
//   })
// 题号就是这里的顺序。新题接在同一主题的最后面。
(function () {
  const P = KnowledgeMap.problem.bind(KnowledgeMap);

  // Linux 基础 ===============================================================
  P({
    id: 'report-in',
    title: '报上名来',
    level: 1,
    topic: 'linux',
    uses: ['linux-first-commands', 'create-and-list'],
    story: '新机器要你登记身分。把「目前的用户名」存进 `me.txt`，再把 `id` 的完整结果存进 `id.txt`。',
    setup: { tree: {} },
    checks: [
      { say: '`me.txt` 里只有一行：目前的用户名', file: 'me.txt', content: 'labex\n' },
      { say: '`id.txt` 里是 `id` 的完整结果', file: 'id.txt', same: 'id' },
    ],
    hints: ['哪个命令会印出「我是谁」？第一篇学过两个。', '`命令 > 文件` 会把本来印在画面上的字存进文件。'],
    answer: ['whoami > me.txt', 'id > id.txt'],
    why: [
      '`whoami` 只印用户名，`id` 印出 UID、GID 和所有用户组。',
      '`>` 是导向：输出不印在画面上，改存进文件。文件不存在会自动建立。',
    ],
  });

  P({
    id: 'notebook-shelf',
    title: '搭好笔记本的架子',
    level: 1,
    topic: 'linux',
    uses: ['create-and-list', 'owner-chown'],
    story: '要一个放笔记的地方：`notes/2026/11` 三层目录，还有一份 `notes/readme.txt`，内容是 `My notes`。',
    setup: { tree: {} },
    checks: [
      { say: '有 `notes/2026/11` 这个目录', dir: 'notes/2026/11' },
      { say: '`notes/readme.txt` 的内容是 `My notes`', file: 'notes/readme.txt', content: 'My notes\n' },
    ],
    hints: ['一次建好好几层目录，`mkdir` 要加一个选项。', '`echo "文字" > 文件` 可以建立一个有内容的文件。'],
    answer: ['mkdir -p notes/2026/11', 'echo "My notes" > notes/readme.txt'],
    why: [
      '`mkdir -p` 会把路上缺的目录一起建好；不加 `-p`，`notes` 还不存在时会出现 `No such file or directory`。',
      '`echo` 会在最后补一个换行，所以文件内容是 `My notes` 加换行。',
    ],
  });

  P({
    id: 'hidden-key',
    title: '找出藏起来的钥匙',
    level: 1,
    topic: 'linux',
    uses: ['create-and-list', 'read-and-compare'],
    story: '`vault` 里藏了一个钥匙文件，直接 `ls` 看不到。找到它，把里面的密码原样存进 `answer.txt`。',
    setup: {
      tree: {
        vault: {
          'readme.txt': 'Nothing to see here.\n',
          'decoy.txt': 'WRONG-KEY\n',
          '.key_7f3': 'OPEN-SESAME-42\n',
        },
      },
    },
    checks: [
      { say: '`answer.txt` 的内容和钥匙文件一模一样', file: 'answer.txt', content: 'OPEN-SESAME-42\n' },
      { say: '钥匙文件还留在 `vault` 里', file: 'vault/.key_7f3' },
    ],
    hints: ['名字以 `.` 开头的文件是隐藏文件，`ls` 要加什么选项才看得到？', '看到名字之后，可以用 `cat 文件 > answer.txt`，也可以用 `cp`。'],
    answer: ['ls -a vault', 'cat vault/.key_7f3 > answer.txt'],
    why: [
      '`ls -a` 连 `.` 开头的隐藏文件都列出来。',
      '`cat 文件 > answer.txt` 和 `cp 文件 answer.txt` 结果一样；题目要求钥匙留在原处，所以不能用 `mv`。',
    ],
  });

  P({
    id: 'backup-first',
    title: '改版前先备份',
    level: 1,
    topic: 'linux',
    uses: ['copy-and-move'],
    story: '要动 `config.json` 之前先留一份备份 `config.json.bak`；草稿 `draft.txt` 已经定稿，改名叫 `final.txt`。',
    setup: {
      tree: {
        'config.json': '{ "port": 8080 }\n',
        'draft.txt': 'Chapter 1: The Terminal\n',
      },
    },
    checks: [
      { say: '有 `config.json.bak`，内容和 `config.json` 一样', file: 'config.json.bak', content: '{ "port": 8080 }\n' },
      { say: '`config.json` 还在原处', file: 'config.json', content: '{ "port": 8080 }\n' },
      { say: '`draft.txt` 改名成 `final.txt`，内容不变', file: 'final.txt', content: 'Chapter 1: The Terminal\n' },
      { say: '已经没有 `draft.txt`', gone: 'draft.txt' },
    ],
    hints: ['备份要「复制」，改名要「搬家」。', '`cp 来源 目的`、`mv 旧名 新名`。'],
    answer: ['cp config.json config.json.bak', 'mv draft.txt final.txt'],
    why: [
      '`cp` 复制之后原本的还在，适合备份。',
      '`mv` 在同一个目录里搬家，就等于改名。',
    ],
  });

  P({
    id: 'clear-temp',
    title: '清掉暂存区',
    level: 1,
    topic: 'linux',
    uses: ['copy-and-move', 'delete-files'],
    story: '`tmp_area` 整个要删掉，但里面的 `keep.txt` 要留下，放到 `project` 底下。',
    setup: {
      tree: {
        tmp_area: {
          'keep.txt': 'important!\n',
          'old.txt': 'old stuff\n',
          cache: { 'a.bin': 'xxxx\n', 'b.bin': 'yyyy\n' },
          empty_dir: {},
        },
      },
    },
    checks: [
      { say: '`keep.txt` 在 `project` 底下，内容不变', file: 'keep.txt', content: 'important!\n' },
      { say: '`tmp_area` 整个不见了', gone: 'tmp_area' },
    ],
    hints: ['先把要留的搬出来，再删。顺序反过来就救不回来了。', '删除有东西的目录，`rm` 要加 `-r`。'],
    answer: ['mv tmp_area/keep.txt .', 'rm -r tmp_area'],
    why: [
      '`.` 代表目前的目录，`mv tmp_area/keep.txt .` 就是搬到这里来。',
      '`rmdir` 只能删空目录；有东西的要用 `rm -r`，连里面的一起删。',
    ],
  });

  P({
    id: 'sort-downloads',
    title: '整理下载文件夹',
    level: 2,
    topic: 'linux',
    uses: ['create-and-list', 'copy-and-move', 'delete-files', 'organize-project'],
    story: '`downloads` 乱成一团。图片（`.jpg`、`.png`）放进 `downloads/images`，文本（`.txt`）放进 `downloads/docs`，`.tmp` 全部删掉，`setup.log` 留在原处。',
    setup: {
      tree: {
        downloads: {
          'a.jpg': 'img\n', 'b.jpg': 'img\n', 'c.png': 'img\n',
          'notes.txt': 'notes\n', 'todo.txt': 'todo\n',
          'setup.log': 'ok\n', 'x.tmp': '', 'y.tmp': '',
        },
      },
    },
    checks: [
      { say: '`images` 里刚好是 `a.jpg`、`b.jpg`、`c.png`', dir: 'downloads/images', kids: ['a.jpg', 'b.jpg', 'c.png'] },
      { say: '`docs` 里刚好是 `notes.txt`、`todo.txt`', dir: 'downloads/docs', kids: ['notes.txt', 'todo.txt'] },
      { say: '`.tmp` 文件都删掉了', test: (sh) => !Object.keys(sh.files).some((p) => p.endsWith('.tmp')) },
      { say: '`downloads` 底下只剩 `docs`、`images`、`setup.log`', dir: 'downloads', kids: ['docs', 'images', 'setup.log'] },
    ],
    hints: ['先 `cd downloads`，路径会短很多。', '`*` 是通配符：`*.jpg` 代表所有 `.jpg` 结尾的文件。`mv` 后面可以放好几个来源，最后一个是目的地。'],
    answer: ['cd downloads', 'mkdir images docs', 'mv *.jpg *.png images/', 'mv *.txt docs/', 'rm *.tmp'],
    why: [
      '`mkdir` 后面接几个名字就建几个目录。',
      'Shell 会先把 `*.jpg` 换成所有符合的文件名，再交给 `mv`。',
      '在 zsh 里，`*.tmp` 一个都找不到时会出现 `no matches found`，命令不会运行。',
    ],
  });

  P({
    id: 'manuscript-diff',
    title: '稿件改了哪里',
    level: 2,
    topic: 'linux',
    uses: ['read-and-compare', 'manuscript-challenge'],
    story: '编辑寄回第二版稿件。把两版的差异存成 `changes.txt`，第二版的最后一行存成 `ending.txt`，第一版的前两行存成 `opening.txt`。',
    setup: {
      tree: {
        'draft_v1.txt': 'Once upon a time,\nthere was a shell.\nIt ran commands.\nThe end.\n',
        'draft_v2.txt': 'Once upon a time,\nthere was a shell named zsh.\nIt ran commands.\nIt also ran scripts.\nThe end, for now.\n',
      },
    },
    checks: [
      { say: '`changes.txt` 是 `diff draft_v1.txt draft_v2.txt` 的结果', file: 'changes.txt', same: 'diff draft_v1.txt draft_v2.txt' },
      { say: '`ending.txt` 是第二版的最后一行', file: 'ending.txt', content: 'The end, for now.\n' },
      { say: '`opening.txt` 是第一版的前两行', file: 'opening.txt', content: 'Once upon a time,\nthere was a shell.\n' },
    ],
    hints: ['比较两个文件用 `diff 旧 新`。', '`head -n 2` 取前两行，`tail -n 1` 取最后一行，再用 `>` 存起来。'],
    answer: ['diff draft_v1.txt draft_v2.txt > changes.txt', 'tail -n1 draft_v2.txt > ending.txt', 'head -n2 draft_v1.txt > opening.txt'],
    why: [
      '`diff` 的 `2c2` 代表第 2 行被改掉，`3a4` 代表在第 3 行后面加了第 4 行。`<` 是旧的，`>` 是新的。',
      '`head` 从头取、`tail` 从尾取，`-n` 后面是行数。',
    ],
  });

  P({
    id: 'log-alerts',
    title: '日志里的警报',
    level: 2,
    topic: 'linux',
    uses: ['troubleshoot', 'read-and-compare'],
    story: '把 `logs/app.log` 里所有 `ERROR` 的行存进 `alerts.txt`，再把所有 `WARN` 的行接在后面。大小写要完全一样。',
    setup: {
      tree: {
        logs: {
          'app.log': [
            '09:00 INFO server started',
            '09:05 WARN disk 80% full',
            '09:12 ERROR cannot open config.json',
            '09:20 INFO user labex logged in',
            '09:31 error retry ok',
            '09:40 ERROR database timeout',
            '09:55 WARN memory high',
            '',
          ].join('\n'),
        },
      },
    },
    checks: [
      {
        say: '`alerts.txt` 先是两行 ERROR，再是两行 WARN',
        file: 'alerts.txt',
        lines: ['09:12 ERROR cannot open config.json', '09:40 ERROR database timeout', '09:05 WARN disk 80% full', '09:55 WARN memory high'],
      },
    ],
    hints: ['`grep 文字 文件` 只印出有那段文字的行。', '第一次用 `>` 建立文件，第二次要用 `>>` 接在后面，不然会把 ERROR 盖掉。'],
    answer: ['grep ERROR logs/app.log > alerts.txt', 'grep WARN logs/app.log >> alerts.txt'],
    why: [
      '`grep` 默认分大小写，所以小写的 `error retry ok` 不会被找出来。加 `-i` 才会。',
      '`>` 是覆写，`>>` 是接在后面。',
    ],
  });

  P({
    id: 'private-diary',
    title: '私人日记',
    level: 2,
    topic: 'linux',
    uses: ['chmod', 'owner-chown'],
    story: '`diary.txt` 现在谁都能读。改成只有你自己能读写；`secrets` 目录改成只有你自己能进去、能看、能改。',
    setup: { tree: { 'diary.txt': 'Dear diary...\n', secrets: { 'plan.txt': 'top secret\n' } } },
    checks: [
      { say: '`diary.txt` 的权限是 `rw-------`', file: 'diary.txt', mode: 'rw-------' },
      { say: '`secrets` 的权限是 `rwx------`', dir: 'secrets', mode: 'rwx------' },
    ],
    hints: ['权限数字：r=4、w=2、x=1，三组分别是拥有者、用户组、其他人。', '读写是 4+2=6；读写运行是 7；什么都不行是 0。'],
    answer: ['chmod 600 diary.txt', 'chmod 700 secrets'],
    why: [
      '文件是你的，所以改权限不用 `sudo`。',
      '目录的 `x` 代表「能进去」。少了 `x`，就算有 `r` 也打不开里面的文件。',
    ],
  });

  P({
    id: 'make-runnable',
    title: '让脚本跑起来',
    level: 1,
    topic: 'linux',
    uses: ['chmod', 'hello-script'],
    story: '`cleanup.sh` 写好了却跑不动。改成：拥有者能读写运行，用户组只能读，其他人什么都不行。然后运行它。',
    setup: { tree: { 'cleanup.sh': '#!/bin/bash\necho "Cleaning up..."\necho "Done."\n' } },
    checks: [
      { say: '`cleanup.sh` 的权限是 `rwxr-----`', file: 'cleanup.sh', mode: 'rwxr-----' },
      { say: '`./cleanup.sh` 能运行，印出两行', run: './cleanup.sh', out: 'Cleaning up...\nDone.' },
    ],
    hints: ['先 `ls -l` 看现在的权限。', '拥有者 rwx=7、用户组 r=4、其他人 0。'],
    answer: ['chmod 740 cleanup.sh', './cleanup.sh'],
    why: [
      '`zsh: permission denied` 代表少了运行权限 `x`。',
      '`chmod +x` 也能让它跑，但会让所有人都能运行，不符合题目。',
    ],
  });

  P({
    id: 'hand-to-root',
    title: '把文件交给 root',
    level: 2,
    topic: 'linux',
    uses: ['owner-chown', 'chmod', 'ownership-challenge'],
    story: '`system.conf` 要交给 `root`：拥有者和用户组都是 `root`，权限 `644`。`shared` 目录（连同里面的文件）改给用户组 `public`，目录权限 `770`。',
    setup: { tree: { 'system.conf': 'mode=prod\n', shared: { 'plan.txt': 'Q4 plan\n' } } },
    checks: [
      { say: '`system.conf` 归 `root:root`', file: 'system.conf', owner: 'root', group: 'root' },
      { say: '`system.conf` 的权限是 `rw-r--r--`', file: 'system.conf', mode: 'rw-r--r--' },
      { say: '`shared` 的用户组是 `public`，权限 `rwxrwx---`', dir: 'shared', group: 'public', mode: 'rwxrwx---' },
      { say: '`shared/plan.txt` 的用户组也是 `public`', file: 'shared/plan.txt', group: 'public' },
    ],
    hints: ['换拥有者要 `sudo chown 用户:用户组 文件`；连里面一起换要加 `-R`。', '注意顺序：文件交给 root 之后，你就不是拥有者了，`chmod` 也要加 `sudo`。'],
    answer: ['sudo chown root:root system.conf', 'sudo chmod 644 system.conf', 'sudo chown -R labex:public shared', 'chmod 770 shared'],
    why: [
      '只有 root 能把文件交给别人，所以 `chown` 一定要 `sudo`。',
      '`chown labex:public` 只换用户组、拥有者不变，所以之后 `chmod 770 shared` 不用 `sudo`。',
      '`-R` 是 recursive：目录和里面所有东西一起改。',
    ],
  });

  P({
    id: 'new-colleague',
    title: '新同事报到',
    level: 2,
    topic: 'linux',
    uses: ['user-accounts'],
    story: '帮新同事 `alice` 开账号：要有家目录，登录 Shell 用 `/bin/bash`，还要能用 `sudo`。',
    setup: { tree: {} },
    checks: [
      { say: '有 `alice` 这个用户', user: 'alice' },
      { say: '有家目录 `/home/alice`', user: 'alice', homeDir: true },
      { say: '登录 Shell 是 `/bin/bash`', user: 'alice', shell: '/bin/bash' },
      { say: '`alice` 在 `sudo` 用户组里', user: 'alice', inGroups: ['sudo'] },
    ],
    hints: ['开账号用 `useradd`，要家目录加 `-m`。管理账号都要 `sudo`。', '改 Shell 用 `usermod -s`，加入用户组用 `usermod -aG`（`-a` 很重要）。'],
    answer: ['sudo useradd -m alice', 'sudo usermod -s /bin/bash alice', 'sudo usermod -aG sudo alice', 'groups alice'],
    why: [
      '也可以一次写完：`sudo useradd -m -s /bin/bash -G sudo alice`。',
      '`usermod -G` 不加 `-a` 会把原本的附加用户组全部换掉，所以习惯写 `-aG`。',
      '`groups alice` 可以确认结果：`alice : alice sudo`。',
    ],
  });

  P({
    id: 'handover',
    title: '离职交接',
    level: 3,
    topic: 'linux',
    uses: ['user-accounts', 'copy-and-move', 'owner-chown'],
    story: '`bob` 要离职了。先把他家目录里的 `report.txt` 复制到 `handover/report.txt`，这份副本要归你（`labex:labex`）；然后把 `bob` 连同家目录一起删掉。',
    setup: {
      users: ['bob'],
      abs: { '/home/bob/report.txt': 'Q3 numbers: 42\n' },
      meta: { '/home/bob/report.txt': 'rw-r----- bob bob' },
      tree: {},
    },
    checks: [
      { say: '`handover/report.txt` 的内容和 bob 的报告一样', file: 'handover/report.txt', content: 'Q3 numbers: 42\n' },
      { say: '这份副本归 `labex:labex`', file: 'handover/report.txt', owner: 'labex', group: 'labex' },
      { say: '已经没有 `bob` 这个用户', nouser: 'bob' },
      { say: '`/home/bob` 也删掉了', gone: '/home/bob' },
    ],
    hints: [
      '`/home/bob` 的权限是 `rwxr-x---`，你进不去，复制要加 `sudo`。',
      '`sudo cp` 复制出来的新文件归 root，要再用 `sudo chown` 交回给自己。删用户用 `userdel -r`。',
    ],
    answer: ['mkdir handover', 'sudo cp /home/bob/report.txt handover/', 'sudo chown labex:labex handover/report.txt', 'sudo userdel -r bob'],
    why: [
      '顺序很重要：要是先删了 bob，`-r` 会连报告一起删掉，就救不回来了。',
      '用 `sudo` 建立的文件，拥有者是 root。所以复制完要 `chown` 交回来。',
    ],
  });

  P({
    id: 'health-report',
    title: '系统健康报告',
    level: 2,
    topic: 'linux',
    uses: ['system-info'],
    story: '做一份 `report.txt`，共三行：第一行是目前的用户名，第二行是 `uname -a` 的结果，第三行是 `uptime` 的结果。',
    setup: { tree: {} },
    checks: [
      { say: '第一行是用户名', file: 'report.txt', match: /^labex\n/ },
      { say: '第二行是 `uname -a`', file: 'report.txt', match: /^[^\n]*\nLinux [^\n]* GNU\/Linux\n/ },
      { say: '第三行是 `uptime`，而且总共只有三行', file: 'report.txt', match: /^[^\n]*\n[^\n]*\n[^\n]* up [^\n]*load average[^\n]*\n$/ },
    ],
    hints: ['三个命令都要把结果存进同一个文件。', '只有第一次用 `>`，后面两次用 `>>`。'],
    answer: ['whoami > report.txt', 'uname -a >> report.txt', 'uptime >> report.txt', 'cat report.txt'],
    why: [
      '三次都用 `>` 的话，最后只会剩下 `uptime` 那一行。',
      '`uptime` 的结果会随时间变，所以检查时只看格式，不看数字。',
    ],
  });

  P({
    id: 'boot-trouble',
    title: '开机出了什么事',
    level: 2,
    topic: 'linux',
    uses: ['troubleshoot'],
    story: '开机信息里有线路断掉、挂载失败的问题。把 `dmesg` 里含有 `fail` 或 `down`（大小写都算）的行存进 `boot.txt`。',
    setup: { tree: {} },
    checks: [
      {
        say: '`boot.txt` 刚好是那两行',
        file: 'boot.txt',
        lines: ['[    2.318004] systemd[1]: Failed to mount /mnt/backup.', '[    2.913420] ata2: SATA link down (SStatus 0 SControl 300)'],
      },
    ],
    hints: ['`dmesg` 要用 `sudo` 才能看。', '用 `|` 把 `dmesg` 的输出交给 `grep`；`-i` 不分大小写，`-E \'a|b\'` 代表 a 或 b。'],
    answer: ["sudo dmesg | grep -i -E 'fail|down' > boot.txt", 'cat boot.txt'],
    why: [
      '`|` 是管道：前一个命令的输出，变成后一个命令的输入。',
      '`Failed` 是大写 F，没有 `-i` 就找不到。',
    ],
  });

  P({
    id: 'server-compare',
    title: '两台服务器少了什么',
    level: 3,
    topic: 'linux',
    uses: ['troubleshoot', 'read-and-compare'],
    story: '`server1` 和 `server2` 应该一模一样。把两边整个目录的比较结果存进 `missing.txt`；再把 `server2/app.conf` 里写着 `port` 的那一行存进 `port.txt`。',
    setup: {
      tree: {
        server1: { 'app.conf': 'name = web\nport = 8080\n', 'logo.png': 'png\n', static: { 'site.css': 'body{}\n' } },
        server2: { 'app.conf': 'name = web\nport = 8081\n', 'cache.db': 'db\n', static: { 'site.css': 'body{}\n', 'app.js': 'js\n' } },
      },
    },
    checks: [
      { say: '`missing.txt` 写出 `server1` 才有的 `logo.png`', file: 'missing.txt', match: /Only in server1\/?: logo\.png/ },
      { say: '`missing.txt` 写出 `server2` 才有的 `cache.db` 和 `static/app.js`', file: 'missing.txt', match: /Only in server2\/?: cache\.db[\s\S]*Only in server2\/?\/?static: app\.js|Only in server2\/?\/?static: app\.js[\s\S]*Only in server2\/?: cache\.db/ },
      { say: '`missing.txt` 也写出 `app.conf` 哪一行不同', file: 'missing.txt', has: ['< port = 8080', '> port = 8081'] },
      { say: '`port.txt` 是 `server2` 的 port 那一行', file: 'port.txt', content: 'port = 8081\n' },
    ],
    hints: ['比较两个目录，连子目录一起比，`diff` 要加 `-r`。', '`grep port server2/app.conf > port.txt`。'],
    answer: ['diff -r server1 server2 > missing.txt', 'cat missing.txt', 'grep port server2/app.conf > port.txt'],
    why: [
      '`Only in` 代表只有一边有；两边都有但内容不同的文件，会接着印出 `diff` 的结果。',
      '`diff` 找到不同时的退出码是 1，不是出错。',
    ],
  });

  P({
    id: 'pack-old-logs',
    title: '打包旧日志',
    level: 3,
    topic: 'linux',
    uses: ['organize-project', 'delete-files'],
    story: '`logs` 里 2025 年的日志全部打包成 `logs/old_logs.tar.gz`，打包后把那些 2025 年的原始文件删掉。2026 年的日志和 `notes.txt` 要留着。',
    setup: {
      tree: {
        logs: {
          'app_2025-10-01.log': 'a\n', 'app_2025-11-01.log': 'b\n', 'db_2025-10-15.log': 'c\n',
          'app_2026-01-01.log': 'd\n', 'db_2026-02-01.log': 'e\n', 'notes.txt': 'keep me\n',
        },
      },
    },
    checks: [
      { say: '`old_logs.tar.gz` 里刚好是三个 2025 年的日志', file: 'logs/old_logs.tar.gz', members: ['app_2025-10-01.log', 'app_2025-11-01.log', 'db_2025-10-15.log'] },
      { say: '`logs` 里只剩压缩包、2026 年的日志和 `notes.txt`', dir: 'logs', kids: ['app_2026-01-01.log', 'db_2026-02-01.log', 'notes.txt', 'old_logs.tar.gz'] },
    ],
    hints: ['先 `cd logs`。`*_2025-*.log` 可以一次选到三个文件。', '`tar -czf 压缩包 文件…`：c 创建、z 压缩、f 后面接压缩包名称。打包确认之后（`tar -tzf`）再删。'],
    answer: ['cd logs', 'tar -czf old_logs.tar.gz *_2025-*.log', 'tar -tzf old_logs.tar.gz', 'rm *_2025-*.log', 'ls'],
    why: [
      '`-f` 后面一定要紧接压缩包名称。写成 `-cfz` 会把 `z` 当成文件名。',
      '先 `tar -tzf` 看清单，确认东西都进去了再删，是比较安全的习惯。',
    ],
  });

  P({
    id: 'move-project',
    title: '项目大搬家',
    level: 3,
    topic: 'linux',
    uses: ['organize-project', 'copy-and-move', 'delete-files'],
    story: '`webapp` 的文件全挤在一层。整理成：`src`（`main.py`、`utils.py`）、`tests`（`test_main.py`）、`docs`（`README.md`）、`config`（`config.json` 和它的备份 `config.json.bak`）。`build.log` 不要了。',
    setup: {
      tree: {
        webapp: {
          'main.py': 'print("hi")\n', 'utils.py': 'pass\n', 'test_main.py': 'pass\n',
          'README.md': '# webapp\n', 'config.json': '{}\n', 'build.log': 'ok\n',
        },
      },
    },
    checks: [
      { say: '`src` 里是 `main.py`、`utils.py`', dir: 'webapp/src', kids: ['main.py', 'utils.py'] },
      { say: '`tests` 里是 `test_main.py`', dir: 'webapp/tests', kids: ['test_main.py'] },
      { say: '`docs` 里是 `README.md`', dir: 'webapp/docs', kids: ['README.md'] },
      { say: '`config` 里是 `config.json` 和 `config.json.bak`，内容一样', dir: 'webapp/config', kids: ['config.json', 'config.json.bak'], test: (sh) => sh.files['/home/labex/project/webapp/config/config.json.bak']?.content === '{}\n' },
      { say: '`webapp` 底下只剩这四个目录', dir: 'webapp', kids: ['config', 'docs', 'src', 'tests'] },
    ],
    hints: ['`mkdir src tests docs config` 一次建好。注意 `test_main.py` 也是 `.py` 结尾，`mv *.py` 会把它一起搬走。', '可以先把 `test_main.py` 搬走，再 `mv *.py src/`。备份用 `cp`。'],
    answer: ['cd webapp', 'mkdir src tests docs config', 'mv test_main.py tests/', 'mv *.py src/', 'mv README.md docs/', 'mv config.json config/', 'cp config/config.json config/config.json.bak', 'rm build.log', 'tree'],
    why: [
      '通配符很方便，但会把所有符合的都选进来。搬之前先 `ls *.py` 看看会选到哪些，比较安全。',
      '`tree` 可以一眼看出整个结构对不对。',
    ],
  });

  // Shell 脚本 ===============================================================
  P({
    id: 'first-script',
    title: '自己写一个脚本',
    level: 1,
    topic: 'shell-script',
    uses: ['hello-script'],
    story: '写一个 `greet.sh`，运行 `./greet.sh` 会印出两行：`Hello, LabEx!` 和 `Today we learn shell.`',
    setup: { tree: {} },
    checks: [
      { say: '`./greet.sh` 印出这两行', run: './greet.sh', out: 'Hello, LabEx!\nToday we learn shell.' },
      { say: '第一行是 shebang `#!/bin/bash`', file: 'greet.sh', match: /^#!\/bin\/bash\n/ },
    ],
    hints: ['在终端机输入 `nano greet.sh` 会打开编辑器，写好后按「保存」。', '每一行用一个 `echo`；写好后还要 `chmod +x greet.sh`。'],
    answer: [
      'touch greet.sh',
      { edit: 'greet.sh', text: '#!/bin/bash\necho "Hello, LabEx!"\necho "Today we learn shell."\n' },
      'chmod +x greet.sh',
      './greet.sh',
    ],
    why: [
      '`#!/bin/bash` 告诉系统用 bash 来运行这个文件。',
      '新文件默认没有 `x`，直接运行会出现 `zsh: permission denied`。',
    ],
  });

  P({
    id: 'profile-card',
    title: '自我介绍卡',
    level: 2,
    topic: 'shell-script',
    uses: ['shell-variables', 'hello-script'],
    story: '写一个 `card.sh`，先用变量 `NAME`、`AGE`、`CITY` 存值（`Labby`、`3`、`New York`），再用这些变量印出三行。',
    setup: { tree: {} },
    checks: [
      { say: '`./card.sh` 印出三行', run: './card.sh', out: 'Name: Labby\nAge: 3\nCity: New York' },
      { say: '脚本里有 `NAME=`、`AGE=`、`CITY=` 三个变量', file: 'card.sh', match: /^NAME=[\s\S]*^AGE=[\s\S]*^CITY=/m },
      { say: '`echo` 用的是变量，不是直接写死', file: 'card.sh', match: /\$\{?NAME\}?[\s\S]*\$\{?AGE\}?[\s\S]*\$\{?CITY\}?/ },
    ],
    hints: ['变量：`NAME=Labby`，等号两边不能有空格。', '`New York` 中间有空格，要用引号包起来：`CITY="New York"`。印出来用 `echo "City: $CITY"`。'],
    answer: [
      { edit: 'card.sh', text: '#!/bin/bash\nNAME=Labby\nAGE=3\nCITY="New York"\necho "Name: $NAME"\necho "Age: $AGE"\necho "City: $CITY"\n' },
      'chmod +x card.sh',
      './card.sh',
    ],
    why: [
      '`CITY=New York` 没加引号的话，bash 会把 `York` 当成命令来运行，出现 `York: command not found`。',
      '`$NAME` 是「拿出 NAME 的值」。',
    ],
  });

  P({
    id: 'price-tag',
    title: '价目表',
    level: 2,
    topic: 'shell-script',
    uses: ['quoting-variables', 'shell-variables'],
    story: '写一个 `price.sh`：变量 `ITEM=apple`、`PRICE=5`、`TOTAL=15`。印出 `The apple costs $5 each.` 和 `Three apples cost $15.`',
    setup: { tree: {} },
    checks: [
      { say: '`./price.sh` 印出这两行', run: './price.sh', out: 'The apple costs $5 each.\nThree apples cost $15.' },
      { say: '`apples` 是用 `${ITEM}s` 拼出来的', file: 'price.sh', match: /\$\{ITEM\}s/ },
    ],
    hints: ['想印出 `$` 符号本身，要写成 `\\$`。', '`$ITEMs` 会被当成一个叫 `ITEMs` 的变量。用 `${ITEM}s` 把名字框起来。'],
    answer: [
      { edit: 'price.sh', text: '#!/bin/bash\nITEM=apple\nPRICE=5\nTOTAL=15\necho "The $ITEM costs \\$$PRICE each."\necho "Three ${ITEM}s cost \\$$TOTAL."\n' },
      'chmod +x price.sh',
      './price.sh',
    ],
    why: [
      '`\\$$PRICE`：前面的 `\\$` 印出 `$`，后面的 `$PRICE` 拿出 5。',
      '`${ITEM}s`：大括号告诉 bash 变量名到哪里结束。',
    ],
  });

  P({
    id: 'fix-broken-script',
    title: '修好坏掉的脚本',
    level: 3,
    topic: 'shell-script',
    uses: ['shell-variables', 'quoting-variables', 'hello-script'],
    story: '同事留下的 `broken.sh` 有好几个毛病。修好它，让 `./broken.sh` 印出下面三行（第三行中间是 5 个空格）：\n`Hello, Labby`\n`Saving to report_v2.txt`\n`a     b`',
    setup: {
      tree: {
        'broken.sh': '#!/bin/bash\nGREETING = Hello\nFILE=report\nSPACES=\'a     b\'\necho "$GREETING, Labby"\necho "Saving to $FILE_v2.txt"\necho $SPACES\n',
      },
    },
    checks: [
      { say: '`./broken.sh` 印出这三行', run: './broken.sh', out: 'Hello, Labby\nSaving to report_v2.txt\na     b' },
    ],
    hints: ['先运行看看错误信息，再一个一个修：一共有三个写法问题，外加一个权限问题。', '等号两边不能有空格；`$FILE_v2` 会被当成变量 `FILE_v2`；要保留空格就把变量包在双引号里。'],
    answer: [
      'chmod +x broken.sh',
      './broken.sh',
      { edit: 'broken.sh', text: '#!/bin/bash\nGREETING=Hello\nFILE=report\nSPACES=\'a     b\'\necho "$GREETING, Labby"\necho "Saving to ${FILE}_v2.txt"\necho "$SPACES"\n' },
      './broken.sh',
    ],
    why: [
      '`GREETING = Hello` 会被当成「运行 GREETING 这个命令」，所以出现 `GREETING: command not found`。',
      '变量名可以有底线，所以 `$FILE_v2` 是另一个（空的）变量，要写 `${FILE}_v2`。',
      '`echo $SPACES` 没加引号，bash 会把值按空格切开再用一个空格接回去。',
    ],
  });

  // Python 基础 ==============================================================
  P({
    id: 'py-calculator',
    title: '把 Python 当计算器',
    level: 1,
    topic: 'python',
    uses: ['python-repl'],
    story: '进入 Python 交互模式，用变量 `total` 存 `(12 + 8) * 3` 的结果，再用变量 `avg` 存 `total` 除以 4 的结果。',
    setup: { tree: {} },
    checks: [
      { say: '`total` 是整数 60', py: 'total', value: 60, type: 'int' },
      { say: '`avg` 是小数 15.0', py: 'avg', value: 15, type: 'float' },
    ],
    hints: ['在终端机输入 `python3` 进入交互模式，提示字符会变成 `>>>`。', '`/` 除法的结果一定是小数。'],
    answer: ['python3', 'total = (12 + 8) * 3', 'avg = total / 4', 'avg', 'exit()'],
    why: [
      '赋值不会显示任何东西；直接打名字才会显示它的值。',
      '`60 / 4` 是 `15.0` 不是 `15`，因为 `/` 一定得到 float。',
    ],
  });

  P({
    id: 'py-name-tags',
    title: '名牌挂在哪',
    level: 1,
    topic: 'python',
    uses: ['python-repl'],
    story: '在 Python 交互模式里依序做三件事：让 `x` 挂上 `7`；让 `y` 挂上和 `x` 一样的值；再让 `x` 改挂 `8`。最后看看 `y` 是多少。',
    setup: { tree: {} },
    checks: [
      { say: '`x` 现在是 8', py: 'x', value: 8 },
      { say: '`y` 还是 7', py: 'y', value: 7 },
      { say: '`y` 是用 `y = x` 挂上去的', ran: /^>>> \s*y\s*=\s*x\s*$/ },
    ],
    hints: ['`y = x` 是让 `y` 挂到 `x` 现在挂着的那个值上。', '之后 `x = 8` 只是把 `x` 的名牌移走，`y` 不受影响。'],
    answer: ['python3', 'x = 7', 'y = x', 'x = 8', 'y', 'exit()'],
    why: ['变量是名牌，不是盒子。`x = 8` 是把 `x` 这块名牌改挂到 8 上，原本的 7 还挂着 `y`。'],
  });

  P({
    id: 'py-greeter',
    title: '会打招呼的程序',
    level: 2,
    topic: 'python',
    uses: ['python-repl'],
    story: '写一个 `hello.py`：先问 `What is your name? `，再印出 `Hello, 名字!`（名字后面紧接惊叹号）。用 `python3 hello.py` 运行。',
    setup: { tree: {} },
    checks: [
      { say: '输入 `Alice`，印出 `Hello, Alice!`', run: 'python3 hello.py', input: ['Alice'], out: 'What is your name? Alice\nHello, Alice!' },
      { say: '输入 `Bob`，印出 `Hello, Bob!`', run: 'python3 hello.py', input: ['Bob'], out: 'What is your name? Bob\nHello, Bob!' },
    ],
    hints: ['`name = input("What is your name? ")`，问题最后有一个空格。', '`print("Hello,", name + "!")`：逗号会补一个空格，`+` 不会。'],
    answer: [
      { edit: 'hello.py', text: 'name = input("What is your name? ")\nprint("Hello,", name + "!")\n' },
      'python3 hello.py',
      'Alice',
    ],
    why: [
      '`print` 里用逗号隔开，印出来中间会有一个空格；用 `+` 接文本，中间什么都不加。',
      '写成 `print("Hello,", name, "!")` 会变成 `Hello, Alice !`，多一个空格。',
    ],
  });

  P({
    id: 'py-next-year',
    title: '明年几岁',
    level: 2,
    topic: 'python',
    uses: ['python-repl'],
    story: '写一个 `age.py`：问 `How old are you? `，印出 `Next year you will be 明年的岁数`。',
    setup: { tree: {} },
    checks: [
      { say: '输入 `20`，印出 `Next year you will be 21`', run: 'python3 age.py', input: ['20'], out: 'How old are you? 20\nNext year you will be 21' },
      { say: '输入 `7`，印出 `Next year you will be 8`', run: 'python3 age.py', input: ['7'], out: 'How old are you? 7\nNext year you will be 8' },
    ],
    hints: ['`input()` 拿到的一定是文本（str），文本不能直接加 1。', '用 `int()` 把文本换成整数，再加 1。'],
    answer: [
      { edit: 'age.py', text: 'age_str = input("How old are you? ")\nage = int(age_str)\nprint("Next year you will be", age + 1)\n' },
      'python3 age.py',
      '20',
    ],
    why: [
      '没有 `int()` 的话，`age_str + 1` 会出现 `TypeError: can only concatenate str (not "int") to str`。',
      '`print` 用逗号把文本和数字接起来，不用先把数字换成文本。',
    ],
  });
})();
