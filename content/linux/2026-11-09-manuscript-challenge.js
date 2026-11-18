(function () {
  const P = '/home/labex/project';
  const PROMPT = 'labex:project/ $';
  const V1 = ['The old clock struck midnight.', 'A shadow moved across the room.', "The detective's eyes narrowed."];
  const V2 = ['The old clock struck midnight.', 'A figure darted behind the curtains.', "The detective's eyes narrowed."];
  const toText = (lines) => `${lines.join('\n')}\n`;
  const card = (title, lines, picks) => ({
    title,
    icon: 'file',
    rows: lines.map((l, i) => [`第 ${i + 1} 行`, (picks.includes(i) ? '!' : '') + l]),
  });
  const DIFF_OUT = '2c2\n< A shadow moved across the room.\n---\n> A figure darted behind the curtains.';

  KnowledgeMap.add({
    id: 'manuscript-challenge',
    topic: 'linux',
    group: 'view',
    kind: 'challenge',
    date: '2026-11-09',
    title: '比较两份神秘稿件',
    summary: '只用 cat、head、tail 和 diff，找出两个版本的稿件到底差在哪一行。',
    quiz: [
      { q: '要找出两个版本差在哪一行，最直接的命令是哪个？', choices: ['`cat`', '`head`', '`diff`'], answer: 2, why: '`diff` 直接列出不同的行，不用自己一行一行对。' },
      { q: '只看 `manuscript_v1.txt` 的最后一行，要输入什么？', answer: ['tail -n1 manuscript_v1.txt', 'tail -n 1 manuscript_v1.txt', 'tail -1 manuscript_v1.txt'], why: '`tail -n1` 只取最后一行。' },
      { q: '只看 `manuscript_v2.txt` 的前两行，要输入什么？', answer: ['head -n2 manuscript_v2.txt', 'head -n 2 manuscript_v2.txt', 'head -2 manuscript_v2.txt'], why: '`head -n2` 只取开头两行。' },
    ],
    sections: [
      {
        nav: '题目',
        kicker: '挑战',
        title: '当一次文档侦探',
        lead: '文件夹里有 `manuscript_v1.txt` 和 `manuscript_v2.txt` 两份稿件，任务是找出它们的差别，**而且不能修改文件**。',
        blocks: [
          {
            type: 'analogy',
            title: '先看线索，再下结论',
            text: '侦探不会一开始就下判断。先分别读两份稿件，掌握内容，最后才用 `diff` 正式比对。',
          },
          {
            type: 'text',
            title: '任务清单',
            text: [
              '第一步：用 `cat` 看第 1 版全文，用 `head` 看第 2 版的前两行，用 `tail` 看两份的最后一行。',
              '第二步：用 `diff` 直接比较两个文件，并看懂输出。',
            ],
          },
        ],
      },
      {
        nav: '检查',
        kicker: '第一步',
        title: '分别检查两份稿件',
        blocks: [
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [
              { cmd: 'pwd', out: P },
              { cmd: 'cat manuscript_v1.txt', out: V1.join('\n') },
              { cmd: 'head -n2 manuscript_v2.txt', out: `${V2[0]}\n${V2[1]}` },
              { cmd: 'tail -n1 manuscript_v1.txt', out: V1[2] },
              { cmd: 'tail -n1 manuscript_v2.txt', out: V2[2] },
            ],
          },
          {
            type: 'text',
            span: 5,
            title: '找到了什么线索？',
            text: [
              '第 1 行相同，**第 2 行不同**，最后一行也相同。',
              '因为 `pwd` 确认了就在 `project` 里，所以直接写文件名就好，不用打完整路径。',
            ],
          },
          {
            type: 'run',
            title: '每个命令读到了哪几行',
            root: P,
            cwd: P,
            tree: { 'manuscript_v1.txt': toText(V1), 'manuscript_v2.txt': toText(V2) },
            commands: [
              { cmd: 'pwd', out: P, note: '动手前先确认位置。两份稿件都在这个目录里。' },
              { cmd: 'cat manuscript_v1.txt', out: V1.join('\n'), note: '`cat` 把第 1 版从头印到尾，共 3 行。', info: card('第 1 版：全部 3 行', V1, [0, 1, 2]) },
              { cmd: 'head -n2 manuscript_v2.txt', out: `${V2[0]}\n${V2[1]}`, note: '`head -n2` 只取开头 2 行。第 2 行和第 1 版不一样，线索出现了。', info: card('第 2 版：开头 2 行', V2, [0, 1]) },
              { cmd: 'tail -n1 manuscript_v1.txt', out: V1[2], note: '`tail -n1` 只取最后一行。', info: card('第 1 版：最后 1 行', V1, [2]) },
              { cmd: 'tail -n1 manuscript_v2.txt', out: V2[2], note: '两份的最后一行完全相同。', info: card('第 2 版：最后 1 行', V2, [2]) },
            ],
          },
        ],
      },
      {
        nav: '比较',
        kicker: '第二步',
        title: 'diff：正式比对',
        lead: '`diff` 只列出不同的地方，看输出就知道差异在哪里。',
        blocks: [
          { type: 'movie', film: 'manuscript' },
          {
            type: 'terminal',
            span: 7,
            prompt: PROMPT,
            lines: [{ cmd: 'diff manuscript_v1.txt manuscript_v2.txt', out: DIFF_OUT }],
          },
          {
            type: 'text',
            span: 5,
            title: '读懂 `2c2`',
            text: [
              '第 1 个 `2` 是左边文件的第 2 行，`c` 是 change（换掉），第 2 个 `2` 是右边文件的第 2 行。',
              '`<` 是第 1 版的内容，`>` 是第 2 版的内容。',
            ],
          },
          {
            type: 'extra',
            span: 12,
            title: '没列出来的，就是相同的',
            text: '`diff` 只报告了第 2 行，代表其他行都一样，和前面用 `head`、`tail` 找到的线索吻合。文件很长时，直接用 `diff` 比逐行阅读可靠得多。',
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
              '先用 `pwd` 确认位置。',
              '`cat` 看全文。',
              '`head -n2` 看开头 2 行。',
              '`tail -n1` 看最后 1 行。',
              '`2c2` 代表两边的第 2 行不同。',
            ],
          },
        ],
      },
    ],
  });
})();
