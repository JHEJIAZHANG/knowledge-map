(function () {
  const P = '/home/labex/project';
  const PROMPT = 'labex:project/ $';
  const JOKER = 'joker@6af8146c68b2:~$';
  const ROW1 = 'joker:x:5001:5001::/home/joker:/bin/sh';
  const ROW2 = 'joker:x:5001:5001::/home/wayne:/bin/sh';
  const ROW3 = 'joker:x:5001:5001::/home/wayne:/bin/bash';
  const ASK = 'New password: \nRetype new password: \npasswd: password updated successfully';
  const WELCOME = 'Password: \nTo run a command as administrator (user "root"), use "sudo <command>".\nSee "man sudo_root" for details.';
  const LOCKMSG = 'passwd: password expiry information changed.';
  // 密码哈希不抄进笔记，只留开头让你认得格式
  const SHADOW = [
    '[sudo] password for joker: ',
    'root:*:19901:0:99999:7:::',
    'daemon:*:19901:0:99999:7:::',
    '…（中间省略）',
    'labex:$y$j9T$…:20771:0:99999:7:::',
    'mysql:!:19922:0:99999:7:::',
    'joker:$y$j9T$…:20771:0:99999:7:::',
    'bob:!:20771:0:99999:7:::',
  ].join('\n');

  // 动画演示右边的数据卡：joker 目前的登记数据
  const card = (title, o = {}) => ({
    title,
    icon: 'user',
    rows: [
      ['用户名', o.name || 'joker'],
      ['密码', o.pw || 'x', o.pwNote || '真正的密码不在名册里'],
      ['UID / GID', '5001 / 5001'],
      ['家目录', o.home || '/home/joker', o.homeNote],
      ['Shell', o.shell || '/bin/sh'],
      ['加入的用户组', o.groups || 'joker'],
      ['状态', o.state || '还没有密码'],
    ],
  });

  KnowledgeMap.add({
    id: 'user-accounts',
    topic: 'linux',
    group: 'users',
    date: '2026-11-14',
    title: '用户账号：创建、修改、锁定、删除',
    summary: '用 useradd 开账号、passwd 设密码、usermod 改数据、su 换身分，最后用 userdel 删掉。',
    quiz: [
      { q: '创建新用户 `alice`，并且顺便创建家目录，要输入什么？', answer: ['sudo useradd -m alice'], why: '`useradd` 创建账号，`-m` 顺便创建家目录。创建账号是管理员的工作，要加 `sudo`。' },
      { q: '`/etc/passwd` 里 `joker:x:5001:…` 的 `x` 代表什么？', choices: ['这个账号没有密码', '密码加密后存在别的地方', '这个账号被锁定了'], answer: 1, why: '`x` 只是占位，真正的密码加密后存在 `/etc/shadow`。' },
      { q: '把 `joker` 加进 `sudo` 用户组，而且保留原本的用户组，要输入什么？', answer: 'sudo usermod -aG sudo joker', why: '`-G` 指定用户组，`-a` 是附加。少了 `a`，原本的用户组会被换掉。' },
      { q: '`sudo passwd -l joker` 之后，`joker` 的密码怎么了？', choices: ['被删掉了，要重新设置', '还在，只是暂时不能用', '变成空白，谁都能登录'], answer: 1, why: '`-l` 只是锁定。用 `-u` 解锁后，原本的密码就能再用。' },
      { q: '删除用户 `bob`，连家目录一起删，要输入什么？', answer: 'sudo userdel -r bob', why: '`userdel` 删账号，`-r` 连家目录一起删。' },
    ],
    sections: [
      {
        nav: 'useradd',
        kicker: '开账号',
        title: 'useradd：创建新用户',
        lead: '先创建一个叫 `joker` 的账号，再到用户名册 `/etc/passwd` 确认。',
        blocks: [
          { type: 'movie', film: 'useradd' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo useradd joker' },
              { cmd: "sudo grep -w 'joker' /etc/passwd", out: ROW1 },
              { cmd: 'id joker', out: 'uid=5001(joker) gid=5001(joker) groups=5001(joker)' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '三个部分',
            text: [
              '`sudo`：暂时借用管理员权限。创建账号是管理工作，一般用户不能做。',
              '`useradd`：创建新用户的命令。',
              '`joker`：新账号的名称。',
              '不加 `sudo` 会看到 **permission denied**。',
            ],
          },
          {
            type: 'analogy',
            title: '/etc/passwd 是用户名册',
            text: '`/etc/passwd` 像一本电话簿。每一行是一个账号，各项数据用冒号 `:` 隔开。',
          },
          {
            type: 'text',
            title: 'grep 在做什么',
            text: [
              '`grep` 在文件里找出含有指定文本的那几行。',
              '`-w` 是整个单字相符才算，这样就不会找到 `joker2` 之类的名字。',
            ],
          },
          {
            type: 'terms',
            items: [
              ['`joker`', '用户名。'],
              ['`x`', '密码的位置。只写 `x`，真正的密码安全地存在别的地方。'],
              ['`5001`', '用户 ID（UID）。'],
              ['`5001`', '用户组 ID（GID）。'],
              ['（空的）', '补充：这一格是备注，可以放全名。没填所以是空的，才会看到两个连在一起的冒号。'],
              ['`/home/joker`', '家目录。名册上写了，**但这个目录还没创建**。'],
              ['`/bin/sh`', '登录后默认使用的 Shell。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: 'id joker 也能确认',
            text: '`id` 后面接账号名称可以查别人。`joker` 的编号是 5001，系统同时帮它建了一个同名的用户组 `joker`。',
          },
        ],
      },
      {
        nav: '-m',
        kicker: '连家一起建',
        title: 'useradd -m：顺便创建家目录',
        lead: '`joker` 只有名册上的一行。创建 `bob` 时加上 `-m`，家目录就会一起建好。',
        blocks: [
          { type: 'movie', film: 'useraddm' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo useradd -m bob' },
              { cmd: 'sudo ls -ld /home/bob', out: 'drwxr-x--- 2 bob bob 57 Nov 14 16:28 /home/bob' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '看懂这一行',
            text: [
              '开头的 `d` 代表这是目录。',
              '拥有者和用户组都是 `bob`。',
              '`rwxr-x---`：`bob` 可以读、写、进入，其他人什么都不能做。',
              '`ls -ld` 的 `-d` 是只看目录本身，不列出里面。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '为什么这里的 ls 也加 sudo？',
            text: '`/home/bob` 其他人的权限是 `---`。加上 `sudo` 用管理员身分看，就不会被权限挡住。',
          },
        ],
      },
      {
        nav: 'passwd',
        kicker: '设密码',
        title: 'passwd：帮账号设密码',
        lead: '刚创建的账号还没有密码，没办法用密码登录。',
        blocks: [
          { type: 'movie', film: 'passwd' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [{ cmd: 'sudo passwd joker', out: ASK }],
          },
          {
            type: 'text',
            span: 5,
            title: '会问两次',
            text: [
              '`New password:` 输入新密码。',
              '`Retype new password:` 再打一次确认。',
              '两次一样，才会显示 `password updated successfully`。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '打字时画面没反应是正常的',
            text: '输入密码时，画面不会显示任何字，连星号都没有。这是为了不让旁边的人看到密码有几个字。照常打完按 Enter 就好。',
          },
        ],
      },
      {
        nav: 'usermod',
        kicker: '改数据',
        title: 'usermod：修改账号的设置',
        lead: '`usermod` 是 user modify。账号建好之后，想改名册上的哪一格，就用对应的选项。',
        blocks: [
          { type: 'movie', film: 'usermod' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo usermod -d /home/wayne joker' },
              { cmd: "sudo grep -w 'joker' /etc/passwd", out: ROW2 },
              { cmd: 'sudo usermod -s /bin/bash joker' },
              { cmd: "sudo grep -w 'joker' /etc/passwd", out: ROW3 },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '两个选项',
            text: [
              '`-d /home/wayne`：把家目录那一格改成 `/home/wayne`。',
              '`-s /bin/bash`：把 Shell 那一格改成 `/bin/bash`。',
              '每改一次，就用 `grep` 再看一次名册确认。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '-d 只改名册上的纪录',
            text: '`usermod -d` 只是把名册上的字改掉，不会帮你创建 `/home/wayne`，也不会搬动旧家目录的内容。要连内容一起搬，得再加 `-m`：`usermod -d 新位置 -m 账号`。',
          },
        ],
      },
      {
        nav: 'su',
        kicker: '换身分',
        title: '加入 sudo 用户组，再用 su 换成 joker',
        lead: '把 `joker` 加进 `sudo` 用户组，它就能使用 `sudo`。接着换成 `joker` 实际试一次。',
        blocks: [
          { type: 'movie', film: 'su' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo usermod -aG sudo joker' },
              { cmd: 'groups joker', out: 'joker : joker sudo' },
              { cmd: 'su - joker', out: WELCOME },
              { prompt: JOKER, cmd: 'sudo cat /etc/shadow', out: SHADOW },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '一步一步看',
            text: [
              '`-aG sudo`：`G` 指定用户组，`a` 是附加，保留原本的用户组。',
              '`groups joker`：列出 `joker` 加入的用户组，现在有 `joker` 和 `sudo`。',
              '`su - joker`：换成 `joker`，要输入 `joker` 的密码。',
              '提示字符变成 `joker@…:~$`，代表现在是 `joker`。',
              '`joker` 用 `sudo` 成功读到 `/etc/shadow`，证明它有管理员权限了。',
            ],
          },
          {
            type: 'analogy',
            title: '/etc/shadow 是密码保险箱',
            text: '名册 `/etc/passwd` 每个人都能看，所以密码那格只写 `x`。真正的密码加密后放在 `/etc/shadow`，只有管理员能读。',
          },
          {
            type: 'extra',
            title: 'shadow 第二格怎么看',
            text: [
              '`$y$j9T$…` 一长串：加密后的密码。`labex` 和 `joker` 都设过密码。',
              '`*` 或 `!`：不能用密码登录。`bob` 还没设密码，所以是 `!`。',
              '这一串虽然加密过，也不要贴到公开的地方。笔记里只留开头。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: 'Display all 181 possibilities?',
            text: '你打到 `sudo cat /etc/` 时按了 Tab。Tab 会自动补完文件名，可是 `/etc/` 里有 181 个候选，Shell 先问你要不要全部列出来。按 `n` 取消，再多打几个字（例如 `sh`）后按 Tab，就会补成 `shadow`。',
          },
        ],
      },
      {
        nav: '锁定',
        kicker: '暂时停用',
        title: 'passwd -l 锁定，-u 解锁',
        lead: '不想删账号，只想让它暂时不能登录，就用锁定。',
        blocks: [
          { type: 'movie', film: 'lock' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo passwd -l joker', out: LOCKMSG },
              { cmd: 'su - joker', out: 'Password: \nsu: Authentication failure', err: true },
              { cmd: 'sudo passwd -u joker', out: LOCKMSG },
              { cmd: 'su - joker', out: WELCOME },
              { prompt: JOKER, cmd: 'exit', out: 'logout' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '发生了什么？',
            text: [
              '`-l`（lock）之后，密码打对也会 `Authentication failure`。',
              '`-u`（unlock）之后，原本的密码又能用，不用重设。',
              '`exit` 离开 `joker`，回到 `labex`。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '锁定其实是在密码前面加一个 !',
            text: '`passwd -l` 会在 `/etc/shadow` 里那串加密密码的最前面加上 `!`，让任何密码都对不上。`-u` 再把 `!` 拿掉。所以密码本身一直都在。',
          },
        ],
      },
      {
        nav: 'userdel',
        kicker: '删账号',
        title: 'userdel -r：删除用户和家目录',
        lead: '`bob` 用不到了。删掉账号，再确认名册和家目录都清干净。',
        blocks: [
          { type: 'movie', film: 'userdel' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'sudo userdel -r bob' },
              { cmd: "sudo grep -w 'bob' /etc/passwd" },
              { cmd: 'sudo ls -ld /home/bob' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '三个命令',
            text: [
              '`userdel` 删除账号，`-r` 连家目录一起删。',
              '第二行到名册找 `bob`。',
              '第三行看 `/home/bob` 还在不在。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '删成功会看到什么？',
            text: '`grep` 找不到东西时什么都不印，所以第二行没有输出就是对的。第三行会出现 `No such file or directory`，代表家目录也不在了。',
          },
          {
            type: 'run',
            title: 'joker 的登记数据，每一步怎么变',
            root: P,
            cwd: P,
            tree: {},
            startInfo: { title: 'joker 还不存在', icon: 'user', rows: [['/etc/passwd', '找不到 joker', '先用 useradd 创建']] },
            commands: [
              { cmd: 'sudo useradd joker', note: '名册多了一行。家目录只是写着，还没创建。', info: card('名册多了 joker', { name: '!joker', homeNote: '目录还没创建' }) },
              { cmd: "sudo grep -w 'joker' /etc/passwd", out: ROW1, note: '到名册里找出 `joker` 那一行，和右边的数据一格一格对得上。', info: card('joker:x:5001:5001::/home/joker:/bin/sh', { homeNote: '目录还没创建' }) },
              { cmd: 'sudo passwd joker', out: ASK, note: '设好密码。名册上那一格还是 `x`，密码存在 `/etc/shadow`。', info: card('设置密码', { pwNote: '加密后存在 /etc/shadow', state: '!可以用密码登录' }) },
              { cmd: 'sudo usermod -d /home/wayne joker', note: '`-d` 改家目录那一格。', info: card('改家目录', { home: '!/home/wayne', homeNote: '只改纪录，不会创建目录', state: '可以用密码登录' }) },
              { cmd: 'sudo usermod -s /bin/bash joker', note: '`-s` 改 Shell 那一格。', info: card('改 Shell', { home: '/home/wayne', shell: '!/bin/bash', state: '可以用密码登录' }) },
              { cmd: 'sudo usermod -aG sudo joker', note: '`-aG` 多加入 `sudo` 用户组，原本的 `joker` 用户组保留。', info: card('加入 sudo 用户组', { home: '/home/wayne', shell: '/bin/bash', groups: '!joker、sudo', state: '可以用密码登录' }) },
              { cmd: 'groups joker', out: 'joker : joker sudo', note: '确认：`joker` 现在有两个用户组。', info: card('加入 sudo 用户组', { home: '/home/wayne', shell: '/bin/bash', groups: 'joker、sudo', state: '可以用密码登录' }) },
              { cmd: 'sudo passwd -l joker', out: LOCKMSG, note: '`-l` 锁定。密码还在，只是不能用。', info: card('锁定账号', { home: '/home/wayne', shell: '/bin/bash', groups: 'joker、sudo', state: '!已锁定' }) },
              { cmd: 'su - joker', out: 'Password: \nsu: Authentication failure', err: true, note: '锁定中，密码打对也进不去。', info: card('登录失败', { home: '/home/wayne', shell: '/bin/bash', groups: 'joker、sudo', state: '!已锁定' }) },
              { cmd: 'sudo passwd -u joker', out: LOCKMSG, note: '`-u` 解锁，原本的密码又能用了。', info: card('解锁账号', { home: '/home/wayne', shell: '/bin/bash', groups: 'joker、sudo', state: '!可以用密码登录' }) },
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
              '`sudo useradd 账号` 创建用户，加 `-m` 顺便创建家目录。',
              '`/etc/passwd` 是用户名册，一行一个账号，用冒号分隔。',
              '`sudo passwd 账号` 设密码。密码加密后存在 `/etc/shadow`。',
              '`usermod`：`-d` 改家目录、`-s` 改 Shell、`-aG` 加入用户组。',
              '`su - 账号` 换成别的用户，`exit` 回来。',
              '`passwd -l` 锁定、`-u` 解锁。',
              '`sudo userdel -r 账号` 删除用户和家目录。',
            ],
          },
        ],
      },
    ],
  });
})();
