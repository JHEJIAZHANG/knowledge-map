(function () {
  const P = '/home/labex/project';
  const PROMPT = 'labex:project/ $';
  const BEFORE = '-rw-rw-r-- 1 labex labex 0 Nov 11 18:12 target_file';
  const OWNED = '-rw-rw-r-- 1 user1 group1 0 Nov 11 18:12 target_file';
  const DONE = '-rwxrw---- 1 user1 group1 0 Nov 11 18:12 target_file';

  KnowledgeMap.add({
    id: 'ownership-challenge',
    topic: 'linux',
    group: 'users',
    kind: 'challenge',
    date: '2026-11-11',
    title: '设置文件的主人和权限',
    summary: '创建 target_file，过户给 user1 和 group1，再把权限设成 -rwxrw----。',
    quiz: [
      { q: '`-rwxr-x---` 换成 `chmod` 用的数字是多少？', hint: '输入三位数字', answer: '750', why: '去掉第 1 格类型。拥有者 `rwx` 是 7，用户组 `r-x` 是 4 + 1 = 5，其他人是 0。' },
      { q: '一次把 `target_file` 的拥有者改成 `user1`、用户组改成 `group1`，要输入什么？', answer: 'sudo chown user1:group1 target_file', why: '`chown 拥有者:用户组 文件`，冒号两边各管一个。' },
      { q: '文件过户给 `user1` 之后，`labex` 要改它的权限，为什么需要 `sudo`？', choices: ['`chmod` 每次都要 `sudo`', '只有文件的主人或管理员能改权限', '因为文件是空的'], answer: 1, why: '文件已经不是 `labex` 的了，所以要借用管理员身分。' },
    ],
    sections: [
      {
        nav: '题目',
        kicker: '挑战',
        title: '三步骤完成一个文件',
        lead: '在 `~/project` 创建 `target_file`，换掉它的主人，最后设好权限。',
        blocks: [
          {
            type: 'text',
            title: '任务清单',
            text: [
              '第一步：用 `touch` 创建 `target_file`。',
              '第二步：用 `chown` **一次**把拥有者改成 `user1`、用户组改成 `group1`。',
              '第三步：用 `chmod` 把权限设成 `-rwxrw----`。',
            ],
          },
          {
            type: 'analogy',
            title: '题目给的是字符串，命令要的是数字',
            text: '第三步最关键：题目只告诉你结果长什么样子，你得自己倒推出 `chmod` 要用的数字。',
          },
        ],
      },
      {
        nav: '创建',
        kicker: '第一步',
        title: '创建 target_file',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'touch target_file' },
              { cmd: 'ls', out: 'target_file' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '确认位置',
            text: '提示字符显示 `project/`，代表已经在 `~/project` 里，直接写文件名就好。',
          },
        ],
      },
      {
        nav: '过户',
        kicker: '第二步',
        title: '一次换掉拥有者和用户组',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls -l', out: `total 0\n${BEFORE}` },
              { cmd: 'sudo chown user1:group1 target_file' },
              { cmd: 'ls -l', out: `total 0\n${OWNED}` },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '冒号两边各管一个',
            text: [
              '冒号前 `user1` 是拥有者，冒号后 `group1` 是用户组。',
              '文件原本是 `labex` 的，要送给别人，所以要 `sudo`。',
              '权限 `-rw-rw-r--` 没有变。',
            ],
          },
        ],
      },
      {
        nav: '设权限',
        kicker: '第三步',
        title: '从 -rwxrw---- 倒推出 760',
        lead: '去掉第 1 格类型，剩下每 3 格一组。有字母就加分：`r` 4、`w` 2、`x` 1。',
        blocks: [
          { type: 'movie', film: 'reverse' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls -l', out: `total 0\n${OWNED}` },
              { cmd: 'sudo chmod 760 target_file' },
              { cmd: 'ls -l target_file', out: DONE },
            ],
          },
          {
            type: 'terms',
            span: 5,
            items: [
              ['拥有者 `rwx`', '4 + 2 + 1 = `7`'],
              ['用户组 `rw-`', '4 + 2 = `6`'],
              ['其他人 `---`', '`0`'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '这次为什么一定要 sudo？',
            text: '第二步之后，文件的主人已经是 `user1`，不是 `labex`。只有文件的主人或管理员能改权限，所以这里的 `sudo` 是必要的。对照上一篇的 `script.sh`：那是自己的文件，就不用 `sudo`。',
          },
          {
            type: 'run',
            title: '三个步骤，每一步的变化',
            root: P,
            cwd: P,
            perms: true,
            tree: {},
            commands: [
              { cmd: 'touch target_file', note: '创建空文件，主人是 `labex`，权限 `-rw-rw-r--`。' },
              { cmd: 'ls', out: 'target_file', note: '确认文件已经在 `project` 里。' },
              { cmd: 'sudo chown user1:group1 target_file', note: '拥有者换成 `user1`，用户组换成 `group1`。' },
              { cmd: 'ls -l', out: `total 0\n${OWNED}`, note: '主人换了，权限没变。' },
              { cmd: 'sudo chmod 760 target_file', note: '`7` 给拥有者 `rwx`、`6` 给用户组 `rw-`、`0` 给其他人 `---`。亮起来的是改变的字符。' },
              { cmd: 'ls -l target_file', out: DONE, note: '完成：`-rwxrw---- user1 group1`。' },
            ],
          },
        ],
      },
      {
        nav: '总结',
        kicker: '整理一下',
        title: '这一题学到的事',
        blocks: [
          {
            type: 'recap',
            items: [
              '`chown 拥有者:用户组 文件` 一次换两个。',
              '从字符串倒推数字：去掉类型，每 3 格一组，有字母就加分。',
              '`-rwxrw----` = `760`。',
              '不是自己的文件，改拥有者或权限都要 `sudo`。',
            ],
          },
        ],
      },
    ],
  });
})();
