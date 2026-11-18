/* 主题清单：这里的排列顺序就是主题卡片的顺序。
 *
 * 添加一篇文章：
 *   1. 创建 content/主题/YYYY-MM-DD-名称.js
 *   2. 在 index.html 加一行 script。同一主题内，script 的顺序就是学习顺序
 *
 * 文章格式
 * KnowledgeMap.add({
 *   id: 'url-safe-id',      // 网址用，不可重复
 *   topic: 'linux',         // 对应下面的主题 id
 *   group: 'shell',         // 对应该主题 groups 里的分类 id
 *   date: '2026-11-09',     // 上传日期，之后不再更动
 *   updated: '2026-12-01',  // 选填：内容修改的日期
 *   title: '标题',
 *   summary: '一句话说明这篇在讲什么',
 *   sections: [ ...小节 ],   // 依阅读顺序排列
 *   quiz: [ ...题目 ],       // 选填：文章最后的小测验
 * });
 *
 * 小节：{ nav: '浮岛上的短名称', kicker, title, lead, blocks: [ ...区块 ] }
 *   nav 同时用来定位，同一篇内不可重复
 *
 * 小测验的题目有两种，why 是答对或看答案后显示的解说：
 *   { q: '题目', answer: '命令' 或 ['可接受的写法', ...], why, hint: '输入框提示（选填）' }   自己打答案
 *   { q: '题目', choices: ['选项', ...], answer: 正确选项的位置（从 0 算起）, why }            选择题
 *
 * 区块排在 12 栏的格在线，span 是占几栏（两个 6 会并排），不写就用默认值。
 * 文本可用 **粗体** 和 `代码`；text 可以是字符串或字符串数组。
 *   { type: 'text',     title, text }                   默认 6 栏
 *   { type: 'analogy',  title, text }                   生活比喻，默认 6 栏
 *   { type: 'extra',    title, text }                   补充：原始笔记以外另外加的内容，默认 6 栏
 *   { type: 'terminal', prompt, lines: [{ cmd, out }] } 终端机画面，默认 6 栏。prompt 写 '>>>' 就是 Python 代码
 *     每行可再加 prompt（这行的提示字符不同时）、err: true（输出是错误消息）
 *   { type: 'terms',    items: [[名词, 白话]] }          默认 12 栏
 *   { type: 'recap',    items: [重点] }                  默认 12 栏
 *   { type: 'run', title, root, cwd, tree, commands }   动画演示：左边终端机、右边文件树，固定 12 栏
 *     root：文件树从哪里开始显示；cwd：一开始所在的目录
 *     tree：{ '文件名': '文件内容', '目录名': { ...里面的内容 } }
 *     startInfo：起始画面改显示信息卡（见下面的 info）
 *     commands：[{ cmd, out, err: true, note, info }]，照实际操作的顺序写
 *       note：这一步的一句话解说
 *       文件的变化由仿真器算出来，支持 echo、touch、mkdir、cp、mv、rm、rmdir、cd、pwd、ls、cat、head、tail、diff
 *       没有 cmd 的步骤是纯解说，终端机不动
 *       edit: { file, content }：没有 cmd 时，代表在编辑器里把文件改成 content 并存档
 *       put：像 `whoami > 文件` 这种把输出导向文件的命令，写进文件的内容放在这里
 *       Python：打 python 之后提示字符变成 >>>，右边改画「名字表」（变量挂着什么值），exit() 离开。
 *         变量、算式、print、input、int 由 js/py.js 算出来；input 的回答从 out 里问题后面的字取得
 *       info：右边改显示信息卡，适合没有动到文件的命令
 *         { title, icon, rows: [[标签, 内容, 小字说明]] }，内容以 ! 开头会强调
 *         bytes: { text, pick: [起, 迄] } 把文本一个字节一格排出，亮起 [起, 迄) 的范围
 *
 * 加深印象的补充内容写在 content/主题/deepen.js，一篇文章一段：
 * KnowledgeMap.deepen('文章 id', {
 *   story: { title, lead, steps: [{ say, cmd, note }] }   情境故事，收在文章开头，点开才展开
 *   poster: { title, lanes: [{ name, flow: true, nodes: [{ cmd, does }] }], line }
 *     一张图总结，放在最后一个小节开头。flow 会在节点之间画箭头
 *   at: { '小节的 nav': [ ...区块 ] }                      oops、behind、alt 收进该小节最后的「补充」分段标签，点了才展开；
 *                                                           其他种类的区块照常加在小节最后
 * });
 *   { type: 'oops', title, wrong, state: { label, before: [..], after: [..] }, out, why, right, fix }
 *     py: true 表示是 Python 代码（提示字符显示 >>>）；oops、behind 和 story 的步骤都可以加
 *     翻车现场：打错的命令 wrong、出事后的变化（state 或错误消息 out）、原因 why、正确做法 right
 *   { type: 'behind', title, cmd, places: [{ where, what, rows: ['原有的一行', ['add' | 'del' | 'edit' | 'read', '有变动或被读取的一行']] }], note }
 *     幕后视角：这个命令实际动了系统里的哪些地方
 *   { type: 'alt', title, rows: [{ from: '原本的写法', to: [['另一种写法', '差在哪里']] }] }
 *     换个写法：同一件事的其他写法，原本的写法照样保留
 */
KnowledgeMap.topic({
  id: 'linux',
  name: 'Linux 基础',
  icon: 'terminal',
  // 分类的顺序就是显示的顺序，文章用 group 指定 id
  groups: [
    { id: 'shell', name: 'Shell 基础', icon: 'terminal' },
    { id: 'users', name: '用户与权限', icon: 'user' },
    { id: 'paths', name: '目录与路径', icon: 'folder' },
    { id: 'files', name: '文件操作', icon: 'file' },
    { id: 'move', name: '复制、移动与删除', icon: 'copy' },
    { id: 'view', name: '查看与比较', icon: 'eye' },
    { id: 'scripts', name: 'Shell 脚本', icon: 'list' },
  ],
  summary: '从终端机开始，一个命令一个命令认识 Linux。',
});

KnowledgeMap.topic({
  id: 'python',
  name: 'Python 基础',
  icon: 'code',
  groups: [
    { id: 'py-basics', name: '交互模式与变量', icon: 'code' },
  ],
  summary: '从交互模式开始，一行一行认识 Python。',
});
