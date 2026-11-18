/* 加深印象的补充内容。格式说明见 content/topics.js。
 * 这个文件里的东西都不在原始笔记里，页面上会标成「补充」。
 * 错误消息照 LabEx 的环境写（shell 是 zsh）。
 */
(function () {
  const KM = window.KnowledgeMap;

  const ID = 'uid=5000(labex) gid=5000(labex) groups=5000(labex),27(sudo),121(ssl-cert),5002(public)';

  // 01 第一次用终端机 ------------------------------------------------------------
  KM.deepen('linux-first-commands', {
    story: {
      title: '接手一台陌生的机器',
      lead: '同事把一台服务器交给你。动手之前，先确认两件事：它有在听你说话，以及你现在是用谁的身分。',
      steps: [
        { say: '先试一句最简单的，确认终端机有反应。', cmd: 'echo "Hello World"', note: '文本原样印回来，代表命令有被运行。' },
        { say: '接着问：我现在是用哪个账号登录的？', cmd: 'whoami' },
        { say: '光有名字不够，还要知道这个账号属于哪些用户组，例如能不能用 `sudo`。', cmd: 'id', note: '用户组里有 `sudo`，代表可以请管理员出面。' },
        { say: '顺便看一下管理员本人的数据长什么样子。', cmd: 'id root', note: '管理员的编号永远是 `0`。' },
        { say: '之后要把名字写进脚本，只需要名字那一小段。', cmd: 'id -un' },
      ],
    },
    at: {
      echo: [{
        type: 'oops', title: '开头打成大写',
        wrong: 'Echo "Hello World"',
        out: 'zsh: command not found: Echo',
        why: 'Linux 会区分大小写。`echo` 和 `Echo` 是两个不同的名字，而系统里没有叫 `Echo` 的命令。',
        right: 'echo "Hello World"',
        fix: '看到 `command not found`，先检查拼字和大小写。',
      }],
      whoami: [{
        type: 'behind', title: '`whoami` 和 `id` 的答案从哪里来',
        cmd: 'id',
        places: [
          { where: '/etc/passwd', what: '账号名册，查名字和编号', rows: ['root:x:0:0:root:/root:/bin/bash', ['read', 'labex:x:5000:5000::/home/labex:/usr/bin/zsh']] },
          { where: '/etc/group', what: '用户组名单，查你在哪些用户组里', rows: [['read', 'sudo:x:27:labex'], ['read', 'public:x:5002:labex']] },
        ],
        note: '这两个命令都**只读不写**。系统只记得你的编号（`5000`），名字是到名册里查出来的；`id` 会再到用户组名单找出所有写着你名字的用户组。',
      }],
      'id root': [{
        type: 'oops', title: '查一个不存在的人',
        wrong: 'id nobody123',
        out: "id: 'nobody123': no such user",
        why: '`id` 后面的名字要在名册里找得到。名字打错、或这个账号还没创建，都会看到这句。',
        right: 'id root',
        fix: '这也是检查「某个账号存不存在」最快的方法。',
      }],
    },
    poster: {
      title: '打招呼，然后确认我是谁',
      lanes: [
        { name: '让电脑说话', nodes: [{ cmd: 'echo "文本"', does: '把文本原样印出来' }] },
        {
          name: '确认身分', nodes: [
            { cmd: 'whoami', does: '只印用户名' },
            { cmd: 'id', does: '编号、主要用户组、所有用户组' },
            { cmd: 'id root', does: '查别人的身分' },
            { cmd: 'id -un', does: '只要名字，结果和 `whoami` 一样' },
          ],
        },
      ],
      line: '动手之前，先确认「我是谁」。',
    },
  });

  // 02 挑战：查出目前的用户 ----------------------------------------------------
  KM.deepen('whoami-challenge', {
    story: {
      title: '脚本需要知道是谁在运行',
      lead: '题目要的「只印出用户名」，在实际工作里很常见。',
      steps: [
        { say: '你写了一个备份脚本，想让备份文件的文件名带上运行者的名字，之后才知道是谁备份的。' },
        { say: '所以需要一个命令，输出**刚好只有名字**，没有多余的字。', cmd: 'whoami' },
        { say: '如果用 `id`，会多出编号和一长串用户组，还得另外把名字切出来。', cmd: 'id', note: `输出是 \`${ID}\`，不能直接拿来当文件名。` },
      ],
    },
    at: {
      解法: [{
        type: 'oops', title: '想用 `whoami` 查别人',
        wrong: 'whoami root',
        out: "whoami: extra operand 'root'\nTry 'whoami --help' for more information.",
        why: '`whoami` 只回答「我自己是谁」，后面不能接任何东西。',
        right: 'id -un root',
        rightLabel: '要查别人，改用 id',
        fix: '`id` 可以接名字，`-un` 让它只印名字。',
      }],
    },
    poster: {
      title: '从题目的条件挑命令',
      lanes: [
        { name: '题目要的', nodes: [{ cmd: '条件 1', does: '查出**目前**的用户' }, { cmd: '条件 2', does: '**只**印出名称' }] },
        {
          name: '候选命令', nodes: [
            { cmd: 'whoami', does: '只印名字，两个条件都符合' },
            { cmd: 'id -un', does: '也只印名字，同样符合' },
            { cmd: 'id', does: '多了编号和用户组，不符合条件 2' },
            { cmd: 'id root', does: '查的是别人，不符合条件 1' },
          ],
        },
      ],
      line: '先读清楚题目要什么，再挑刚好符合的命令。',
    },
  });

  // 03 用 pwd、ls、cd 认路 -------------------------------------------------------
  KM.deepen('navigate-directories', {
    story: {
      title: '在陌生的机器上找到项目',
      lead: '刚连上一台机器，画面上只有一个提示字符。项目在哪里？',
      steps: [
        { say: '第一件事：我现在站在哪里？', cmd: 'pwd' },
        { say: '看看这一间里有什么。', cmd: 'ls' },
        { say: '走错地方了，先退回上一层看看。', cmd: 'cd ..' },
        { say: '看到 `project` 了，走进去。', cmd: 'cd project' },
        { say: '逛到不知道自己在哪也没关系，一句话就能回家。', cmd: 'cd ~' },
        { say: '知道完整地址的话，从哪里出发都能直接到。', cmd: 'cd /home/labex/project' },
      ],
    },
    at: {
      cd: [
        {
          type: 'oops', title: '地址开头少了一个 `/`',
          wrong: 'cd home/labex/project',
          out: 'cd: no such file or directory: home/labex/project',
          why: '没有 `/` 开头就是**相对路径**，意思是「从我现在这一间里面找 `home`」。目前这一间没有叫 `home` 的房间，所以找不到。',
          right: 'cd /home/labex/project',
          fix: '`/` 开头代表从大楼的大门开始算，在哪里下命令都走得到。',
        },
        {
          type: 'behind', title: '`cd` 改的不是硬盘',
          cmd: 'cd ..',
          places: [{
            where: '这个终端机的「目前位置」', what: '只记在这个窗口里',
            rows: [['del', '/home/labex/project'], ['add', '/home/labex']],
          }],
          note: '硬盘上没有任何东西被改动，变的只有终端机记住的那一行位置。所以再开一个终端机，它的位置不会跟着变。',
        },
      ],
    },
    poster: {
      title: '认路三步骤',
      lanes: [
        {
          name: '每到一个新地方', flow: true, nodes: [
            { cmd: 'pwd', does: '我在哪里' },
            { cmd: 'ls', does: '这里有什么' },
            { cmd: 'cd 目录', does: '走过去' },
          ],
        },
        {
          name: '地址的写法', nodes: [
            { cmd: '/home/labex', does: '绝对路径：从最上层开始的完整地址' },
            { cmd: 'project', does: '相对路径：从目前位置算起' },
            { cmd: '..', does: '上一层' },
            { cmd: '~', does: '自己的家目录' },
          ],
        },
      ],
      line: '先 pwd，再 ls，最后 cd。',
    },
  });

  // 04 创建文件与目录 ------------------------------------------------------------
  KM.deepen('create-and-list', {
    story: {
      title: '开一个新项目',
      lead: '新项目的第一天，文件夹里什么都没有。',
      steps: [
        { say: '先走进项目的目录。', cmd: 'cd /home/labex/project' },
        { say: '放一个空的文件，内容之后再写。', cmd: 'touch file1.txt' },
        { say: '另一个文件想顺便写进第一行字。', cmd: 'echo "Hello, Linux" > file2.txt' },
        { say: '配置文件不想每次 `ls` 都出现，文件名前面加一个点。', cmd: 'echo "Hidden file" > .hiddenfile' },
        { say: '东西会越来越多，先开一个文件夹分类。', cmd: 'mkdir testdir' },
        { say: '最后检查成果，连隐藏文件和详细数据一起看。', cmd: 'ls -la' },
      ],
    },
    at: {
      创建: [
        {
          type: 'oops', title: '一个 `>` 把原本的内容盖掉',
          wrong: 'echo "第二行" > file2.txt',
          state: { label: 'file2.txt 的内容', before: ['Hello, Linux'], after: ['第二行'] },
          why: '`>` 会**先清空文件**再写入，不会询问。原本想加一行，结果旧的那行不见了。',
          right: 'echo "第二行" >> file2.txt',
          fix: '两个 `>>` 才是接在后面。',
        },
        {
          type: 'behind', title: '创建文件，其实是在名单上多写一个名字',
          cmd: 'touch file1.txt',
          places: [{
            where: '/home/labex/project', what: '目录本身是一张名单',
            rows: [['add', 'file1.txt　→　一个大小为 0 的新文件']],
          }],
          note: '目录记的是「这里有哪些名字」。`touch` 在名单上加一个名字，并准备一个空文件。如果名字已经存在，`touch` 不会动内容，只会更新修改时间。',
        },
        {
          type: 'oops', title: '同一个目录建第二次',
          wrong: 'mkdir testdir',
          out: "mkdir: cannot create directory 'testdir': File exists",
          why: '同一个地方不能有两个同名的东西。消息里写 `File`，但其实文件和目录都算。',
          right: 'mkdir -p testdir',
          fix: '加上 `-p`，已经存在就安静地跳过。',
        },
      ],
      'ls -a': [{
        type: 'oops', title: '以为配置文件不见了',
        wrong: 'ls',
        state: { label: 'ls 列出来的名字', before: ['file1.txt', 'file2.txt', 'testdir', '.hiddenfile'], after: ['file1.txt', 'file2.txt', 'testdir'] },
        why: '点开头的文件还在，只是 `ls` 默认不显示。很多人第一次遇到会以为文件被删了。',
        right: 'ls -a',
      }],
    },
    poster: {
      title: '做出东西，再看清楚',
      lanes: [
        {
          name: '创建', nodes: [
            { cmd: 'touch 文件名', does: '创建空文件' },
            { cmd: 'echo "字" > 文件名', does: '创建文件并写入，旧内容会被盖掉' },
            { cmd: 'mkdir 目录', does: '创建目录' },
          ],
        },
        {
          name: '查看', nodes: [
            { cmd: 'ls', does: '只列名字' },
            { cmd: 'ls -l', does: '加上权限、主人、大小、时间' },
            { cmd: 'ls -a', does: '连点开头的隐藏文件也列出来' },
            { cmd: 'ls -la', does: '两个一起用' },
          ],
        },
      ],
      line: '做完一步就 ls 一次，确认结果和想的一样。',
    },
  });

  // 05 cp 和 mv ------------------------------------------------------------------
  KM.deepen('copy-and-move', {
    story: {
      title: '改文件之前先留一份',
      lead: '要动到重要的文件时，先备份再改，是最基本的保险。',
      steps: [
        { say: '要修改 `file1.txt`，怕改坏，先复制一份。', cmd: 'cp file1.txt file1_copy.txt' },
        { say: '另一个文件想在文件夹里也放一份。', cmd: 'cp file2.txt testdir/' },
        { say: '整个文件夹也想留一份备份。', cmd: 'cp -r testdir testdir_copy' },
        { say: '文件名取得不好，换一个。', cmd: 'mv file1.txt newname.txt' },
        { say: '改完了，收进文件夹。', cmd: 'mv newname.txt testdir/' },
      ],
    },
    at: {
      cp: [{
        type: 'oops', title: '复制目录忘了 `-r`',
        wrong: 'cp testdir testdir_copy',
        out: "cp: -r not specified; omitting directory 'testdir'",
        why: '`cp` 默认只处理单一文件。目录里还有东西，要明确告诉它「连里面一起」。消息说的 `omitting` 是「跳过」，也就是什么都没复制。',
        right: 'cp -r testdir testdir_copy',
      }],
      mv: [
        {
          type: 'oops', title: '新名字已经有人用了',
          wrong: 'mv file1.txt file2.txt',
          state: { label: '目录里的文件', before: ['file1.txt', 'file2.txt（Hello, Linux）'], after: ['file2.txt（原本 file1 的内容）'] },
          why: '目的地已经有同名的文件时，`mv` 不会问，直接盖过去。原本 `file2.txt` 的内容就这样没了。`cp` 也有一样的行为。',
          right: 'mv -i file1.txt file2.txt',
          fix: '加上 `-i`，要盖掉东西之前会先问你。',
        },
        {
          type: 'behind', title: '为什么 `mv` 改名一瞬间就完成',
          cmd: 'mv file1.txt newname.txt',
          places: [{
            where: '/home/labex/project', what: '目录的名单',
            rows: ['file2.txt　→　数据', ['del', 'file1.txt　→　数据'], ['add', 'newname.txt　→　同一份数据']],
          }],
          note: '在同一颗硬盘里，`mv` 只改名单上的名字，数据本身没有搬动，所以文件再大也一样快。`cp` 则是真的再写一份数据，文件越大越久。',
        },
      ],
    },
    poster: {
      title: '多一份，还是只有一份',
      lanes: [
        {
          name: 'cp：做完之后有两份', nodes: [
            { cmd: 'cp A B', does: '复制成另一个名字' },
            { cmd: 'cp A 目录/', does: '复制一份放进目录' },
            { cmd: 'cp -r 目录 新目录', does: '整个目录连内容一起复制' },
          ],
        },
        {
          name: 'mv：做完之后还是一份', nodes: [
            { cmd: 'mv 旧名 新名', does: '改名' },
            { cmd: 'mv 文件 目录/', does: '搬进目录' },
            { cmd: 'mv 目录 新名', does: '目录也能直接改名，不用 `-r`' },
          ],
        },
      ],
      line: 'cp 会多出一份，mv 永远只有一份。',
    },
  });

  // 06 rm ------------------------------------------------------------------------
  KM.deepen('delete-files', {
    story: {
      title: '清掉用完的测试数据',
      lead: '练习完留下一堆文件。删除没有后悔药，所以顺序很重要：先看，再删。',
      steps: [
        { say: '先确认自己站在对的目录。', cmd: 'pwd' },
        { say: '把这里有什么看清楚，包含隐藏文件。', cmd: 'ls -la' },
        { say: '确定不要的文件，直接删。', cmd: 'rm original_file1.txt' },
        { say: '不太确定的，让它先问一次。', cmd: 'rm -i file2.txt' },
        { say: '有东西的文件夹，要连里面一起删。', cmd: 'rm -r testdir' },
        { say: '最后再看一次，确认只删了该删的。', cmd: 'ls -a' },
      ],
    },
    at: {
      rm: [{
        type: 'behind', title: '`rm` 之后，文件去哪了',
        cmd: 'rm original_file1.txt',
        places: [{
          where: '/home/labex/project', what: '目录的名单',
          rows: ['file2.txt　→　数据', ['del', 'original_file1.txt　→　数据']],
        }],
        note: '`rm` 做的是把名字从名单上划掉。没有任何名字指向那份数据之后，系统就把那块空间标成「可以再用」。中间没有资源回收桶这一站，所以找不回来。',
      }],
      目录: [{
        type: 'oops', title: '用 `rm` 删目录，却没加 `-r`',
        wrong: 'rm testdir',
        out: "rm: cannot remove 'testdir': Is a directory",
        why: '`rm` 默认只删文件。这其实是一道保护：要删掉整个目录，必须明确加上 `-r`。',
        right: 'rm -r testdir',
      }],
      'rm -rf': [{
        type: 'oops', title: '多打一个空白，删到别的东西',
        wrong: 'rm -rf temp _dir',
        state: { label: '目前目录里的东西', before: ['temp', 'temp_dir', 'notes.txt'], after: ['temp_dir', 'notes.txt'] },
        why: [
          '空白把一个名字切成了两个：`temp` 和 `_dir`。刚好有一个叫 `temp` 的目录，于是它被整个删掉。',
          '`_dir` 不存在，本来会有错误消息，但 `-f` 把消息吞掉了。画面一片安静，你不会知道删错了。',
        ],
        right: 'ls temp_dir',
        rightLabel: '先用 ls 确认对象',
        fix: '看到的内容没错，再按 ↑ 把 `ls` 改成 `rm -r`。',
      }],
    },
    poster: {
      title: '删除的四种力道',
      lanes: [
        {
          name: '删文件', nodes: [
            { cmd: 'rm 文件', does: '直接删，不会问' },
            { cmd: 'rm -i 文件', does: '删之前先问一次' },
          ],
        },
        {
          name: '删目录', nodes: [
            { cmd: 'rmdir 目录', does: '只能删空的目录' },
            { cmd: 'rm -r 目录', does: '连里面的东西一起删' },
            { cmd: 'rm -rf 目录', does: '不问、不报错，最危险' },
          ],
        },
      ],
      line: '终端机没有资源回收桶。先 ls，看清楚再删。',
    },
  });

  // 07 cat、head、tail、diff ------------------------------------------------------
  KM.deepen('read-and-compare', {
    story: {
      title: '同事说他只改了一个地方',
      lead: '有人动过配置文件，你想知道现在的内容，以及到底改了什么。',
      steps: [
        { say: '文件不长，先整份看一遍。', cmd: 'cat /tmp/hello' },
        { say: '要和同事讨论「第几行」，加上行号比较好讲。', cmd: 'cat -n /tmp/hello' },
        { say: '很长的文件只想确认开头。', cmd: 'head -n1 /tmp/hello' },
        { say: '日志文件最新的内容都在最后面，所以看结尾。', cmd: 'tail -n1 /tmp/hello' },
        { say: '最后拿改过的和原本的比，让电脑告诉你差在哪。', cmd: 'diff file1 file2' },
      ],
    },
    at: {
      cat: [
        {
          type: 'behind', title: '这一篇的命令都只读不写',
          cmd: 'cat /tmp/hello',
          places: [{
            where: '/tmp/hello', what: '内容原封不动',
            rows: [['read', 'Hi,'], ['read', 'I am Labby!']],
          }],
          note: '`cat`、`head`、`tail`、`diff` 只是把内容读出来印在屏幕上，不会改文件，连 `ls -l` 看到的修改时间都不会变。想看什么就放心看。',
        },
        {
          type: 'oops', title: '用 `cat` 打开几千行的文件',
          wrong: 'cat /var/log/syslog',
          out: '（几千行一口气往上卷，停下来时只剩最后一页）',
          why: '`cat` 不管文件多长都会全部印出来。日志文件动辄上万行，画面会被洗掉，前面的内容也卷不回去。',
          right: 'tail -n 20 /var/log/syslog',
          rightLabel: '只看最后 20 行',
          fix: '日志文件最新的在最后面，所以通常用 `tail`。',
        },
      ],
      diff: [{
        type: 'oops', title: '`diff` 什么都没印，以为坏了',
        wrong: 'diff file1 file1',
        out: '（没有任何输出）',
        why: '`diff` 没有输出，意思是**两边完全相同**。这里是不小心把同一个文件名打了两次。',
        right: 'diff file1 file2',
        fix: '很多 Linux 命令都一样：没消息就是好消息。',
      }],
    },
    poster: {
      title: '想看多少，就用哪一个',
      lanes: [
        {
          name: '看一个文件', nodes: [
            { cmd: 'cat 文件', does: '全部' },
            { cmd: 'cat -n 文件', does: '全部，加上行号' },
            { cmd: 'head -n1 文件', does: '开头 1 行' },
            { cmd: 'tail -n1 文件', does: '结尾 1 行' },
            { cmd: 'head -c1 / tail -c1', does: '改用字节来算' },
          ],
        },
        {
          name: '比两个', nodes: [
            { cmd: 'diff A B', does: '列出不一样的行' },
            { cmd: 'diff -r 目录A 目录B', does: '比较整个目录' },
          ],
        },
      ],
      line: '全部用 cat，开头用 head，结尾用 tail，找不同用 diff。',
    },
  });

  // 08 挑战：比较两份稿件 --------------------------------------------------------
  KM.deepen('manuscript-challenge', {
    story: {
      title: '对方说合约只改了一个字',
      lead: '题目里的两份稿件，换成工作上的情境就是这样。',
      steps: [
        { say: '对方寄回「修改后」的版本，说只动了一个小地方。你想自己确认。' },
        { say: '先把原稿整份看过，知道大概有什么。', cmd: 'cat manuscript_v1.txt' },
        { say: '新版的开头有没有变？', cmd: 'head -n2 manuscript_v2.txt' },
        { say: '结尾呢？两份各看最后一行。', cmd: 'tail -n1 manuscript_v1.txt', note: '再对 `manuscript_v2.txt` 做一次，用眼睛比。' },
        { say: '人眼会漏掉细节，最后交给电脑逐行比对。', cmd: 'diff manuscript_v1.txt manuscript_v2.txt' },
      ],
    },
    at: {
      比较: [{
        type: 'oops', title: '两个文件名写反了',
        wrong: 'diff manuscript_v2.txt manuscript_v1.txt',
        out: '（原本 < 开头的行变成 > 开头，> 开头的变成 <）',
        why: '`<` 永远是**第一个**文件的内容，`>` 是第二个。顺序写反，就会把「新加的」看成「被删掉的」。',
        right: 'diff manuscript_v1.txt manuscript_v2.txt',
        fix: '养成习惯：旧的写前面，新的写后面。',
      }],
    },
    poster: {
      title: '先用眼睛看大概，再让 diff 找细节',
      lanes: [{
        name: '解题的顺序', flow: true, nodes: [
          { cmd: 'cat v1', does: '看原稿全貌' },
          { cmd: 'head -n2 v2', does: '比开头' },
          { cmd: 'tail -n1', does: '两份各比结尾' },
          { cmd: 'diff v1 v2', does: '逐行找出差异' },
        ],
      }],
      line: '人眼会漏，diff 不会。',
    },
  });

  // 09 文件的主人与 chown --------------------------------------------------------
  KM.deepen('owner-chown', {
    story: {
      title: '把做好的东西交接出去',
      lead: '你替别人准备好一整个文件夹，最后要把「主人」换成对方。',
      steps: [
        { say: '一次把两层文件夹建好。', cmd: 'mkdir -p new-dir/subdir' },
        { say: '放进文件。', cmd: 'echo "Hello, world" > new-dir/file1.txt' },
        { say: '看一下现在的主人是谁。', cmd: 'ls -lR new-dir', note: '全部都是你创建的，所以主人都是 `labex`。' },
        { say: '把整个文件夹连同里面的东西一起过户。这里照笔记，过户给 `root`。', cmd: 'sudo chown -R root:root new-dir' },
        { say: '再看一次，确认每一层都换了。', cmd: 'ls -lR new-dir' },
      ],
    },
    at: {
      chown: [
        {
          type: 'oops', title: '没加 `sudo` 就想过户',
          wrong: 'chown root:root example.txt',
          out: "chown: changing ownership of 'example.txt': Operation not permitted",
          why: '就算文件是你的，一般用户也不能把它送给别人，过户只有管理员能办。',
          right: 'sudo chown root:root example.txt',
        },
        {
          type: 'behind', title: '主人记在文件的「数据卡」上',
          cmd: 'sudo chown root:root example.txt',
          places: [{
            where: 'example.txt 的数据卡', what: '`ls -l` 印出来的就是这张卡',
            rows: ['权限　-rw-rw-r--', ['edit', '主人　labex → root'], ['edit', '用户组　labex → root'], '内容　（没有动）'],
          }],
          note: '每个文件除了内容，还有一张数据卡记着权限、主人、用户组、大小和时间（正式名称是 inode）。`chown` 只改卡上的两格，文件内容完全没碰。',
        },
      ],
      'chown -R': [{
        type: 'oops', title: '过户目录忘了 `-R`',
        wrong: 'sudo chown root:root new-dir',
        state: { label: '有换到主人的（划掉的没换到）', before: ['new-dir', 'new-dir/file1.txt', 'new-dir/subdir', 'new-dir/subdir/file2.txt'], after: ['new-dir'] },
        why: '没有 `-R`，只会改目录本身那一张数据卡。里面的文件和子目录，主人还是原来的人。',
        right: 'sudo chown -R root:root new-dir',
        fix: '注意这里是**大写** `-R`，和 `cp -r` 的小写不同。',
      }],
      'mkdir -p': [{
        type: 'oops', title: '外层还没建，就想建里层',
        wrong: 'mkdir new-dir/subdir',
        out: "mkdir: cannot create directory 'new-dir/subdir': No such file or directory",
        why: '`new-dir` 还不存在，没办法在里面建 `subdir`。消息说的「找不到」，指的是外层那一间。',
        right: 'mkdir -p new-dir/subdir',
        fix: '`-p` 会把路上缺的每一层都补起来。',
      }],
    },
    poster: {
      title: '读懂权限字符串，再办过户',
      lanes: [
        {
          name: '-rw-rw-r-- 怎么切', flow: true, nodes: [
            { cmd: '-', does: '种类：`-` 是文件，`d` 是目录' },
            { cmd: 'rw-', does: '**主人**能做什么' },
            { cmd: 'rw-', does: '**用户组**能做什么' },
            { cmd: 'r--', does: '**其他人**能做什么' },
          ],
        },
        {
          name: '换主人', nodes: [
            { cmd: 'sudo chown 主人:用户组 文件', does: '换掉一个文件的主人和用户组' },
            { cmd: 'sudo chown -R 主人:用户组 目录', does: '连目录里的每一层一起换' },
            { cmd: 'mkdir -p a/b', does: '一次建好多层目录' },
          ],
        },
      ],
      line: '一个种类，加上三组 rwx：主人、用户组、其他人。',
    },
  });

  // 10 chmod ---------------------------------------------------------------------
  KM.deepen('chmod', {
    story: {
      title: '写好的脚本跑不起来',
      lead: '这是每个人第一次写脚本都会遇到的事。',
      steps: [
        { say: '你把几行命令存成 `script.sh`，想直接运行。', cmd: './script.sh', note: '结果是 `zsh: permission denied: ./script.sh`。' },
        { say: '被拒绝了，先看它的权限。', cmd: 'ls -l script.sh', note: '权限是 `-rw-rw-r--`，三组里都没有 `x`。' },
        { say: '帮主人加上运行的权限：主人 7、用户组 6、其他人 4。', cmd: 'sudo chmod 764 script.sh' },
        { say: '再跑一次。', cmd: './script.sh' },
      ],
    },
    at: {
      数字: [{
        type: 'oops', title: '三个数字的顺序记反了',
        wrong: 'chmod 467 script.sh',
        out: '-r--rw-rwx　（主人只能读，其他人什么都能做）',
        why: '三个数字的顺序固定是**主人、用户组、其他人**。想给主人 `7`，却写在最后一位，结果完全相反。',
        right: 'chmod 764 script.sh',
        fix: '改完用 `ls -l` 看一眼字符串，最不容易出错。',
      }],
      'chmod 700': [
        {
          type: 'oops', title: '图方便，直接给 777',
          wrong: 'sudo chmod 777 example.txt',
          state: { label: '能修改这个文件的人', before: ['主人'], after: ['主人', '同用户组的人', '其他所有人'] },
          why: '`777` 是三组都给 `rwx`。问题当下会消失，但从此系统上任何账号都能改这个文件。',
          right: 'sudo chmod 644 example.txt',
          rightLabel: '一般文件常见的设置',
          fix: '主人可以读写，其他人只能读。',
        },
        {
          type: 'behind', title: '`chmod` 也只改数据卡',
          cmd: 'sudo chmod 700 example.txt',
          places: [{
            where: 'example.txt 的数据卡', what: '和 `chown` 改的是同一张',
            rows: [['edit', '权限　-rw-rw-r-- → -rwx------'], '主人　root', '用户组　root', '内容　（没有动）'],
          }],
          note: '`chown` 改的是「主人」和「用户组」两格，`chmod` 改的是「权限」那一格。两个命令都不会动到文件内容。',
        },
      ],
      运行脚本: [{
        type: 'oops', title: '少了前面的 `./`',
        wrong: 'script.sh',
        out: 'zsh: command not found: script.sh',
        why: '只打名字时，终端机只会到几个固定的目录找命令，**不包含你现在这一间**。',
        right: './script.sh',
        fix: '`./` 的意思是「就在目前这个目录」。',
      }],
    },
    poster: {
      title: '4、2、1 加起来就是权限',
      lanes: [
        {
          name: '每个字母的分数', nodes: [
            { cmd: 'r = 4', does: '读' },
            { cmd: 'w = 2', does: '写' },
            { cmd: 'x = 1', does: '运行' },
          ],
        },
        {
          name: '加起来', nodes: [
            { cmd: '7 = 4+2+1', does: '`rwx`' },
            { cmd: '6 = 4+2', does: '`rw-`' },
            { cmd: '4', does: '`r--`' },
            { cmd: '0', does: '`---`' },
          ],
        },
        {
          name: '套用', nodes: [
            { cmd: 'chmod 700 文件', does: '只有主人能用' },
            { cmd: 'chmod 764 script.sh', does: '主人 `rwx`、用户组 `rw-`、其他人 `r--`' },
            { cmd: './script.sh', does: '有了 `x` 才能运行' },
          ],
        },
      ],
      line: '三个数字，依序是主人、用户组、其他人。',
    },
  });

  // 11 挑战：设置主人和权限 ------------------------------------------------------
  KM.deepen('ownership-challenge', {
    story: {
      title: '把报表交给另一个部门',
      lead: '题目的三个步骤，就是一次完整的交接。',
      steps: [
        { say: '先把文件做出来。', cmd: 'touch target_file' },
        { say: '负责人是 `user1`，所属部门是 `group1`。', cmd: 'sudo chown user1:group1 target_file' },
        { say: '负责人要能读、写、运行；部门的人能读写；外人完全不能碰。', cmd: 'sudo chmod 760 target_file' },
        { say: '验收：字符串要刚好是 `-rwxrw----`，主人和用户组也要对。', cmd: 'ls -l target_file' },
      ],
    },
    at: {
      过户: [{
        type: 'oops', title: '主人和用户组写反了',
        wrong: 'sudo chown group1:user1 target_file',
        out: "chown: invalid user: 'group1:user1'",
        why: '冒号**前面是主人，后面是用户组**。写反之后，系统到名册里找一个叫 `group1` 的用户，找不到就报错。',
        right: 'sudo chown user1:group1 target_file',
      }],
    },
    poster: {
      title: '从目标字符串反推回去',
      lanes: [
        {
          name: '-rwxrw---- 换成数字', flow: true, nodes: [
            { cmd: 'rwx', does: '主人：4+2+1 = **7**' },
            { cmd: 'rw-', does: '用户组：4+2 = **6**' },
            { cmd: '---', does: '其他人：**0**' },
          ],
        },
        {
          name: '操作顺序', flow: true, nodes: [
            { cmd: 'touch target_file', does: '创建' },
            { cmd: 'sudo chown user1:group1', does: '过户' },
            { cmd: 'sudo chmod 760', does: '设权限' },
            { cmd: 'ls -l', does: '验收' },
          ],
        },
      ],
      line: '三个字母一组，各自加起来。',
    },
  });

  // 12 用户账号 ----------------------------------------------------------------
  KM.deepen('user-accounts', {
    story: {
      title: '同事报到，后来离职',
      lead: '这一篇的命令，刚好是一个账号从开始到结束会经历的每一件事。',
      steps: [
        { say: '新同事 bob 今天报到。开账号，顺便把家目录建好。', cmd: 'sudo useradd -m bob' },
        { say: '账号有了，但还没有密码，他登录不了。', cmd: 'sudo passwd bob' },
        { say: '他的工作需要管理权限，把他加进 `sudo` 用户组。', cmd: 'sudo usermod -aG sudo bob' },
        { say: '换成他的身分试一下，确认一切正常。', cmd: 'su - bob', note: '试完用 `exit` 回到自己的身分。' },
        { say: '他请了一个月的假。账号先锁起来，数据都留着。', cmd: 'sudo passwd -l bob' },
        { say: '他回来了，解锁。原本的密码照样能用。', cmd: 'sudo passwd -u bob' },
        { say: '后来他离职。删除账号，连家目录一起清掉。', cmd: 'sudo userdel -r bob' },
      ],
    },
    at: {
      useradd: [{
        type: 'behind', title: '一行 `useradd`，三个文件各多一行',
        cmd: 'sudo useradd joker',
        places: [
          { where: '/etc/passwd', what: '账号名册', rows: ['labex:x:5000:5000::/home/labex:/usr/bin/zsh', ['add', 'joker:x:5001:5001::/home/joker:/bin/sh']] },
          { where: '/etc/shadow', what: '密码，只有管理员能看', rows: [['add', 'joker:!:…　（还没设密码，所以是 !）']] },
          { where: '/etc/group', what: '用户组名单', rows: [['add', 'joker:x:5001:']] },
        ],
        note: '所谓「创建账号」，就是在这三个文本文件里各写一行，另外还会自动建一个同名的用户组。加了 `-m` 才会多做一件事：创建 `/home/joker`。',
      }],
      '-m': [{
        type: 'oops', title: '没加 `-m`，登录之后没有家',
        wrong: 'sudo useradd joker',
        out: 'su: warning: cannot change directory to /home/joker: No such file or directory',
        why: '名册上写着 joker 的家在 `/home/joker`，但那个目录从来没被创建。等到用 `su - joker` 换过去时，系统找不到他的家，就会出现上面这行警告。',
        right: 'sudo useradd -m joker',
      }],
      usermod: [
        {
          type: 'oops', title: '忘了 `-a`，原本的用户组全被洗掉',
          wrong: 'sudo usermod -G sudo joker',
          state: { label: 'joker 的附加用户组（假设原本有两个）', before: ['dev', 'docker'], after: ['sudo'] },
          why: '单独的 `-G` 意思是「附加用户组**改成**这一份名单」。没写在名单上的用户组会全部被移除，而且没有任何提示。',
          right: 'sudo usermod -aG sudo joker',
          fix: '`-a` 是 append，也就是「加进去」，原本的都留着。',
        },
        {
          type: 'behind', title: '加入用户组，改的是用户组那一边',
          cmd: 'sudo usermod -aG sudo joker',
          places: [
            { where: '/etc/group', what: '用户组名单', rows: [['edit', 'sudo:x:27:labex → sudo:x:27:labex,joker']] },
            { where: '/etc/passwd', what: '账号名册', rows: ['joker:x:5001:5001::/home/wayne:/bin/bash　（没有动）'] },
          ],
          note: '「joker 加入 sudo 用户组」实际上是在 `sudo` 那一行的成员名单后面补上 joker。他自己在名册上的那一行没有变。已经登录的人要重新登录，新用户组才会生效。',
        },
      ],
      su: [{
        type: 'oops', title: '少了 `-`，人换了，位置没换',
        wrong: 'su joker',
        out: '（身分变成 joker，但还站在 labex 的目录里，PATH 等设置也没换）',
        why: '没有 `-` 的 `su` 只换身分，不会重新登录。你还留在原本的目录，而那里 joker 可能没有权限，接下来的命令常会莫名其妙失败。',
        right: 'su - joker',
        fix: '加上 `-` 等于整个重新登录一次，会回到 joker 自己的家。',
      }],
      锁定: [{
        type: 'behind', title: '锁账号，只是在密码前面加一个 `!`',
        cmd: 'sudo passwd -l joker',
        places: [{
          where: '/etc/shadow', what: '密码，只有管理员能看',
          rows: [['edit', 'joker:$y$j9T$… → joker:!$y$j9T$…']],
        }],
        note: '加上 `!` 之后，不管输入什么密码都对不上，所以登录不了。原本的密码其实还在，`-u` 把 `!` 拿掉就恢复原状。',
      }],
      userdel: [{
        type: 'oops', title: '没加 `-r`，人走了房间还在',
        wrong: 'sudo userdel bob',
        state: { label: '系统里和 bob 有关的东西', before: ['/etc/passwd 里 bob 那一行', '/home/bob'], after: ['/home/bob'] },
        why: '账号删了，家目录和里面的文件却留着占空间。更麻烦的是：之后新开的账号如果拿到 bob 以前的编号，就会直接变成这些文件的主人。',
        right: 'sudo userdel -r bob',
      }],
    },
    poster: {
      title: '一个账号的一生',
      lanes: [
        {
          name: '从报到到离开', flow: true, nodes: [
            { cmd: 'useradd -m', does: '开账号，建好家目录' },
            { cmd: 'passwd', does: '设密码' },
            { cmd: 'usermod', does: '改家目录、shell、用户组' },
            { cmd: 'passwd -l / -u', does: '锁定、解锁' },
            { cmd: 'userdel -r', does: '删除账号和家目录' },
          ],
        },
        {
          name: '查看与切换', nodes: [
            { cmd: 'id 名字', does: '编号和用户组' },
            { cmd: 'groups 名字', does: '只看用户组' },
            { cmd: 'su - 名字', does: '换成那个人登录' },
            { cmd: 'exit', does: '回到原本的身分' },
          ],
        },
      ],
      line: '登记、配钥匙、改数据、上锁、退房。',
    },
  });
  // 13 认识这台机器 ---------------------------------------------------------------
  KM.deepen('system-info', {
    story: {
      title: '有人说这台服务器怪怪的',
      lead: '你被叫去看一台机器。还不知道问题在哪，先把基本状况查清楚，存成一份报告回报。',
      steps: [
        { say: '先确认自己是用哪个账号登录的。', cmd: 'whoami' },
        { say: '这是哪一台机器？系统和内核是什么版本？', cmd: 'uname -a' },
        { say: '它是不是刚被重新开机过？', cmd: 'uptime', note: '`up 186 days` 代表半年没重开过，所以不是重开机造成的。' },
        { say: '现在有没有哪个程序把 CPU 或内存吃光？', cmd: 'top', note: '看完按 `q` 离开。' },
        { say: '把查到的东西存下来。第一行用 `>`，让报告从空白开始。', cmd: 'whoami > system_report.txt' },
        { say: '后面的都接在下面。', cmd: 'uname -a >> system_report.txt', note: '`uptime >> system_report.txt` 也一样。' },
        { say: '交出去之前，自己先看一遍。', cmd: 'cat system_report.txt' },
      ],
    },
    at: {
      uptime: [{
        type: 'behind', title: '`uptime` 的数字从哪里来',
        cmd: 'uptime',
        places: [
          { where: '/proc/uptime', what: '开机到现在过了几秒', rows: [['read', '16094340.52 …']] },
          { where: '/proc/loadavg', what: '平均负载', rows: [['read', '0.19 0.29 0.22 …']] },
        ],
        note: '`/proc` 里的东西不是存在硬盘上的文件，而是系统内核开的一扇窗，每次去读都是当下最新的数字。`uptime` 只是把它们读出来，换算成好读的格式。16094340 秒刚好就是 186 天 6 小时 39 分。',
      }],
      top: [{
        type: 'oops', title: '想把 `top` 的画面存进文件',
        wrong: 'top > system_report.txt',
        out: '（画面停住没有反应；按 q 离开后，文件里是一堆看不懂的控制码）',
        why: '`top` 是交互式的程序，会不停重画整个画面。直接用 `>` 接走，存进去的是「重画画面」用的控制码，而且原本报告的内容也被盖掉了。',
        right: 'top -b -n 1 >> system_report.txt',
        fix: '`-b` 是批量模式，输出纯文本；`-n 1` 是只印一次就结束。',
      }],
      报告: [
        {
          type: 'oops', title: '第二行也用了一个 `>`',
          wrong: 'uname -a > system_report.txt',
          state: { label: 'system_report.txt 的内容', before: ['labex'], after: ['Linux 6af99ac5… GNU/Linux'] },
          why: '一个 `>` 会先把文件清空。刚刚写进去的 `labex` 不见了，而且不会有任何提示。',
          right: 'uname -a >> system_report.txt',
        },
        {
          type: 'behind', title: '`>` 把输出的出口换掉了',
          cmd: 'whoami > system_report.txt',
          places: [
            { where: '屏幕', what: '输出原本会到这里', rows: [['del', 'labex']] },
            { where: 'system_report.txt', what: '现在改流到这里', rows: [['add', 'labex']] },
          ],
          note: '`whoami` 自己并不知道输出被转走了。是 Shell 在运行它之前，先把「输出的出口」从屏幕接到文件上。所以不管什么命令，后面都可以接 `>` 或 `>>`。',
        },
      ],
    },
    poster: {
      title: '查三件事，存成一份报告',
      lanes: [
        {
          name: '认识这台机器', nodes: [
            { cmd: 'uname -a', does: '系统、主机名称、内核版本、硬件' },
            { cmd: 'uptime', does: '开机多久、几人登录、有多忙' },
            { cmd: 'top', does: '现在有哪些程序在跑，按 `q` 离开' },
          ],
        },
        {
          name: '存成报告', flow: true, nodes: [
            { cmd: '命令 > 文件', does: '第一行：清空再写' },
            { cmd: '命令 >> 文件', does: '之后每一行：接在后面' },
            { cmd: 'cat 文件', does: '打开来检查' },
          ],
        },
      ],
      line: '第一行用 >，之后都用 >>。',
    },
  });

  // 换个写法 ---------------------------------------------------------------------
  // 同一件事的其他写法。笔记里原本的写法都保留，这里只是多告诉你还能怎么写。
  const alt = (rows, title) => ({ type: 'alt', title, rows });

  KM.deepen('linux-first-commands', { at: {
    echo: [alt([
      { from: 'echo "Hello World"', to: [
        ["echo 'Hello World'", '单引号也可以。差别是单引号里的东西完全照字面，不会被替换。'],
        ['echo Hello World', '不加引号也印得出来。但中间连续多个空白会被缩成一个，所以习惯上还是加引号。'],
      ] },
    ])],
    whoami: [alt([
      { from: 'whoami', to: [
        ['id -un', '结果完全相同，这篇后面会学到。'],
        ['echo $USER', '读出系统记下的用户名，通常也一样。'],
      ] },
    ])],
    'id root': [alt([
      { from: 'id root', to: [
        ['id -u root', '只要编号，会印出 `0`。'],
        ['groups root', '只要用户组的名字。'],
      ] },
    ])],
    'id -un': [alt([
      { from: 'id -un', to: [
        ['id -u -n', '选项可以分开写，意思一样。'],
        ['whoami', '比较短，平常大家都用这个。'],
      ] },
    ])],
  } });

  KM.deepen('whoami-challenge', { at: {
    解法: [alt([
      { from: 'whoami', to: [
        ['id -un', '同样只印名字，也能通过题目的检查。'],
        ['echo $USER', '通常也是同一个名字，但它读的是一个可以被改掉的变量，不如前两个可靠。'],
      ] },
    ])],
  } });

  KM.deepen('navigate-directories', { at: {
    pwd: [alt([
      { from: 'pwd', to: [['echo $PWD', '系统把目前位置记在 `$PWD` 这个变量里，印出来是一样的。']] },
    ])],
    '~': [alt([
      { from: 'echo ~', to: [['echo $HOME', '`~` 其实就是 `$HOME` 的简写。']] },
      { from: 'ls ~', to: [['ls /home/labex', '把 `~` 换成完整路径，结果相同。']] },
    ])],
    cd: [alt([
      { from: 'cd ~', to: [['cd', '后面什么都不加，就是回家。这是最短的写法。']] },
      { from: 'cd /home/labex/project', to: [['cd ~/project', '用 `~` 代替 `/home/labex`，少打很多字。']] },
      { from: 'cd ..', to: [
        ['cd ../..', '一次往上两层。'],
        ['cd -', '回到「上一个待过的目录」，在两个地方来回切换时很方便。'],
      ], label: '相关的写法' },
    ])],
  } });

  KM.deepen('create-and-list', { at: {
    创建: [alt([
      { from: 'touch file1.txt', to: [['touch file1.txt file3.txt', '后面可以接好几个名字，一次全部创建。']] },
      { from: 'echo "Hello, Linux" > file2.txt', to: [['echo "Hello, Linux" | tee file2.txt', '写进文件的同时，也印在画面上让你确认。`|` 是把左边的输出交给右边。']] },
      { from: 'mkdir testdir', to: [['mkdir testdir backup', '同样可以一次建好几个。']] },
    ])],
    'ls -l': [alt([
      { from: 'ls -l', to: [
        ['ls -lh', '多一个 `h`（human）：大小改用 K、M、G 显示，不用自己数字数。'],
        ['ls -ld testdir', '多一个 `d`：看目录**本身**的数据，而不是列出它里面的东西。'],
      ] },
    ])],
    'ls -a': [alt([
      { from: 'ls -la', to: [
        ['ls -al', '选项的顺序不影响结果。'],
        ['ls -l -a', '分开写也一样。'],
        ['ls -lA', '大写 `A`：一样列出隐藏文件，但省略 `.` 和 `..` 这两行。'],
      ] },
    ])],
  } });

  KM.deepen('copy-and-move', { at: {
    cp: [alt([
      { from: 'cp file1.txt file1_copy.txt', to: [
        ['cp -v file1.txt file1_copy.txt', '`-v` 会印出它做了什么，不用再 `ls` 确认。'],
        ['cp -i file1.txt file1_copy.txt', '`-i`：如果会盖掉现有的文件，先问你。'],
      ] },
      { from: 'cp file2.txt testdir/', to: [['cp file2.txt testdir', '结尾的 `/` 可以省略。但万一 `testdir` 不存在，没有斜线会变成「复制成一个叫 testdir 的文件」；有斜线则会报错，比较安全。']] },
      { from: 'cp -r testdir testdir_copy', to: [
        ['cp -R testdir testdir_copy', '大写 `R` 意思相同。'],
        ['cp -a testdir testdir_copy', '`-a`：除了内容，连权限和时间也原样保留。做备份时常用。'],
      ] },
    ])],
    mv: [alt([
      { from: 'mv testdir/newname.txt ./original_file1.txt', to: [['mv testdir/newname.txt original_file1.txt', '`./` 是「目前这个目录」，写不写都一样。']] },
      { from: 'mv newname.txt testdir/', to: [['mv newname.txt file2.txt testdir/', '可以一次搬好几个，最后一个是目的地。']] },
    ])],
  } });

  KM.deepen('delete-files', { at: {
    rm: [alt([
      { from: 'rm original_file1.txt', to: [
        ['rm -v original_file1.txt', '`-v` 会印出删了什么。`rm` 平常什么都不说，这样比较安心。'],
        ['rm a.txt b.txt', '后面可以接好几个文件，一次删掉。'],
      ] },
    ])],
    目录: [alt([
      { from: 'rmdir new_testdir', to: [['rm -d new_testdir', '`rm` 加 `-d` 也能删空目录，同样只在目录是空的时候才动手。']] },
      { from: 'rm -r testdir', to: [
        ['rm -R testdir', '大写 `R` 意思相同。'],
        ['rm -ri testdir', '加上 `-i`：每删一样东西之前都先问。'],
      ] },
    ])],
    'rm -rf': [alt([
      { from: 'rm -rf temp_dir', to: [
        ['rm -r -f temp_dir', '选项分开写。'],
        ['rm -fr temp_dir', '顺序对调也一样。'],
      ] },
      { from: 'ls -R temp_dir', to: [['find temp_dir', '同样列出里面每一层的东西，但每一项都印成完整路径，一行一个。']] },
    ])],
  } });

  KM.deepen('read-and-compare', { at: {
    cat: [alt([
      { from: 'cat -n /tmp/hello', to: [['nl /tmp/hello', '专门用来加行号的命令。差别是空白行不会被编号。']] },
    ])],
    head: [alt([
      { from: 'head -n1 /tmp/hello', to: [
        ['head -n 1 /tmp/hello', '`-n` 和数字中间可以有空白。'],
        ['head -1 /tmp/hello', '更短的旧式写法，现在还是能用。'],
      ] },
    ])],
    tail: [alt([
      { from: 'tail -n1 /tmp/hello', to: [
        ['tail -n 1 /tmp/hello', '同样可以加空白。'],
        ['tail -1 /tmp/hello', '旧式的短写法。'],
      ] },
    ])],
    diff: [alt([
      { from: 'diff file1 file2', to: [
        ['diff -u file1 file2', '`-u` 格式：用 `-` 和 `+` 标出删掉和添加的行，还会附上前后几行。之后学 Git 看到的就是这种。'],
        ['diff -q file1 file2', '`-q`：只回答「有没有不同」，不列出细节。'],
      ] },
      { from: 'diff -r /home/labex/Desktop /home/labex/Code', to: [['diff -rq ~/Desktop ~/Code', '加 `-q` 只列出哪些文件不同；路径也可以用 `~` 缩短。']] },
    ])],
  } });

  KM.deepen('manuscript-challenge', { at: {
    检查: [alt([
      { from: 'tail -n1 manuscript_v1.txt', to: [['tail -n1 manuscript_v1.txt manuscript_v2.txt', '一次给两个文件。它会各印一行文件名当标题，再印各自的最后一行，不用打两次。']] },
      { from: 'head -n2 manuscript_v2.txt', to: [['head -2 manuscript_v2.txt', '短写法。']] },
    ])],
    比较: [alt([
      { from: 'diff manuscript_v1.txt manuscript_v2.txt', to: [['diff -u manuscript_v1.txt manuscript_v2.txt', '用 `-` 和 `+` 标示，比 `2c2` 这种代号好读。']] },
    ])],
  } });

  KM.deepen('owner-chown', { at: {
    chown: [alt([
      { from: 'sudo chown root:root example.txt', to: [
        ['sudo chown root: example.txt', '冒号后面留空，代表「用户组就用 root 这个人的主要用户组」。'],
        ['sudo chown root example.txt', '没有冒号：只换主人，用户组不动。'],
        ['sudo chgrp root example.txt', '`chgrp` 是另一个命令，只换用户组。'],
      ] },
    ])],
    'mkdir -p': [alt([
      { from: 'mkdir -p new-dir/subdir', to: [['mkdir new-dir', '不用 `-p` 的话要分两次：先建外层，再打 `mkdir new-dir/subdir` 建里层。']] },
    ])],
    'chown -R': [alt([
      { from: 'sudo chown -R root:root new-dir', to: [['sudo chown -R root: new-dir', '同样可以省略冒号后面的用户组。']] },
    ])],
  } });

  KM.deepen('chmod', { at: {
    'chmod 700': [alt([
      { from: 'sudo chmod 700 example.txt', to: [['sudo chmod u=rwx,go= example.txt', '用字母写：`u` 是主人，`g` 是用户组，`o` 是其他人。`go=` 等号后面是空的，代表什么都不给。']] },
      { from: 'chmod 700 /home/labex/project/test-dir', to: [['chmod 700 test-dir', '人已经在 `project` 里，用相对路径就够了。']] },
    ])],
    运行脚本: [alt([
      { from: 'sudo chmod 764 script.sh', to: [
        ['sudo chmod u+x script.sh', '`u+x`：只帮主人**加上**运行，其他格子完全不动。原本是 `664`，结果刚好也是 `764`。这是最常见的写法。'],
        ['sudo chmod u=rwx,g=rw,o=r script.sh', '用字母把三组完整写出来，和 `764` 完全等价。'],
      ] },
      { from: './script.sh', to: [['bash script.sh', '直接叫 `bash` 来读这个文件。这样**不需要** `x` 权限也能跑。']] },
    ])],
  } });

  KM.deepen('ownership-challenge', { at: {
    过户: [alt([
      { from: 'sudo chown user1:group1 target_file', to: [['sudo chown user1 target_file', '也可以拆成两步：先只换主人，再用 `sudo chgrp group1 target_file` 换用户组。']] },
    ])],
    设权限: [alt([
      { from: 'sudo chmod 760 target_file', to: [['sudo chmod u=rwx,g=rw,o= target_file', '用字母写。题目给的是 `-rwxrw----`，这种写法可以直接照着字符串抄，不用换算数字。']] },
    ])],
  } });

  KM.deepen('user-accounts', { at: {
    useradd: [alt([
      { from: "sudo grep -w 'joker' /etc/passwd", to: [['getent passwd joker', '专门用来查名册的命令，直接给名字就好，而且不需要 `sudo`。']] },
    ])],
    '-m': [alt([
      { from: 'sudo useradd -m bob', to: [
        ['sudo adduser bob', 'Ubuntu 提供的交互式命令：会自动建家目录，接着一步一步问你密码和基本数据。'],
        ['sudo useradd -m -s /bin/bash -G sudo bob', '把后面 `usermod` 才做的事一次写完：建家、指定 Shell、加入用户组。'],
      ] },
    ])],
    usermod: [alt([
      { from: 'sudo usermod -aG sudo joker', to: [
        ['sudo gpasswd -a joker sudo', '从用户组那一边下手：把 joker 加进 sudo。不会有忘记 `-a` 的风险。'],
        ['sudo adduser joker sudo', 'Ubuntu 的写法，意思相同。'],
      ] },
      { from: 'sudo usermod -s /bin/bash joker', to: [['sudo chsh -s /bin/bash joker', '`chsh` 是 change shell，专门改这一项。']] },
      { from: 'groups joker', to: [['id -Gn joker', '结果相同，只印用户组的名字。']] },
    ])],
    su: [alt([
      { from: 'su - joker', to: [
        ['su -l joker', '`-` 是 `-l`（login）的简写。'],
        ['sudo -i -u joker', '用 `sudo` 换身分：输入的是**你自己的**密码，不需要知道 joker 的密码。'],
      ] },
      { from: 'exit', to: [['Ctrl + D', '按键盘快捷键，效果和打 `exit` 一样。']] },
    ])],
    锁定: [alt([
      { from: 'sudo passwd -l joker', to: [['sudo usermod -L joker', '大写 `L`，做的事相同：在密码前面加 `!`。']] },
      { from: 'sudo passwd -u joker', to: [['sudo usermod -U joker', '大写 `U`，解锁。']] },
      { from: 'sudo cat /etc/shadow', to: [['sudo getent shadow joker', '只印 joker 那一行，不用在整个文件里找。']] },
    ])],
    userdel: [alt([
      { from: 'sudo userdel -r bob', to: [['sudo deluser --remove-home bob', 'Ubuntu 的写法，选项名称直接写明「连家一起移除」。']] },
    ])],
  } });

  KM.deepen('system-info', { at: {
    uname: [alt([
      { from: 'uname -a', to: [
        ['uname -r', '只要内核版本：`6.8.0-111-generic`。'],
        ['uname -m', '只要硬件架构：`x86_64`。'],
        ['hostname', '只要主机名称，和 `uname -n` 相同。'],
      ], label: '只想要其中一段' },
    ])],
    uptime: [alt([
      { from: 'uptime', to: [
        ['uptime -p', '只印开机多久，而且写成好读的句子，例如 `up 26 weeks, 4 days, 6 hours`。'],
        ['uptime -s', '反过来问：是从哪一天几点开机的。'],
      ] },
    ])],
    top: [alt([
      { from: 'top', to: [
        ['ps aux', '印出同样的程序清单，但只印**一次**就结束，不会占住画面。'],
        ['top -b -n 1', '让 `top` 只印一次纯文本，可以接 `>` 存进文件。'],
        ['htop', '彩色、可以用方向键操作的加强版，但不是每台机器都有安装。'],
      ] },
    ])],
    报告: [alt([
      { from: 'touch system_report.txt', to: [['（可以省略）', '`>` 发现文件不存在时会自动创建，所以不先 `touch` 也可以。先建好的好处是能用 `ls -l` 确认它一开始是空的。']] },
      { from: 'whoami > system_report.txt', to: [['{ whoami; uname -a; uptime; } > system_report.txt', '用大括号把三个命令包成一组，输出一次写进文件，不用分三行。注意括号内侧要有空白，最后一个命令后面要有分号。']] },
      { from: 'uptime >> system_report.txt', to: [['uptime | tee -a system_report.txt', '`tee -a` 会接在文件后面，同时也印在画面上，写入当下就能看到内容。']] },
    ])],
  } });
  // 14 整理 phoenix 项目 ------------------------------------------------------------
  KM.deepen('organize-project', {
    story: {
      title: '接手一个没人整理过的项目',
      lead: '前一个负责人把所有东西都丢在同一层。你要在交接会议前把它整理好，而且不能弄丢任何东西。',
      steps: [
        { say: '先看看有什么。', cmd: 'ls' },
        { say: '分类用的目录一次建好。', cmd: 'mkdir src config docs' },
        { say: '每个文件搬到它该去的地方。', cmd: 'mv main_app.py src/', note: '`config.json` 和 `README.md` 也一样处理。' },
        { say: '用一张图确认结果，交接时也可以直接贴给同事看。', cmd: 'tree' },
        { say: '配置文件等一下可能要改，先留一份备份。', cmd: 'cp config/config.json config/config.json.bak' },
        { say: '另一个团队的文档，也并进项目的 `docs`。', cmd: 'mv ../shared_docs docs/' },
        { say: '去年的日志文件占位置，但稽核时可能要查。打包起来。', cmd: 'tar -czf old_logs.tar.gz *_2023-*.log' },
        { say: '确认箱子里真的有东西，才放心删掉原本的。', cmd: 'tar -tzf old_logs.tar.gz', note: '确认完才运行 `rm *_2023-*.log`。' },
      ],
    },
    at: {
      归位: [{
        type: 'oops', title: '目的地打错一个字',
        wrong: 'mv README.md ~/project/phoenix_project/doc',
        state: { label: 'phoenix_project 里的东西', before: ['README.md', 'docs/'], after: ['doc（其实是 README.md）', 'docs/'] },
        why: '`doc` 不存在，`mv` 就把它当成**新的文件名**，`README.md` 被改名成 `doc`，留在原地。没有错误消息。',
        right: 'mv README.md ~/project/phoenix_project/docs/',
        fix: '目的地是目录时，结尾加上 `/`。万一打错，会直接报错，不会偷偷改名。',
      }],
      通配符: [
        {
          type: 'oops', title: '样式中间多了一个空白',
          wrong: 'rm * _2023-*.log',
          state: { label: 'logs 里的文件', before: ['app_2023-01-15.log', 'app_2024-05-01.log', 'db_2023-02-20.log', 'old_logs.tar.gz'], after: [] },
          why: [
            '空白把样式切成两个：`*` 和 `_2023-*.log`。单独一个 `*` 代表**这里的所有文件**。',
            '结果整个目录被清空，连刚打包好的 `old_logs.tar.gz` 也一起删掉了。',
          ],
          right: 'ls *_2023-*.log',
          rightLabel: '先用 ls 预览会选到谁',
          fix: '清单没问题，再按 ↑ 把 `ls` 改成 `rm`。',
        },
        {
          type: 'behind', title: '`rm` 根本没看过 `*`',
          cmd: 'rm *_2023-*.log',
          places: [
            { where: '你打的', what: '一个样式', rows: [['del', 'rm *_2023-*.log']] },
            { where: 'rm 真正收到的', what: 'Shell 换好的清单', rows: [['add', 'rm app_2023-01-15.log db_2023-02-20.log']] },
          ],
          note: '按下 Enter 后，Shell 先到目录里比对文件名，把样式换成符合的名字，然后才启动 `rm`。所以 `rm`、`tar`、`ls` 都能用 `*`，它们自己并不需要懂通配符。',
        },
      ],
      打包: [
        {
          type: 'oops', title: '`-f` 后面接错东西',
          wrong: 'tar -czf *_2023-*.log old_logs.tar.gz',
          out: "tar: old_logs.tar.gz: Cannot stat: No such file or directory\n（而且 app_2023-01-15.log 被盖成了压缩包）",
          why: [
            '`-f` 会把**紧接在后面的字**当成压缩包的名字。`*` 展开后，第一个是 `app_2023-01-15.log`，于是它被当成箱子，原本的内容被盖掉。',
            '后面的 `old_logs.tar.gz` 反而被当成要装进去的东西，但它还不存在，所以报错。',
          ],
          right: 'tar -czf old_logs.tar.gz *_2023-*.log',
          fix: '顺序固定：先写箱子的名字，再写要装的东西。',
        },
        {
          type: 'behind', title: '打包完，原本的文件还在',
          cmd: 'tar -czf old_logs.tar.gz *_2023-*.log',
          places: [
            { where: 'logs/', what: '目录的名单', rows: ['app_2023-01-15.log', 'app_2024-05-01.log', 'db_2023-02-20.log', ['add', 'old_logs.tar.gz']] },
            { where: 'old_logs.tar.gz 里面', what: '压缩过的副本', rows: [['add', 'app_2023-01-15.log'], ['add', 'db_2023-02-20.log']] },
          ],
          note: '`tar` 只是读取原本的文件，把内容复制进新的压缩包，并不会动到原本的文件。所以打包完要删，得自己再下 `rm`。',
        },
      ],
    },
    poster: {
      title: '整理项目的五个步骤',
      lanes: [
        {
          name: '分类归位', flow: true, nodes: [
            { cmd: 'mkdir src config docs', does: '先建好目录' },
            { cmd: 'mv 文件 目录/', does: '一个一个搬进去' },
            { cmd: 'tree', does: '画成一张图检查' },
          ],
        },
        {
          name: '保险与封存', flow: true, nodes: [
            { cmd: 'cp a a.bak', does: '改之前先备份' },
            { cmd: 'tar -czf 箱.tar.gz *_2023-*', does: '打包旧文件' },
            { cmd: 'tar -tzf 箱.tar.gz', does: '确认箱子里有东西' },
            { cmd: 'rm *_2023-*', does: '最后才删' },
          ],
        },
      ],
      line: '先打包、再确认、最后才删。',
    },
  });

  KM.deepen('organize-project', { at: {
    建目录: [alt([
      { from: 'mkdir src config docs', to: [['mkdir {src,config,docs}', '大括号会被 Shell 展开成三个名字，结果相同。名字有共同的开头时特别好用，例如 `mkdir app_{v1,v2}`。']] },
    ])],
    归位: [alt([
      { from: 'mv main_app.py /home/labex/project/phoenix_project/src', to: [['mv main_app.py src/', '人已经在 `phoenix_project` 里，用相对路径就好，短很多。']] },
      { from: 'mv config.json ~/project/phoenix_project/config', to: [['mv config.json config/', '同样用相对路径。结尾加 `/`，万一目录不存在会报错，不会被改名。']] },
      { from: '三行 mv', to: [['mv -v main_app.py src/', '`-v` 会印出 `renamed \'main_app.py\' -> \'src/main_app.py\'`，搬完不用再检查。']], label: '想看到搬了什么' },
    ])],
    tree: [alt([
      { from: 'tree', to: [
        ['tree -L 1', '只展开一层，目录很深时先看大概。'],
        ['tree -d', '只画目录，不列文件。'],
        ['ls -R', '没装 `tree` 时的替代：一样一层一层列出，只是没有线条。'],
      ] },
    ])],
    备份: [alt([
      { from: 'cp config/config.json config/config.json.bak', to: [
        ['cp config/config.json{,.bak}', '大括号展开成 `config/config.json config/config.json.bak`，路径只要打一次。'],
        ['cp -p config/config.json config/config.json.bak', '`-p` 会保留原本的修改时间和权限，备份的时间就不会变成 `20:55`。'],
      ] },
    ])],
    搬目录: [alt([
      { from: 'cd .. 再 mv shared_docs …', to: [['mv ../shared_docs docs/', '不用先 `cd ..`。在 `phoenix_project` 里直接用 `..` 指到上一层的 `shared_docs`。']] },
      { from: 'ls ~/project/phoenix_project/docs/shared_docs/', to: [['tree ~/project/phoenix_project', '直接画整个项目，顺便确认 `shared_docs` 在不在对的位置。']] },
    ])],
    通配符: [alt([
      { from: 'rm *_2023-*.log', to: [
        ['ls *_2023-*.log', '先用 `ls` 预览会选到哪些文件，再换成 `rm`。'],
        ['rm -i *_2023-*.log', '每一个都先问过你。'],
        ['rm *2023*', '更短的样式。这里结果一样，但范围比较大，文件名里任何位置有 2023 都会被选到。'],
      ] },
    ])],
    打包: [alt([
      { from: 'tar -czf old_logs.tar.gz *_2023-*.log', to: [
        ['tar -cvzf old_logs.tar.gz *_2023-*.log', '多一个 `v`：装箱时把每个文件名印出来。'],
        ['tar czf old_logs.tar.gz *_2023-*.log', '`tar` 的选项可以不加 `-`，老的教学常看到这种写法。'],
        ['tar -czf old_logs.tar.gz --remove-files *_2023-*.log', '打包完自动删掉原本的文件，省掉 `rm` 那一步。但就少了确认的机会。'],
      ] },
      { from: 'tar -tzf old_logs.tar.gz', to: [
        ['tar -tvzf old_logs.tar.gz', '加上 `v`：清单会像 `ls -l` 一样附上权限、大小和时间。'],
        ['tar -xzf old_logs.tar.gz', '把 `t` 换成 `x`（extract），就是真的解开，文件会回到目前目录。'],
      ], label: '相关的写法' },
    ])],
  } });
  // 15 挑战：找出系统出错的原因 -------------------------------------------------------
  KM.deepen('troubleshoot', {
    story: {
      title: '半夜接到电话：付款一直失败',
      lead: '客服说客人付不了钱。你还不知道问题在哪，只能从最外层一路往里查，每查到一条线索就记下来。',
      steps: [
        { say: '先看应用程序自己怎么说。日志文件很长，只挑出错误的那几行。', cmd: 'grep "ERROR" logs/app.log > error_report.txt', note: '付款失败，还有一个 `NullPointerException`。' },
        { say: '会不会是机器本身坏了？看看内核有没有抱怨硬件或驱动。', cmd: "sudo dmesg | grep -i -E 'fail|error' > boot_issues.txt", note: '没有严重的硬件问题。' },
        { say: '那看 Web 服务器的设置。工作进程开太少，流量一大就会塞住。', cmd: "grep 'worker_processes' config/nginx.conf >> error_report.txt" },
        { say: '测试环境明明没问题。两边的设置到底差在哪？', cmd: 'diff config/staging/app.conf config/production/app.conf > config_diff.txt', note: '逾时时间、功能开关都不一样。' },
        { say: '最后确认两台服务器的文件有没有同步。', cmd: 'diff -r server1_files/ server2_files > missing_files.txt', note: '`server2_files` 少了 `asset2.js`。' },
        { say: '四个文件交给团队，大家看同一份线索讨论，不用每个人重查一次。' },
      ],
    },
    at: {
      日志文件: [{
        type: 'oops', title: '大小写不对，什么都没找到',
        wrong: 'grep "error" app.log',
        out: '（没有任何输出）',
        why: '`grep` 默认会区分大小写。日志文件里写的是大写的 `ERROR`，找小写的 `error` 一行也对不上。',
        right: 'grep -i "error" app.log',
        fix: '不确定大小写时，加上 `-i`。',
      }],
      内核消息: [
        {
          type: 'oops', title: '样式忘了加引号',
          wrong: 'sudo dmesg | grep -i -E fail|error > boot_issues.txt',
          out: 'zsh: command not found: error',
          why: [
            '没有引号，Shell 会把 `fail|error` 中间的 `|` 当成**第二根管道**，命令被切成三段，最后一段变成一个叫 `error` 的命令。',
            '系统里没有这个命令，所以报错。`boot_issues.txt` 也会被创建，但里面是空的。',
          ],
          right: "sudo dmesg | grep -i -E 'fail|error' > boot_issues.txt",
        },
        {
          type: 'oops', title: '没加 `-i`，漏掉两行',
          wrong: "sudo dmesg | grep -E 'fail|error'",
          state: { label: '找到的行', before: ['fail to add MMCONFIG', 'RAS: Correctable Errors', 'probe … failed with error', 'verification failed'], after: ['fail to add MMCONFIG', 'probe … failed with error', 'verification failed'] },
          why: '`Errors` 开头是大写 `E`，不符合小写的 `error`。题目要求忽略大小写，所以一定要加 `-i`。',
          right: "sudo dmesg | grep -i -E 'fail|error'",
        },
        {
          type: 'behind', title: '`sudo` 只管到管道前面',
          cmd: "sudo dmesg | grep -i -E 'fail|error' > boot_issues.txt",
          places: [
            { where: 'sudo dmesg', what: '用管理员身分运行', rows: [['edit', '身分：labex → root']] },
            { where: "grep … > boot_issues.txt", what: '还是你自己', rows: ['身分：labex', ['add', 'boot_issues.txt 的主人是 labex']] },
          ],
          note: '`sudo` 只套用在紧接着它的那一个命令。管道右边的 `grep`，以及写文件的 `>`，都是用你自己的身分做的。所以存出来的文件属于你，之后不用 `sudo` 也能读。',
        },
      ],
      配置文件: [{
        type: 'oops', title: '追加时只打了一个 `>`',
        wrong: "grep 'worker_processes' nginx.conf > ~/project/error_report.txt",
        state: { label: 'error_report.txt 的内容', before: ['ERROR: Failed to process payment…', 'ERROR: NullPointerException…'], after: ['worker_processes 4;'] },
        why: '一个 `>` 会先清空文件。任务 1 找到的两行错误不见了，报告只剩一行。',
        right: "grep 'worker_processes' nginx.conf >> ~/project/error_report.txt",
      }],
    },
    poster: {
      title: '一层一层往里查，每条线索都存下来',
      lanes: [
        {
          name: '找出关键的行', nodes: [
            { cmd: 'grep "ERROR" app.log', does: '应用程序的错误' },
            { cmd: "sudo dmesg | grep -i -E 'fail|error'", does: '内核和硬件的错误' },
            { cmd: "grep 'worker_processes' nginx.conf", does: '配置文件里的某一行' },
          ],
        },
        {
          name: '比较两边', nodes: [
            { cmd: 'diff 文件1 文件2', does: '两个设置差在哪几行' },
            { cmd: 'diff -r 目录1 目录2', does: '哪一边少了文件' },
          ],
        },
        {
          name: '存起来', flow: true, nodes: [
            { cmd: '> 报告', does: '第一次写入' },
            { cmd: '>> 报告', does: '之后追加' },
            { cmd: 'cat 报告', does: '交出去前检查' },
          ],
        },
      ],
      line: '筛出来、比一比、存下来。',
    },
  });

  KM.deepen('troubleshoot', { at: {
    日志文件: [alt([
      { from: 'grep "ERROR" app.log > error_report.txt', to: [
        ['grep -n "ERROR" app.log', '`-n` 在每行前面加上行号，之后要回原文件看前后文比较快。'],
        ['grep -c "ERROR" app.log', '`-c` 只回答有几行，这里会印出 `2`。'],
        ['grep "ERROR" app.log | tee error_report.txt', '写进文件的同时也印在画面上，就不用再 `cat` 一次。'],
      ] },
    ])],
    内核消息: [alt([
      { from: "grep -i -E 'fail|error'", to: [
        ["grep -iE 'fail|error'", '两个选项合在一起写。'],
        ['grep -i -e fail -e error', '用两个 `-e` 各给一个样式，不需要 `-E` 也不需要引号。'],
        ["grep -i 'fail\\|error'", '不加 `-E` 时，「或」要写成 `\\|`。容易打错，不太推荐。'],
      ] },
      { from: 'sudo dmesg', to: [
        ['sudo dmesg -T', '`-T` 把开头的秒数换成看得懂的日期时间。'],
        ['sudo journalctl -k', '用系统日志的工具看同样的内核消息，许多新的 Linux 都有。'],
      ], label: '相关的写法' },
    ])],
    配置文件: [alt([
      { from: 'cd config 再 grep … nginx.conf', to: [["grep 'worker_processes' ~/project/config/nginx.conf >> ~/project/error_report.txt", '两边都写完整路径，在哪个目录都能运行，不用先 `cd`。']] },
      { from: "grep 'worker_processes' nginx.conf", to: [["grep -w 'worker_processes' nginx.conf", '`-w` 只找完整的单字，不会被 `worker_processes_max` 之类的名字误中。']] },
    ])],
    比对设置: [alt([
      { from: 'diff config/staging/app.conf config/production/app.conf', to: [
        ['diff -u config/staging/app.conf config/production/app.conf', '用 `-` 和 `+` 标示删除和添加，比 `<` `>` 好读。'],
        ['diff -y config/staging/app.conf config/production/app.conf', '`-y` 左右并排显示，两边一眼对照。'],
      ] },
      { from: '先 diff 看，再 diff > 存', to: [['diff config/staging/app.conf config/production/app.conf | tee config_diff.txt', '看和存一次完成。']] },
    ])],
    比对目录: [alt([
      { from: 'diff -r server1_files/ server2_files', to: [
        ['diff -rq server1_files/ server2_files', '`-q` 只报「哪些文件不同」，不列出内容差异。文件很多时比较清楚。'],
        ['diff <(ls server1_files) <(ls server2_files)', '只比文件名清单。`<( )` 会把命令的输出当成一个暂时的文件交给 `diff`。'],
      ] },
    ])],
  } });

  // 17 第一个 Shell 脚本 ----------------------------------------------------------
  KM.deepen('hello-script', {
    story: {
      title: '把每天要打的命令收进一个脚本',
      lead: '你每天上班都要打 `whoami` 和 `uptime`，再存成报告。打了一个星期，决定写成脚本，以后一行就搞定。',
      steps: [
        { say: '先做一个空文件。', cmd: 'touch report.sh' },
        { say: '在编辑器写三行：第一行 `#!/bin/bash`，接着 `whoami`、`uptime`。按 `Ctrl + S` 存档。', note: '脚本里的命令，和你平常在终端机打的一模一样。' },
        { say: '加上执行权限。', cmd: 'chmod +x report.sh' },
        { say: '运行它，顺便把结果存进报告。', cmd: './report.sh > system_report.txt', note: '脚本里每个命令的输出都会一起写进文件。' },
        { say: '检查报告。', cmd: 'cat system_report.txt', note: '以后每天只要打 `./report.sh > system_report.txt` 一行。' },
      ],
    },
    poster: {
      title: '写一个脚本的四步',
      lanes: [
        { name: '从空文件到跑起来', flow: true, nodes: [
          { cmd: 'touch hello.sh', does: '做出空文件' },
          { cmd: '编辑器 + Ctrl+S', does: '写 shebang 和命令，存档' },
          { cmd: 'chmod +x hello.sh', does: '加上执行权限' },
          { cmd: './hello.sh', does: '交给 bash 一行一行做' },
        ] },
      ],
      line: '少了存档，脚本是空的；少了 `x`，脚本跑不了；少了 `./`，Shell 找不到它。',
    },
    at: {
      编辑: [
        {
          type: 'oops', title: '忘了按 Ctrl + S',
          wrong: './hello.sh',
          out: '（什么都没印）',
          why: '字只打在编辑器的画面上，没有存进文件。`hello.sh` 还是 `touch` 出来的空文件，空的脚本运行起来什么都不做，也不会报错。',
          rightLabel: '先存档，再运行', right: './hello.sh',
          fix: '编辑器的文件名旁边如果有一个小圆点，代表还没存档。',
        },
        {
          type: 'oops', title: 'shebang 打错字',
          wrong: './hello.sh',
          out: 'zsh: ./hello.sh: bad interpreter: /bin/bsh: no such file or directory',
          why: '第一行写成了 `#!/bin/bsh`。系统照着去找 `/bin/bsh` 这个程序，找不到，脚本一行都没跑。',
          rightLabel: '第一行改成', right: '#!/bin/bash',
          fix: '看到 `bad interpreter`，就去检查第一行。',
        },
      ],
      权限: [
        {
          type: 'oops', title: '忘了加执行权限',
          wrong: './hello.sh',
          state: { label: 'hello.sh 的权限', before: ['-rw-rw-r--'], after: ['-rw-rw-r--'] },
          out: 'zsh: permission denied: ./hello.sh',
          why: '内容写好了，但文件没有 `x`，Shell 拒绝把它当成程序运行。',
          right: 'chmod +x hello.sh',
        },
        {
          type: 'behind', title: 'chmod +x 只改了一排开关',
          cmd: 'chmod +x hello.sh',
          places: [
            { where: 'hello.sh 的权限', what: '三组的 x 打开', rows: [['edit', '-rw-rw-r--  →  -rwxrwxr-x']] },
            { where: 'hello.sh 的内容', what: '完全没动', rows: ['#!/bin/bash', "echo 'Hello, World!'"] },
          ],
          note: '权限是记在文件的数据卡上，不在内容里。所以改权限不会动到你写的任何一个字。',
        },
        alt([
          { from: 'chmod +x hello.sh', to: [
            ['chmod u+x hello.sh', '只给自己（拥有者）加，比较保险'],
            ['chmod 775 hello.sh', '数字写法，结果和这里的 `+x` 一样是 `rwxrwxr-x`'],
          ] },
        ]),
      ],
      运行: [
        {
          type: 'behind', title: './hello.sh 时，后面发生了什么',
          cmd: './hello.sh',
          places: [
            { where: 'hello.sh', what: '系统先读开头两个字', rows: [['read', '#!/bin/bash  ← 看到 #!，知道要交给 /bin/bash'], "echo 'Hello, World!'"] },
            { where: '新开的程序', what: '实际运行的是这一行', rows: [['add', '/bin/bash ./hello.sh']] },
            { where: '画面', what: 'bash 一行一行做', rows: [['add', 'Hello, World!']] },
          ],
          note: '对 `bash` 来说，`#` 开头的行是注释，所以第一行它直接跳过，从 `echo` 开始做。',
        },
        alt([
          { from: './hello.sh', to: [['bash hello.sh', '直接指定交给 bash：不需要 `x` 权限，也不看 shebang']] },
          { from: '#!/bin/bash', to: [['#!/usr/bin/env bash', '让系统自己去找 bash 在哪里。换到 bash 不在 /bin 的机器上也能跑']] },
        ]),
      ],
    },
  });

  // 18 Shell 变量 ------------------------------------------------------------------
  KM.deepen('shell-variables', {
    story: {
      title: '一个价钱改一次就好',
      lead: '你写了一个印报价单的脚本，苹果的单价出现在好几行。老板说要涨价。',
      steps: [
        { say: '一开始每一行都直接写 `5`。涨价时要一行一行找出来改，很容易漏掉一行。' },
        { say: '改成在脚本开头写一次 `PRICE_PER_APPLE=5`，下面每一行都用 `$PRICE_PER_APPLE`。', note: '要用的地方只写名字，不写数字。' },
        { say: '老板说涨到 6 元。只要把开头那一行改成 `PRICE_PER_APPLE=6`，存档。' },
        { say: '再跑一次脚本，所有用到单价的地方都跟着变了。', cmd: './variables.sh' },
        { say: '同样的道理，名字、路径这种会重复出现的东西，都适合放进变量。' },
      ],
    },
    poster: {
      title: 'Shell 变量的存与取',
      lanes: [
        { name: '存', flow: true, nodes: [
          { cmd: 'NAME=value', does: '等号两边**不能**有空格' },
          { cmd: "NAME='a   b'", does: '值里有空格就加引号' },
        ] },
        { name: '取', flow: true, nodes: [
          { cmd: '"$NAME"', does: '换成值，空格原样保留' },
          { cmd: "'$NAME'", does: '原样不换，印出 $NAME' },
          { cmd: '$NAME', does: '换成值，但多的空格会被压掉' },
        ] },
      ],
      line: '存的时候不加 `$`、不留空格；取的时候加 `$`，最好再包一层双引号。',
    },
    at: {
      创建: [
        {
          type: 'oops', title: '等号两边留了空格',
          wrong: 'PRICE_PER_APPLE = 5',
          out: './variables.sh: line 3: PRICE_PER_APPLE: command not found',
          why: '有空格，Shell 就把这一行看成「运行一个叫 `PRICE_PER_APPLE` 的命令，参数是 `=` 和 `5`」。系统里没有这个命令。',
          right: 'PRICE_PER_APPLE=5',
          fix: '错误消息里的 `line 3` 告诉你是脚本的第几行出错。',
        },
        {
          type: 'oops', title: '值里有空格，却没加引号',
          wrong: 'greeting=Hello        world!',
          out: './variables.sh: line 5: world!: command not found',
          why: '没有引号，空格就是分隔。Shell 只把 `Hello` 存进 `greeting`，再把 `world!` 当成命令来运行。',
          right: "greeting='Hello        world!'",
        },
      ],
      使用: [
        {
          type: 'oops', title: '变量名的大小写打错',
          wrong: 'echo "My first letters: $myfirstletters"',
          out: 'My first letters: ',
          why: '`myfirstletters` 和 `MyFirstLetters` 是两个名字。没定义过的变量不会报错，只会被换成空的，所以很难发现。',
          right: 'echo "My first letters: $MyFirstLetters"',
        },
        {
          type: 'behind', title: '变量只活在脚本里',
          cmd: './variables.sh',
          places: [
            { where: '新开的 bash', what: '运行脚本时，记住三个变量', rows: [['add', 'PRICE_PER_APPLE=5'], ['add', 'MyFirstLetters=ABC'], ['add', "greeting='Hello        world!'"]] },
            { where: '你的终端机（zsh）', what: '完全没变', rows: ['（没有这三个变量）'] },
          ],
          note: '脚本是交给另一个 bash 跑的，跑完那个 bash 就结束了。所以之后在终端机打 `echo $greeting`，只会印出一行空白。',
        },
        alt([
          { from: 'echo "Price per apple: $PRICE_PER_APPLE"', to: [
            ['echo "Price per apple: ${PRICE_PER_APPLE}"', '用大括号框住名字。后面紧接着其他字时一定要用，例如 `${PRICE_PER_APPLE}元`'],
            ["printf 'Price per apple: %s\\n' \"$PRICE_PER_APPLE\"", '`printf` 用 `%s` 占位，格式和数据分开写'],
          ] },
        ]),
      ],
      引号: [
        {
          type: 'oops', title: 'echo 用了单引号',
          wrong: "echo 'Greeting: $greeting'",
          out: 'Greeting: $greeting',
          why: '单引号里的东西 Shell 一个字都不动，`$greeting` 就原样印出来了。',
          right: 'echo "Greeting: $greeting"',
        },
        {
          type: 'oops', title: 'echo 没加引号',
          wrong: 'echo Greeting: $greeting',
          out: 'Greeting: Hello world!',
          why: '没有引号，Shell 把值按空格切成 `Hello` 和 `world!` 两块，`echo` 再用一个空格接起来，8 个空格只剩 1 个。',
          right: 'echo "Greeting: $greeting"',
          fix: '用到变量时，习惯包一层双引号。',
        },
      ],
      题目: [
        alt([
          { from: 'touch /home/labex/project/variables.sh', to: [['touch ~/project/variables.sh', '`~` 就是 `/home/labex`，比较短']] },
          { from: 'chmod +x /home/labex/project/variables.sh', to: [['chmod +x variables.sh', '已经站在 `project` 里，就不用写完整路径']] },
        ]),
      ],
    },
  });

  // 19 引用变量 --------------------------------------------------------------------
  KM.deepen('quoting-variables', {
    story: {
      title: '印一张商品标签',
      lead: '你要用脚本印出一行商品标签：品名、价钱和货币符号。三个坑刚好一次踩到。',
      steps: [
        { say: '先存好两个变量：`ITEM=Apple`、`PRICE=5`。' },
        { say: '第一版写 `echo "$ITEM: $HK $PRICE"`，结果印出 `Apple:  5`，港币符号不见了，中间还多一个空格。', note: '`$HK` 被当成变量，而这个变量不存在，所以是空的。' },
        { say: '改成 `\\$HK`，就印出 `Apple: $HK 5`。' },
        { say: '又想印出 `Apples`（复数），写了 `$ITEMs`，结果什么都没有。', note: 'Shell 去找一个叫 `ITEMs` 的变量。' },
        { say: '改成 `${ITEM}s`，就印出 `Apples`。' },
        { say: '最后把整句放在双引号里，以后品名里有空格（例如 `Green   Apple`）也不怕被压掉。' },
      ],
    },
    poster: {
      title: '引用变量的三个工具',
      lanes: [
        { name: '三种情况', nodes: [
          { cmd: '\\$', does: '想印出 `$` 本身' },
          { cmd: '${NAME}x', does: '名字后面紧接着字母、数字、底线' },
          { cmd: '"$NAME"', does: '值里有空格要保留' },
        ] },
      ],
      line: '不确定时：变量一律写成 `"${NAME}"`，钱号写成 `\\$`。',
    },
    at: {
      转义: [
        {
          type: 'oops', title: '忘了在 $ 前面加反斜线',
          wrong: 'echo "The price of an Apple today is: $HK $PRICE_PER_APPLE"',
          out: 'The price of an Apple today is:  5',
          why: 'Shell 把 `$HK` 当成变量。没有这个变量，就换成空的，所以 `HK` 不见了，还留下两个空格。不会报错，很容易没注意到。',
          right: 'echo "The price of an Apple today is: \\$HK $PRICE_PER_APPLE"',
        },
        {
          type: 'behind', title: 'Shell 读双引号的顺序',
          cmd: 'echo "…is: \\$HK $PRICE_PER_APPLE"',
          places: [
            { where: 'Shell 由左到右', what: '先处理特殊字，再交给 echo', rows: [['read', '\\$ → 普通的 $'], ['edit', '$PRICE_PER_APPLE → 5']] },
            { where: 'echo 拿到的参数', what: '只有一个，已经处理好', rows: [['add', 'The price of an Apple today is: $HK 5']] },
          ],
          note: '`echo` 从头到尾没看过反斜线和变量名，它只负责把拿到的文字印出来。',
        },
        alt([
          { from: 'echo "The price of an Apple today is: \\$HK $PRICE_PER_APPLE"', to: [
            ['echo \'The price of an Apple today is: $HK\' "$PRICE_PER_APPLE"', '前半段用单引号，里面的 `$` 自然不会被换；`echo` 会在两段中间补一个空格'],
            ['printf \'The price of an Apple today is: $HK %s\\n\' "$PRICE_PER_APPLE"', '`printf` 的格式用单引号写，`%s` 再换成价钱'],
          ] },
        ]),
      ],
      大括号: [
        {
          type: 'oops', title: '名字后面紧接着字母，没加大括号',
          wrong: 'echo "The first 10 letters in the alphabet are: $MyFirstLettersDEFGHIJ"',
          out: 'The first 10 letters in the alphabet are: ',
          why: 'Shell 把 `MyFirstLettersDEFGHIJ` 整串当成变量名。没有这个变量，就换成空的，连 `DEFGHIJ` 都一起不见了。',
          right: 'echo "The first 10 letters in the alphabet are: ${MyFirstLetters}DEFGHIJ"',
        },
        alt([
          { from: 'echo "…are: ${MyFirstLetters}DEFGHIJ"', to: [['echo "…are: $MyFirstLetters""DEFGHIJ"', '用两段引号隔开名字也可以，但比大括号难读']] },
        ]),
      ],
      空白: [
        {
          type: 'behind', title: 'echo $greeting 时，echo 拿到几个参数',
          cmd: 'echo $greeting',
          places: [
            { where: '不加引号', what: '值被切开', rows: [['edit', '参数 1：Hello'], ['edit', '参数 2：world!']] },
            { where: '加了双引号 "$greeting"', what: '整包一个', rows: [['add', '参数 1：Hello        world!']] },
          ],
          note: '`echo` 会用一个空格把它拿到的参数接起来。拿到两个参数，中间就只有一个空格。',
        },
      ],
    },
  });
})();
