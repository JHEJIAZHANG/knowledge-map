(function () {
  const PROMPT = 'labex:project/ $';

  KnowledgeMap.add({
    id: 'copy-and-move',
    topic: 'linux',
    group: 'move',
    date: '2026-11-09',
    title: 'cp 和 mv：复制与搬家',
    summary: 'cp 会多出一份，mv 永远只有一份。改名和搬家，其实是同一件事。',
    quiz: [
      { q: '运行 `cp a.txt b.txt` 之后，有哪些文件？', choices: ['只剩 `b.txt`', '只剩 `a.txt`', '`a.txt` 和 `b.txt` 都在'], answer: 2, why: '`cp` 是复制，原本的还在，会多出一份。' },
      { q: '把 `old.txt` 改名成 `new.txt`，要输入什么？', answer: 'mv old.txt new.txt', why: '改名就是用 `mv` 搬到新的名字。' },
      { q: '复制整个目录 `docs`，新的叫 `docs_copy`，要输入什么？', answer: ['cp -r docs docs_copy', 'cp -R docs docs_copy'], why: '复制目录要加 `-r`，连里面的内容一起复制。' },
      { q: '`mv file.txt testdir/` 会发生什么事？', choices: ['把 `file.txt` 搬进 `testdir`', '把 `file.txt` 改名成 `testdir`', '在 `testdir` 多一份副本，原本的还在'], answer: 0, why: '目的地是目录，所以是搬进去。`mv` 永远只有一份。' },
    ],
    sections: [
      {
        nav: '差别',
        kicker: '开始之前',
        title: '一句话分清楚',
        blocks: [
          {
            type: 'analogy',
            title: '`cp` 是复印',
            text: '复印之后，原稿还在手上，又多了一份新的。不管复制到哪里，**原本的文件都不会动**。',
          },
          {
            type: 'analogy',
            title: '`mv` 是搬家',
            text: '东西从 A 搬到 B，A 就没有了。全程**只有一份**。替文件换名字，也是用 `mv`。',
          },
        ],
      },
      {
        nav: 'cp',
        kicker: '命令 1',
        title: 'cp：复制',
        lead: '格式是 `cp 来源 目的地`，先写「从哪里」，再写「到哪里」。',
        blocks: [
          { type: 'movie', film: 'cp' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'cp file1.txt file1_copy.txt' },
              { cmd: 'ls', out: 'file1.txt  file1_copy.txt  file2.txt  testdir' },
              { cmd: 'ls', out: 'file1.txt  file1_copy.txt  file2.txt  testdir' },
              { cmd: 'cp file2.txt testdir/' },
              { cmd: 'cp -r testdir testdir_copy' },
              { cmd: 'ls', out: 'file1.txt  file1_copy.txt  file2.txt  testdir  testdir_copy' },
              { cmd: 'ls testdir', out: 'file2.txt' },
              { cmd: 'ls testdir_copy', out: 'file2.txt' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '三种用法',
            text: [
              '**换个名字复制**：目的地写新文件名。',
              '**复制进目录**：目的地写目录，文件名维持不变。',
              '**复制整个目录**：要加 `-r`（recursive，递归），连里面的东西一起复制。',
            ],
          },
          {
            type: "run",
            title: "看 cp 怎么多出一份",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {
              ".hiddenfile": "Hidden file\n",
              "file1.txt": "",
              "file2.txt": "Hello, Linux\n",
              testdir: {}
            },
            commands: [
              {
                cmd: "cp file1.txt file1_copy.txt",
                note: "复制一份并取新名字，来源 `file1.txt` 还在原地。"
              },
              {
                cmd: "ls",
                note: "多了 `file1_copy.txt`，原本的文件也都在。",
                out: "file1.txt  file1_copy.txt  file2.txt  testdir"
              },
              {
                cmd: "cp file2.txt testdir/",
                note: "目的地是已存在的目录，所以文件被放进去，名字和内容都不变。"
              },
              {
                cmd: "cp -r testdir testdir_copy",
                note: "`-r` 让目录连同里面的 `file2.txt` 一起被复制。"
              },
              {
                cmd: "ls",
                note: "所有源文件案都还在，只是多了副本。",
                out: "file1.txt  file1_copy.txt  file2.txt  testdir  testdir_copy"
              },
              {
                cmd: "ls testdir",
                note: "`testdir` 里有刚刚放进去的 `file2.txt`。",
                out: "file2.txt"
              },
              {
                cmd: "ls testdir_copy",
                note: "副本目录里也有一份，内容相同。",
                out: "file2.txt"
              }
            ]
          },
        ],
      },
      {
        nav: 'mv',
        kicker: '命令 2',
        title: 'mv：搬家和改名',
        lead: '格式和 `cp` 一样是 `mv 来源 目的地`，但 `mv` 不需要 `-r`，目录也能直接搬。',
        blocks: [
          { type: 'movie', film: 'mv' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'mv file1.txt newname.txt' },
              { cmd: 'mv newname.txt testdir/' },
              { cmd: 'mv testdir_copy new_testdir' },
              { cmd: 'mv testdir/newname.txt ./original_file1.txt' },
              { cmd: 'ls', out: 'file1_copy.txt  file2.txt  new_testdir  original_file1.txt  testdir' },
              { cmd: 'ls testdir', out: 'file2.txt' },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '改名就是搬到新名字',
            text: [
              'Linux 没有专门的改名命令。`mv` 只在乎「新的位置和名字」，留在原地就等于改名。',
              '`./original_file1.txt` 里的 `.` 是目前的目录，意思是搬回这里，顺便换名字。',
            ],
          },
          {
            type: "run",
            title: "跟着 file1.txt 搬家",
            root: "/home/labex/project",
            cwd: "/home/labex/project",
            tree: {
              ".hiddenfile": "Hidden file\n",
              "file1.txt": "",
              "file1_copy.txt": "",
              "file2.txt": "Hello, Linux\n",
              testdir: {
                "file2.txt": "Hello, Linux\n"
              },
              testdir_copy: {
                "file2.txt": "Hello, Linux\n"
              }
            },
            commands: [
              {
                cmd: "mv file1.txt newname.txt",
                note: "改名：`file1.txt` 消失，变成 `newname.txt`，内容不变。"
              },
              {
                cmd: "mv newname.txt testdir/",
                note: "目的地是目录，所以 `newname.txt` 被移进 `testdir`。"
              },
              {
                cmd: "mv testdir_copy new_testdir",
                note: "目录改名不需要 `-r`，里面的 `file2.txt` 会一起跟着走。"
              },
              {
                cmd: "mv testdir/newname.txt ./original_file1.txt",
                note: "一次做两件事：移回目前目录（`./`），同时改名。"
              },
              {
                cmd: "ls",
                note: "从头到尾都只有一份，只是位置和名字变了。",
                out: "file1_copy.txt  file2.txt  new_testdir  original_file1.txt  testdir"
              },
              {
                cmd: "ls testdir",
                note: "文件已经搬走，`testdir` 里只剩 `file2.txt`。",
                out: "file2.txt"
              }
            ]
          },
        ],
      },
      {
        nav: '总结',
        kicker: '整理一下',
        title: '这一篇学到的事',
        blocks: [
          {
            type: 'terms',
            span: 7,
            items: [
              ['来源', '要被复制或搬走的东西，写在前面。'],
              ['目的地', '要放到哪里或叫什么名字，写在后面。'],
              ['递归 `-r`', '连同目录里面的所有内容一起处理。'],
            ],
          },
          {
            type: 'extra',
            span: 5,
            title: '小心盖掉同名文件',
            text: '如果目的地已经有同名文件，`cp` 和 `mv` 默认会**直接覆盖，不会询问**。加上 `-i` 就会先问过你。另外，复制目录时忘了 `-r`，`cp` 会提示略过该目录。',
          },
          {
            type: 'recap',
            items: [
              '`cp 来源 目的地` 会多出一份。',
              '复制目录要加 `-r`。',
              '`mv` 只有一份，用来搬家。',
              '留在原地的 `mv` 就是改名。',
              '`.` 代表目前的目录。',
            ],
          },
        ],
      },
    ],
  });
})();
