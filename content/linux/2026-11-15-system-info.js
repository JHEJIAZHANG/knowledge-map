(function () {
  const P = '/home/labex/project';
  const PROMPT = 'labex:project/ $';
  const ID = 'uid=5000(labex) gid=5000(labex) groups=5000(labex),27(sudo),121(ssl-cert),5002(public)';
  const UNAME = 'Linux 6af99ac568b2e3ec9acca849 6.8.0-111-generic #111-Ubuntu SMP PREEMPT_DYNAMIC Sat Apr 11 23:16:02 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux';
  const UP1 = ' 20:10:16 up 186 days,  6:39,  0 users,  load average: 0.19, 0.29, 0.22';
  const UP2 = ' 20:22:22 up 186 days,  6:51,  0 users,  load average: 0.19, 0.23, 0.19';
  // top 的完整输出有四十几行，这里留下开头的摘要和几个代表性的程序
  const TOP = [
    'top - 20:20:08 up 186 days,  6:49,  0 users,  load average: 0.34, 0.25, 0.20',
    'Tasks:  42 total,   1 running,  41 sleeping,   0 stopped,   0 zombie',
    '%Cpu(s):  0.9 us,  0.4 sy,  0.0 ni, 98.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st',
    'MiB Mem :  15322.5 total,   5715.8 free,   3876.3 used,   5730.4 buff/cache',
    'MiB Swap:      0.0 total,      0.0 free,      0.0 used.  11052.6 avail Mem',
    '',
    '    PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND',
    '    272 labex     20   0   12668   4092   3176 S   0.3   0.0   0:00.06 tmux: server',
    '      1 root      20   0   11212   3864   3580 S   0.0   0.0   0:00.00 init.sh',
    '     21 root      20   0   40832  28484  10952 S   0.0   0.2   0:00.37 supervisord',
    '     22 root      20   0   15432   9296   7664 S   0.0   0.1   0:00.01 sshd',
    '     36 labex     20   0  313948  83960  55092 S   0.0   0.5   0:00.26 Xvnc',
    '    273 labex     20   0    7636   6232   4228 S   0.0   0.0   0:00.42 zsh',
    '   1394 labex     20   0    7376   3656   3000 R   0.0   0.0   0:00.10 top',
    '…（其余三十几行省略）',
  ].join('\n');
  const REPORT = `labex\n${UNAME}\n${UP2}`;

  KnowledgeMap.add({
    id: 'system-info',
    topic: 'linux',
    group: 'system',
    date: '2026-11-15',
    title: '认识这台机器：uname、uptime、top，再存成报告',
    summary: '查出系统版本、开机多久、现在有哪些程序在跑，最后用 > 和 >> 把结果收进一个文件。',
    quiz: [
      { q: '想一次印出系统名称、主机名称、内核版本和硬件架构，要打什么？', answer: 'uname -a', why: '`uname` 只印系统名称；加上 `-a`（all）才会全部印出来。' },
      { q: '`uptime` 最后的 `load average: 0.19, 0.29, 0.22`，三个数字分别代表什么？', choices: ['CPU、内存、硬盘的使用率', '最近 1 分钟、5 分钟、15 分钟的平均负载', '登录人数、程序数、开机天数'], answer: 1, why: '三个数字是不同时间范围的平均负载，数字越小代表机器越闲。' },
      { q: '`top` 的画面一直在更新，要按哪个键才能离开？', answer: 'q', hint: '输入一个按键', why: '`q` 是 quit。`top` 会一直占着画面，直到你按 `q`。' },
      { q: '报告文件里已经有一行 `labex`。想把 `uptime` 的结果**接在后面**，要打什么？', answer: ['uptime >> system_report.txt', 'uptime >>system_report.txt'], why: '两个 `>>` 是接在后面。如果只打一个 `>`，原本的 `labex` 会被盖掉。' },
      { q: '运行 `whoami > system_report.txt` 之后，画面上会出现什么？', choices: ['labex', '什么都不会出现', '错误消息'], answer: 1, why: '输出被 `>` 转进文件了，所以画面上没有东西。要用 `cat` 才看得到。' },
    ],
    sections: [
      {
        nav: '我是谁',
        kicker: '复习',
        title: '动手之前，先确认身分',
        lead: '认识一台机器的第一步，还是先确认自己是用谁的身分登录。',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'whoami', out: 'labex' },
              { cmd: 'id', out: ID },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '两个学过的命令',
            text: [
              '`whoami` 只回答名字，`id` 会多告诉你编号和所属的用户组。',
              '用户组里有 `sudo`，代表这个账号可以借用管理员的权限。',
            ],
          },
        ],
      },
      {
        nav: 'uname',
        kicker: '系统版本',
        title: 'uname：这台机器跑的是什么系统',
        lead: '`uname` 是 unix name 的缩写。不加选项只印系统名称，加上 `-a` 会把所有信息一次印出来。',
        blocks: [
          { type: 'movie', film: 'uname' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [
              { cmd: 'uname', out: 'Linux' },
              { cmd: 'uname -a', out: UNAME },
            ],
          },
          {
            type: 'terms',
            title: '`uname -a` 那一长串，一段一段看',
            items: [
              ['`Linux`', '内核的名称。不加选项时只印这一段。'],
              ['`6af99ac568b2e3ec9acca849`', '主机名称，也就是这台机器的名字。LabEx 的环境是自动产生的，所以是一串乱码。'],
              ['`6.8.0-111-generic`', '内核的版本号。查问题或装驱动程序时最常用到这一段。'],
              ['`#111-Ubuntu SMP PREEMPT_DYNAMIC Sat Apr 11 23:16:02 UTC 2026`', '这个内核是第几次编译、什么时候编译的。看到 `Ubuntu` 就知道是 Ubuntu 的内核。'],
              ['`x86_64`（三个）', '硬件架构，代表 64 比特的 Intel 或 AMD 处理器。三个字段分别是机器、处理器、硬件平台，这里刚好都一样。'],
              ['`GNU/Linux`', '操作系统的名称。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '为什么需要知道这些',
            text: '安装软件时常要选「64 比特」还是「ARM」版本，看 `x86_64` 就知道。回报问题给别人时，对方通常也会先问内核版本。',
          },
        ],
      },
      {
        nav: 'uptime',
        kicker: '开机多久',
        title: 'uptime：已经连续开机多久',
        lead: '一行字里有四个信息：现在时间、开机多久、几个人登录、最近有多忙。',
        blocks: [
          { type: 'movie', film: 'uptime' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [{ cmd: 'uptime', out: UP1 }],
          },
          {
            type: 'terms',
            title: '从左到右切成四段',
            items: [
              ['`20:10:16`', '现在的时间。'],
              ['`up 186 days,  6:39`', '已经连续开机 186 天又 6 小时 39 分钟，中间没有重新开机过。'],
              ['`0 users`', '现在有几个用户登录。'],
              ['`load average: 0.19, 0.29, 0.22`', '平均负载：最近 1 分钟、5 分钟、15 分钟有多忙。'],
            ],
          },
          {
            type: 'extra',
            title: '平均负载怎么看',
            text: [
              '可以把它想成「同时在排队等 CPU 的工作有几个」。数字越小，机器越闲。',
              '三个数字一起看能看出趋势：第一个比第三个大，代表越来越忙；反过来就是正在慢慢闲下来。',
            ],
          },
          {
            type: 'analogy',
            title: '像店门口的营业纪录',
            text: '现在几点、已经连续营业几天、店里有几位客人、最近柜台排了多少人。一眼看完，就知道这家店的状况。',
          },
        ],
      },
      {
        nav: 'top',
        kicker: '即时状态',
        title: 'top：现在有哪些程序在跑',
        lead: '`top` 会把整个画面变成一张即时更新的表，列出正在运行的程序，以及它们用了多少 CPU 和内存。',
        blocks: [
          { type: 'movie', film: 'top' },
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [{ cmd: 'top', out: TOP }],
          },
          {
            type: 'terms',
            title: '上面五行是摘要',
            items: [
              ['`top - 20:20:08 up 186 days …`', '第一行和 `uptime` 的输出一模一样。'],
              ['`Tasks: 42 total, 1 running, 41 sleeping`', '总共 42 个程序，1 个正在运行，41 个在待命。'],
              ['`%Cpu(s): … 98.7 id`', '`id` 是 idle（闲置）。CPU 有 98.7% 的时间没事做。'],
              ['`MiB Mem : 15322.5 total, 5715.8 free, 3876.3 used`', '内存总共约 15 GB，其中用掉约 3.9 GB。'],
              ['`MiB Swap: 0.0 total`', '这台机器没有设置置换空间（内存不够时借用的硬盘空间）。'],
            ],
          },
          {
            type: 'terms',
            title: '下面的表，每一行是一个程序',
            items: [
              ['`PID`', '程序的编号（process ID）。每个正在运行的程序都有一个。'],
              ['`USER`', '是谁启动这个程序的。'],
              ['`%CPU`', '现在用了多少 CPU。默认照这一栏排序，最忙的在最上面。'],
              ['`%MEM`', '用了多少比例的内存。'],
              ['`S`', '状态。`S` 是 sleeping（待命），`R` 是 running（正在运行）。'],
              ['`COMMAND`', '程序的名称。最后一行的 `top` 就是你刚刚运行的这个命令。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '按 `q` 离开',
            text: '`top` 不会自己结束，它会一直更新画面。按键盘上的 `q` 才会回到提示字符。',
          },
        ],
      },
      {
        nav: '报告',
        kicker: '存成文件',
        title: '把查到的结果收进一份报告',
        lead: '前面的结果都只印在画面上，关掉就没了。用 `>` 和 `>>` 把它们存进 `system_report.txt`。',
        blocks: [
          {
            type: 'terminal',
            span: 12,
            prompt: PROMPT,
            lines: [
              { cmd: 'touch system_report.txt' },
              { cmd: 'ls -l', out: 'total 0\n-rw-rw-r-- 1 labex labex 0 Nov 15 20:21 system_report.txt' },
              { cmd: 'whoami > system_report.txt' },
              { cmd: 'uname -a >> system_report.txt' },
              { cmd: 'uptime >> system_report.txt' },
              { cmd: 'cat system_report.txt', out: REPORT },
            ],
          },
          {
            type: 'text',
            title: '第一行用 `>`，后面都用 `>>`',
            text: [
              '`>` 会把文件清空再写入，所以放在**第一行**，确保报告从干净的状态开始。',
              '`>>` 是接在后面。第二、三行如果也用 `>`，前面写的就会被盖掉，最后只剩 `uptime` 那一行。',
            ],
          },
          {
            type: 'text',
            title: '为什么中间三行没有输出',
            text: '命令的结果原本会印在画面上。加了 `>` 或 `>>` 之后，结果改流进文件，画面上就没有东西了。要用 `cat` 把文件打开才看得到。',
          },
          {
            type: 'run',
            title: '一步一步看报告怎么长出来',
            root: P,
            cwd: P,
            tree: {},
            commands: [
              { cmd: 'touch system_report.txt', note: '先创建一个空文件。' },
              { cmd: 'ls -l', out: 'total 0\n-rw-rw-r-- 1 labex labex 0 Nov 15 20:21 system_report.txt', note: '大小是 `0`，代表里面还没有任何内容。' },
              { cmd: 'whoami > system_report.txt', put: 'labex', note: '一个 `>`：把文件清空，写进第一行。画面上没有输出。' },
              { cmd: 'uname -a >> system_report.txt', put: UNAME, note: '两个 `>>`：接在后面，变成第二行。' },
              { cmd: 'uptime >> system_report.txt', put: UP2, note: '再接一行。注意时间是 `20:22:22`，是运行当下的时间。' },
              { cmd: 'cat system_report.txt', out: REPORT, note: '三个命令的结果，依序收在同一个文件里。' },
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
              ['`uname`', '印出系统名称。'],
              ['`uname -a`', '印出全部的系统信息：主机名称、内核版本、硬件架构。'],
              ['`uptime`', '现在时间、开机多久、几人登录、平均负载。'],
              ['`top`', '即时显示正在运行的程序，按 `q` 离开。'],
              ['`命令 > 文件`', '把命令的结果存进文件，原本的内容会被盖掉。'],
              ['`命令 >> 文件`', '把命令的结果接在文件最后面。'],
            ],
          },
          {
            type: 'recap',
            items: [
              '`uname -a` 看系统，`uptime` 看开机多久，`top` 看现在谁在忙。',
              '`top` 会占住画面，按 `q` 才会离开。',
              '`>` 和 `>>` 不只能接在 `echo` 后面，**任何命令的输出**都可以存进文件。',
              '做报告时，第一行用 `>`，之后都用 `>>`。',
            ],
          },
        ],
      },
    ],
  });
})();
