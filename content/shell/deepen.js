/* Shell 脚本文章的补充内容。格式说明见 content/topics.js。
 * 这个文件里的东西都不在原始笔记里，页面上会标成「补充」。
 * 错误消息照 LabEx 的环境写（交互的 Shell 是 zsh，脚本用 bash 运行）。
 */
(function () {
  const KM = window.KnowledgeMap;
  const alt = (rows, title) => ({ type: 'alt', title, rows });
  // 01 第一个 Shell 脚本 ----------------------------------------------------------
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

  // 02 Shell 变量 ------------------------------------------------------------------
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

  // 03 引用变量 --------------------------------------------------------------------
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
