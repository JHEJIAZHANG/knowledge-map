(function () {
  const PROMPT = 'labex:project/ $';
  const SCRIPT = "#!/bin/bash\necho 'Hello, World!'";

  KnowledgeMap.add({
    id: 'hello-script',
    topic: 'linux',
    group: 'scripts',
    date: '2026-11-16',
    title: '第一个 Shell 脚本：hello.sh',
    summary: '用 touch 建文件、在编辑器写两行、用 chmod +x 加上执行权限，再用 ./hello.sh 把它跑起来。',
    quiz: [
      { q: '脚本第一行的 `#!/bin/bash` 叫什么？', choices: ['shebang', '注释标题', '文件名'], answer: 0, why: '`#!` 开头的第一行叫 shebang，告诉系统要用哪个程序来运行这个脚本。' },
      { q: '要让 `hello.sh` 可以直接运行，要打什么？', answer: ['chmod +x hello.sh', 'chmod u+x hello.sh', 'chmod a+x hello.sh'], why: '`+x` 是加上执行权限。没有 `x`，`./hello.sh` 会被拒绝。' },
      { q: '`-rw-rw-r--` 的文件运行 `chmod +x` 之后，权限会变成什么？', choices: ['-rwxrw-r--', '-rwxrwxr-x', '-rw-rw-r-x'], answer: 1, why: '没写给谁时，三组都会加上 `x`。' },
      { q: '要运行目前目录里的 `hello.sh`，要打什么？', answer: ['./hello.sh', 'bash hello.sh'], why: '`./` 代表「目前目录里的」。只打 `hello.sh`，Shell 会到放命令的地方去找，找不到。' },
      { q: '在编辑器打完两行，但还没按 `Ctrl + S` 就运行 `./hello.sh`，会怎样？', choices: ['照样印出 Hello, World!', '什么都不印，因为文件里还是空的', '出现 permission denied'], answer: 1, why: '没存档之前，文字只在编辑器的画面上，文件本身还是 `touch` 出来的空文件。' },
    ],
    sections: [
      {
        nav: '准备',
        kicker: '建文件',
        title: '先做出一个空的 hello.sh',
        lead: '脚本就是一个普通的文本文件，里面一行写一个命令。先用学过的 `touch` 做出空文件。',
        blocks: [
          {
            type: 'terminal',
            span: 6,
            prompt: PROMPT,
            lines: [
              { cmd: 'ls' },
              { cmd: 'touch hello.sh' },
            ],
          },
          {
            type: 'text',
            span: 6,
            title: '两行在做什么',
            text: [
              '`ls` 没有任何输出，代表 `project` 目录目前是空的。',
              '`touch hello.sh` 做出一个空文件。`.sh` 结尾是习惯，让人一看就知道这是 Shell 脚本。',
            ],
          },
        ],
      },
      {
        nav: '编辑',
        kicker: '写内容',
        title: '在编辑器里写下两行',
        lead: '这一步不是在终端机打命令，而是在 WebIDE 左边的文件列表双击 `hello.sh`，用编辑器打字。',
        blocks: [
          {
            type: 'terminal',
            span: 6,
            prompt: '1',
            lines: [
              { prompt: '1', cmd: '#!/bin/bash' },
              { prompt: '2', cmd: "echo 'Hello, World!'" },
            ],
          },
          {
            type: 'terms',
            span: 6,
            title: '一行一行看',
            items: [
              ['`#!/bin/bash`', '叫 **shebang**。告诉系统：这个文件要交给 `/bin/bash` 这个程序来运行。一定要放在第一行。'],
              ["`echo 'Hello, World!'`", '用学过的 `echo` 把文本印在画面上。'],
            ],
          },
          {
            type: 'text',
            title: '记得存档',
            text: [
              '打完按 `Ctrl + S`（Mac 是 `Cmd + S`），或从上方菜单选 File → Save。',
              '没存档之前，字只在编辑器的画面上，文件本身还是空的。',
            ],
          },
          {
            type: 'extra',
            title: '为什么用单引号',
            text: [
              '单引号里的东西 Shell 一个字都不会动，原样交给 `echo`。',
              '双引号里的某些符号会被 Shell 先处理，例如 `$`。这一行用双引号其实也可以，但只是要印固定的文本时，用单引号最保险。',
            ],
          },
        ],
      },
      {
        nav: '权限',
        kicker: '加上执行权限',
        title: 'chmod +x：让文件可以被执行',
        lead: '`touch` 做出来的文件只能读写，不能执行。`chmod +x` 帮它加上执行权限 `x`。',
        blocks: [
          { type: 'movie', film: 'chmodx' },
          {
            type: 'terminal',
            span: 6,
            prompt: PROMPT,
            lines: [{ cmd: 'chmod +x hello.sh' }],
          },
          {
            type: 'text',
            span: 6,
            title: '和之前的 chmod 764 有什么不同',
            text: [
              '之前学的 `chmod 764` 是用数字把三组权限**整个重设**。',
              '`chmod +x` 是用符号**只改一个开关**：其他权限不动，只加上 `x`。',
            ],
          },
          {
            type: 'terms',
            title: '符号写法的三个部分',
            items: [
              ['给谁：`u` `g` `o` `a`', '`u` 拥有者、`g` 用户组、`o` 其他人、`a` 全部。不写就是全部。'],
              ['怎么改：`+` `-` `=`', '`+` 加上、`-` 拿掉、`=` 设成只有这些。'],
              ['什么权限：`r` `w` `x`', '读、写、执行，可以一次写好几个，例如 `+rx`。'],
              ['（补充）`u+x`', '只给拥有者加上执行权限。'],
              ['（补充）`go-w`', '把用户组和其他人的写入权限拿掉。'],
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '不写给谁，就是三组都加吗',
            text: '大致上是。严格说，不写给谁时，chmod 会避开 umask 设定里挡掉的权限。LabEx 的 umask 是 `002`，只挡其他人的 `w`，所以 `+x` 的结果就是三组都加上 `x`：`-rw-rw-r--` 变成 `-rwxrwxr-x`。',
          },
        ],
      },
      {
        nav: '运行',
        kicker: '跑起来',
        title: './hello.sh：运行脚本',
        lead: '打 `./hello.sh`，Shell 会读第一行的 shebang，把整个文件交给 `bash` 一行一行做。',
        blocks: [
          { type: 'movie', film: 'shebang' },
          {
            type: 'terminal',
            span: 6,
            prompt: PROMPT,
            lines: [
              { cmd: './hello.sh', out: 'Hello, World!' },
              { cmd: 'cat hello.sh', out: SCRIPT },
            ],
          },
          {
            type: 'text',
            span: 6,
            title: '跑和看是两回事',
            text: [
              '`./hello.sh` 是**运行**：照着里面的命令做，所以印出 `Hello, World!`。',
              '`cat hello.sh` 只是**看**：把文件内容原样印出来，里面的命令一个都没跑。',
              '`./` 代表「目前目录里的」，不能省略。',
            ],
          },
          {
            type: 'analogy',
            title: '像一夹写好的工单',
            text: '平常你在服务台一句一句交代。脚本是把要交代的事先写好、夹成一夹，封面（shebang）写明交给谁办。递出去一次，对方就从头做到尾。',
          },
        ],
      },
      {
        nav: '总结',
        kicker: '总结',
        title: '整段操作重看一次',
        lead: '右边是 `project` 目录。注意 `hello.sh` 的权限和内容各在哪一步改变。',
        blocks: [
          {
            type: 'run',
            title: '从空目录到印出 Hello, World!',
            root: '/home/labex/project',
            cwd: '/home/labex/project',
            perms: true,
            tree: {},
            commands: [
              { cmd: 'ls', out: '', note: '目录是空的，什么都没印。' },
              { cmd: 'touch hello.sh', note: '做出空文件。权限是 `-rw-rw-r--`，没有 `x`。' },
              { edit: { file: 'hello.sh', content: `${SCRIPT}\n` }, note: '在 WebIDE 编辑器里打两行，按 `Ctrl + S` 存档。这一步不是命令，所以终端机没有动。（补充：记录里看不出这一步是在 `chmod` 之前还是之后，两种顺序结果都一样。）' },
              { cmd: 'chmod +x hello.sh', note: '三组都加上 `x`，变成 `-rwxrwxr-x`。内容没变。' },
              { cmd: './hello.sh', out: 'Hello, World!', note: '交给 `bash` 一行一行做，印出 `Hello, World!`。' },
              { cmd: 'cat hello.sh', out: SCRIPT, note: '只是把内容印出来看，没有运行。' },
            ],
          },
          {
            type: 'recap',
            items: [
              '脚本是一个文本文件，一行一个命令，通常用 `.sh` 结尾。',
              '第一行 `#!/bin/bash` 是 shebang，指定交给谁运行。',
              '在编辑器打完要按 `Ctrl + S` 存档。',
              '`chmod +x` 加上执行权限，没写给谁就是三组都加。',
              '`./hello.sh` 是运行，`cat hello.sh` 只是看。',
            ],
          },
        ],
      },
    ],
  });
})();
