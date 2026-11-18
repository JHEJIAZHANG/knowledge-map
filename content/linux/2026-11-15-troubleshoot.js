(function () {
  const P = '/home/labex/project';
  const AT_P = 'labex:project/ $';
  const AT_LOG = 'labex:logs/ $';
  const AT_CFG = 'labex:config/ $';
  const ERR = '[2023-10-26 10:00:03] ERROR: Failed to process payment transaction #12345.\n[2023-10-26 10:00:05] ERROR: NullPointerException at com.innovatech.Billing.process(Billing.java:101).';
  const BOOT = [
    '[    0.249677] acpi PNP0A03:00: fail to add MMCONFIG information, can\'t access extended PCI configuration space under this bridge.',
    '[    0.713866] RAS: Correctable Errors collector initialized.',
    '[   13.035248] kernel: [   10.123456] my-driver: probe of 0000:00:1f.0 failed with error -2',
    '[   68.268388] AliSecGuard: module verification failed: signature and/or required key missing - tainting kernel',
  ].join('\n');
  const NGINX = 'user www-data;\nworker_processes 4;\npid /run/nginx.pid;\n\nevents {\n    worker_connections 768;\n}\n\nhttp {\n    server {\n        listen 80;\n        server_name innovatech.io;\n        root /var/www/html;\n    }\n}';
  const DIFF = [
    '1,5c1,5',
    '< # Staging Configuration',
    '< database.url=jdbc:mysql://staging-db:3306/nexus',
    '< api.key=staging_key_abc123',
    '< feature.flag.new_dashboard=true',
    '< timeout.ms=3000',
    '---',
    '> # Production Configuration',
    '> database.url=jdbc:mysql://prod-db:3306/nexus',
    '> api.key=prod_key_xyz789',
    '> feature.flag.new_dashboard=false',
    '> timeout.ms=5000',
  ].join('\n');
  const ONLY = 'Only in server1_files/: asset2.js';

  KnowledgeMap.add({
    id: 'troubleshoot',
    topic: 'linux',
    group: 'system',
    kind: 'challenge',
    date: '2026-11-15',
    title: '找出系统出错的原因',
    summary: '用 grep 从日志文件和配置文件挑出关键的行，用管道 | 过滤内核消息，再用 diff 比对设置和目录，把线索都存成报告。',
    quiz: [
      { q: '只想留下 `app.log` 里含有 `ERROR` 的行，并存进 `error_report.txt`，要打什么？', answer: ['grep "ERROR" app.log > error_report.txt', "grep 'ERROR' app.log > error_report.txt", 'grep ERROR app.log > error_report.txt'], why: '`grep` 只留下有那个字的行；`>` 把结果写进文件。' },
      { q: '`sudo dmesg | grep -i error` 里的 `|` 是做什么的？', choices: ['表示「或」', '把 dmesg 的输出直接交给 grep', '把结果写进文件'], answer: 1, why: '单独出现的 `|` 是管道。写在引号里的 `\'fail|error\'` 才是「或」。' },
      { q: '`grep -i` 的 `-i` 有什么作用？', choices: ['只印出行号', '忽略大小写', '连子目录一起找'], answer: 1, why: '`-i` 是 ignore case。加了之后 `error`、`Error`、`ERROR` 都会被找到。' },
      { q: '要把 `worker_processes` 那一行**加到** `error_report.txt` 最后面，不能盖掉原本的内容，要用哪个符号？', answer: ['>>'], hint: '输入符号', why: '`>>` 是接在后面；`>` 会先清空文件。' },
      { q: '`diff -r` 印出 `Only in server1_files/: asset2.js`，代表什么？', choices: ['两边的 asset2.js 内容不同', 'asset2.js 只在 server1_files 里有', 'asset2.js 被删掉了'], answer: 1, why: '`Only in` 表示这个文件只存在于其中一边。内容不同的话会显示差异的行。' },
    ],
    sections: [
      {
        nav: '题目',
        kicker: '挑战',
        title: '应用程序出错了，原因在哪？',
        lead: '这次没有逐步教学，只有一连串的调查任务。每找到一条线索，就存成一个文件，最后交给团队。',
        blocks: [
          {
            type: 'text',
            span: 12,
            title: '五个任务',
            text: [
              '1. 从应用程序的记录 `logs/app.log` 找出 `ERROR`，存成 `error_report.txt`。',
              '2. 检查系统内核消息，找出和 `fail` 或 `error` 有关的行，存成 `~/project/boot_issues.txt`。',
              '3. 从 Nginx 配置文件找出 `worker_processes` 那一行，**追加**到 `~/project/error_report.txt`。',
              '4. 比较测试环境和正式环境的配置文件，存成 `config_diff.txt`。',
              '5. 比较两台服务器的文件目录，存成 `missing_files.txt`。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '任务 1、4、5 的题目文本',
            text: '你粘贴来的只有任务 2 和 3 的说明。另外三个任务的目标是我从你的命令推回来的。',
          },
        ],
      },
      {
        nav: '日志文件',
        kicker: '任务 1',
        title: 'grep：只留下有 ERROR 的行',
        lead: '`grep` 会一行一行扫过文件，只印出含有指定文本的那几行。',
        blocks: [
          { type: 'movie', film: 'grep' },
          {
            type: 'terminal',
            span: 12,
            prompt: AT_P,
            lines: [
              { cmd: 'cd logs' },
              { cmd: 'ls -l', out: 'total 4\n-rw-rw-r-- 1 labex labex 463 Nov 15 21:06 app.log', prompt: AT_LOG },
              { cmd: 'grep "ERROR" app.log > error_report.txt', prompt: AT_LOG },
              { cmd: 'cat error_report.txt', out: ERR, prompt: AT_LOG },
            ],
          },
          {
            type: 'text',
            title: '三个部分',
            text: [
              '`grep "ERROR"`：要找的文本。',
              '`app.log`：到哪个文件找。',
              '`> error_report.txt`：结果不印在画面上，写进这个文件。',
            ],
          },
          {
            type: 'extra',
            title: '文件存在哪里',
            text: [
              '这一行是在 `logs` 里运行的，所以文件会建在 `logs/error_report.txt`。',
              '任务 3 追加的对象是 `~/project/error_report.txt`，而你最后看到的内容有三行，所以 `~/project` 里应该也有一份。记录里没有创建它的那一行。',
              '直接写完整路径 `grep "ERROR" app.log > ~/project/error_report.txt`，就不用担心存错地方。',
            ],
          },
        ],
      },
      {
        nav: '内核消息',
        kicker: '任务 2',
        title: 'dmesg | grep：用管道过滤内核消息',
        lead: '应用程序出错，有时是硬件或驱动的问题。系统内核把开机和驱动的消息都记在一个地方，用 `dmesg` 就能读出来。',
        blocks: [
          { type: 'movie', film: 'pipe' },
          {
            type: 'terminal',
            span: 12,
            prompt: AT_P,
            lines: [
              { cmd: "sudo dmesg | grep -i -E 'fail|error' > boot_issues.txt" },
              { cmd: 'cat boot_issues.txt', out: BOOT },
            ],
          },
          {
            type: 'terms',
            title: '一行里的五个部分',
            items: [
              ['`sudo dmesg`', '读出内核消息。一般用户没有权限，会出现 `Operation not permitted`，所以要加 `sudo`。'],
              ['`|`', '**管道**：`dmesg` 的输出不印在画面上，直接交给右边的 `grep`。'],
              ['`grep -i`', '`-i` 是 ignore case，忽略大小写。所以 `Errors`、`failed` 也会被找到。'],
              ["`-E 'fail|error'`", '`-E` 打开高端样式，引号里的 `|` 代表「或」：含 `fail` **或** `error` 都算。'],
              ['`> boot_issues.txt`', '把最后的结果写进文件。'],
            ],
          },
          {
            type: 'text',
            title: '同一个 `|`，两种意思',
            text: [
              '单独出现在两个命令中间的 `|` 是**管道**。',
              "写在引号里的 `'fail|error'` 是 `grep` 的样式，`|` 在这里是「或」。引号一定要加，否则 Shell 会把它当成管道，把命令切坏。",
            ],
          },
          {
            type: 'analogy',
            title: '像工厂的输送带',
            text: '`dmesg` 是生产线的起点，不停地送出零件；`grep` 是品检站，只让合格的通过；`>` 是最后的包装箱。零件从头到尾没有落地，也就是没有印在画面上。',
          },
          {
            type: 'terms',
            title: '找到的四行在说什么',
            items: [
              ['`fail to add MMCONFIG information`', '主板的一项设置读不到。在虚拟机上很常见，通常不影响使用。'],
              ['`RAS: Correctable Errors collector initialized.`', '不是错误，是「负责收集可修正错误的组件启动了」。因为里面有 `Errors` 这个字才被选中。'],
              ['`probe of 0000:00:1f.0 failed with error -2`', '某个驱动程序找不到它要控制的硬件。这是题目特别放的测试消息。'],
              ['`module verification failed`', '有一个模块没有数字签章。内核还是加载了它，只是做了记号。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '和题目范例不一样是正常的',
            text: '方括号里的数字是开机后经过的秒数，每台机器、每次开机都不同。你的结果还多了一行 `AliSecGuard`，是这台机器上才有的安全模块，题目的范例里没有。',
          },
        ],
      },
      {
        nav: '配置文件',
        kicker: '任务 3',
        title: 'grep >>：把设置追加到报告',
        lead: '内核没有严重的问题，接着看 Web 服务器的设置。`worker_processes` 决定 Nginx 同时开几个工作进程，太少的话，流量一大就处理不过来。',
        blocks: [
          {
            type: 'terminal',
            span: 12,
            prompt: AT_P,
            lines: [
              { cmd: 'cd config' },
              { cmd: 'cat nginx.conf', out: NGINX, prompt: AT_CFG },
              { cmd: "grep 'worker_processes' nginx.conf", out: 'worker_processes 4;', prompt: AT_CFG },
              { cmd: "grep 'worker_processes' nginx.conf >> ~/project/error_report.txt", prompt: AT_CFG },
              { cmd: 'cat ~/project/error_report.txt', out: `${ERR}\nworker_processes 4;`, prompt: AT_CFG },
            ],
          },
          {
            type: 'text',
            title: '先看，再存',
            text: [
              '第一次的 `grep` 没有 `>>`，先在画面上确认找到的是对的那一行。',
              '确认没问题，按 ↑ 叫出同一行，在后面加上 `>> ~/project/error_report.txt`。',
            ],
          },
          {
            type: 'text',
            title: '为什么是 `>>`',
            text: '报告里已经有任务 1 的两行错误。用 `>` 会先清空文件，前面的线索就没了；`>>` 是接在最后面，所以结果是三行。',
          },
        ],
      },
      {
        nav: '比对设置',
        kicker: '任务 4',
        title: 'diff：测试环境和正式环境差在哪',
        lead: '同一个程序在测试环境正常、上了正式环境却出错，最常见的原因就是两边的设置不一样。',
        blocks: [
          {
            type: 'terminal',
            span: 12,
            prompt: AT_CFG,
            lines: [
              { cmd: 'cd ..' },
              { cmd: 'diff config/staging/app.conf config/production/app.conf', out: DIFF, prompt: AT_P },
              { cmd: 'diff config/staging/app.conf config/production/app.conf > config_diff.txt', prompt: AT_P },
              { cmd: 'cat config_diff.txt', out: DIFF, prompt: AT_P },
            ],
          },
          {
            type: 'terms',
            title: '这段输出怎么读',
            items: [
              ['`1,5c1,5`', '第一个文件的第 1 到 5 行，被换成（c = change）第二个文件的第 1 到 5 行。'],
              ['`<` 开头', '第一个文件（staging，测试环境）的内容。'],
              ['`---`', '分隔线，上面是旧的，下面是新的。'],
              ['`>` 开头', '第二个文件（production，正式环境）的内容。'],
            ],
          },
          {
            type: 'text',
            title: '五行全都不一样',
            text: [
              '数据库位置、API 密钥、新功能开关、逾时时间，两边都不同。',
              '其中 `timeout.ms` 正式环境是 `5000`，测试环境是 `3000`。这种数字上的差别，常常就是「只有某一边出错」的原因。',
            ],
          },
        ],
      },
      {
        nav: '比对目录',
        kicker: '任务 5',
        title: 'diff -r：哪一台少了文件',
        lead: '`diff -r` 会走进两个目录，逐一对照里面的文件。',
        blocks: [
          { type: 'movie', film: 'diffr' },
          {
            type: 'terminal',
            span: 12,
            prompt: AT_P,
            lines: [
              { cmd: 'diff -r server1_files/ server2_files > missing_files.txt' },
              { cmd: 'cat missing_files.txt', out: ONLY },
            ],
          },
          {
            type: 'text',
            title: '`Only in` 的意思',
            text: [
              '`asset2.js` 只在 `server1_files` 里有，`server2_files` 少了它。',
              '两边都有、内容也一样的文件，`diff` 什么都不说，所以输出只有这一行。',
            ],
          },
          {
            type: 'extra',
            title: '结尾的 `/` 写不写都可以',
            text: '这一行第一个目录有 `/`，第二个没有，结果一样。差别只会出现在输出的路径上，例如 `server1_files/: asset2.js`。',
          },
          {
            type: 'run',
            title: '一步一步看线索怎么收集起来',
            root: P,
            cwd: P,
            tree: {
              config: {
                'nginx.conf': `${NGINX}\n`,
                production: { 'app.conf': null },
                staging: { 'app.conf': null },
              },
              logs: { 'app.log': null },
              server1_files: { 'asset2.js': null },
              server2_files: {},
            },
            commands: [
              { cmd: 'cd logs', note: '先从应用程序的记录开始查。' },
              { cmd: 'grep "ERROR" app.log > error_report.txt', put: ERR, note: '只留下有 `ERROR` 的两行，写进 `logs/error_report.txt`。' },
              { cmd: 'cd ..', note: '回到 `project`。' },
              { cmd: 'grep "ERROR" logs/app.log > error_report.txt', put: ERR, note: '记录里没有这一行，是我补上的：任务 3 要追加的 `~/project/error_report.txt` 必须先存在。' },
              { cmd: "sudo dmesg | grep -i -E 'fail|error' > boot_issues.txt", put: BOOT, note: '内核消息经过管道交给 `grep` 过滤，留下四行。' },
              { cmd: 'cd config', note: '接着看 Nginx 的设置。' },
              { cmd: "grep 'worker_processes' nginx.conf", out: 'worker_processes 4;', note: '先在画面上确认找到的是对的那一行。' },
              { cmd: "grep 'worker_processes' nginx.conf >> ~/project/error_report.txt", put: 'worker_processes 4;', note: '`>>` 接在报告最后面，原本的两行都还在。' },
              { cmd: 'cd ..', note: '回到 `project`。' },
              { cmd: 'diff config/staging/app.conf config/production/app.conf > config_diff.txt', put: DIFF, note: '两个环境的设置差异存起来。' },
              { cmd: 'diff -r server1_files/ server2_files > missing_files.txt', put: ONLY, note: '两台服务器的文件对照。记录里只看得到差异，两边相同的文件这里省略。' },
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
              ['`grep "文本" 文件`', '只印出含有那段文本的行。'],
              ['`grep -i`', '忽略大小写。'],
              ["`grep -E 'a|b'`", '含有 a 或 b 的行都算。'],
              ['`dmesg`', '显示内核消息，通常要加 `sudo`。'],
              ['`命令1 | 命令2`', '管道：命令 1 的输出直接交给命令 2。'],
              ['`diff 文件1 文件2`', '比较两个文件，`<` 是第一个，`>` 是第二个。'],
              ['`diff -r 目录1 目录2`', '比较两个目录，只有一边有的会显示 `Only in`。'],
            ],
          },
          {
            type: 'recap',
            items: [
              '`grep` 是筛子：整份扫过，只留下要的行。',
              '`|` 把命令接成一条生产线，中间的结果不会印在画面上。',
              "引号里的 `'fail|error'` 是「或」，不是管道。",
              '第一次写报告用 `>`，之后追加用 `>>`。',
              '任何命令的输出都能用 `>` 存起来，`grep`、`dmesg`、`diff` 都一样。',
            ],
          },
        ],
      },
    ],
  });
})();
