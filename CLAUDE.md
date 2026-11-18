# 知识地图（Knowledge Map）

用户的个人学习网站。用户在 LabEx 上学 Linux、Shell 脚本和 Python，会把操作记录（终端机输出）或题目说明贴过来；每贴一段，就整理成一篇新的文章。

## 基本规则

- 纯 HTML/CSS/JS，没有打包步骤，直接用 `file://` 打开 `index.html` 就要能用。
- **所有内容用简体中文、大陆用语**：文件、命令、默认、用户组、账号、配置文件、日志文件、压缩包。
- 解说对象是初学者：白话、一句一个重点。
- 不在用户原始记录里、由 Claude 另外加的东西，一律标「补充」。
- 只贴了题目文字、没有实际操作记录时，要在文章里写明；记录有缺漏或前后对不上的地方，也要在文章里说清楚，不要自己圆过去。
- 错误消息照 LabEx 的环境写：Shell 是 zsh，脚本是 bash，Python 是 3.10.12。没有实际跑过的，在回报时说明。
- 用户主要在电脑上看；版面仍要在手机宽度不横向跑版。
- 视觉风格参照 OPPO ColorOS。标题用 Noto Serif SC，正文 Inter + 苹方，代码 JetBrains Mono（Google Fonts）。

## 新增一篇文章时要做的事

1. 建 `content/<主题>/YYYY-MM-DD-名称.js`，在 `index.html` 加 script（同一主题内的顺序就是学习顺序）。
2. 格式见 `content/topics.js` 开头的说明。每篇都要有：
   - 小节（`nav` 不重复），终端机区块照记录原样，
   - 情境短片 `movie`（一个固定比喻，结尾是口诀），
   - 最后一节的逐步演示 `run`（输出要和记录一致；`js/run.js` 和 `js/py.js` 会在主控台警告对不上的地方），
   - 小测验 `quiz`。
3. 在 `content/<主题>/deepen.js` 加 `KM.deepen('文章 id', {...})`：`story`、`poster`，以及用 `at` 加到各小节的 `oops`（翻车现场）、`behind`（幕后视角）、`alt`（换个写法，原本的写法照样保留）。
4. 新命令补进 `js/anatomy.js` 的 `DOC`（Python 内置函数在 `PYDOC`）。
5. 新的短片写在 `js/films.js`（Shell）或 `js/films-py.js`（Python）。

## 版面原则（2026-11-18 重构）

- 文章只让主线占版面：说明、终端机、短片、逐步演示。
- 补充内容默认收起：情境故事 `story` 收在文章开头，点开才展开；`oops`、`behind`、`alt` 收进每节最后的「补充・想多看一点」分段标签，一次只展开一张。
- 小测验一次一题，下面有题号圆点和上一题、下一题。
- 首页顺序：搜索、继续学习（上次看到的那篇和下一篇）、课程目录（编号就是学习顺序）、学习记录（日历、统计、最近添加）。
- **不用全站的大楼比喻**：用户觉得没帮助，已经拿掉大楼地图页、文章开头的楼层条、短片里的楼层门牌。分类直接用名称（Shell 基础、Shell 脚本…）。每个概念自己的比喻照常用（机器人是 Shell，变量是挂在值上的名牌）。新分类只要在 `topics.js` 加 group。

## 检查方式

- 语法：`node -e "new Function(require('fs').readFileSync('文件','utf8'))"`。
- 把 `index.html css js content` 复制到暂存目录，用 `python3 -m http.server 8765 --bind 127.0.0.1` 开起来，在浏览器设成 1440×900：
  - 每篇、首页、`#/cheat`、`#/memo` 都没有横向跑版（`scrollWidth <= innerWidth`），
  - 短片文字没有超框或重叠：把 `tools/audit.js` 一起复制过去，在页面里 `eval(await (await fetch('audit.js')).text())` 后运行 `await auditFilms()`，它会逐镜头检查，结果应该是空数组，
  - 主控台没有「仿真结果和实际输出不同」的警告。

## 回报

用简体中文，附上改动文件的链接；说清楚哪些是补充、哪些没实际跑过、记录里哪里有缺。
