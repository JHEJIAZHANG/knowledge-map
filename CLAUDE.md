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
3. 在 `content/<主题>/deepen.js` 加 `KM.deepen('文章 id', {...})`：`world`、`story`、`poster`，以及用 `at` 加到各小节的 `oops`（翻车现场）、`behind`（幕后视角）、`alt`（换个写法，原本的写法照样保留）。
4. 新命令补进 `js/anatomy.js` 的 `DOC`（Python 内置函数在 `PYDOC`）。
5. 新的短片写在 `js/films.js`（Shell）或 `js/films-py.js`（Python）。

## 全站比喻：一栋大楼

`KM.zones` 每个分类一间房间，两间一层：1F 服务台/管理室、2F 走廊与门牌/房间与文档、3F 复印室/阅览室、4F 工单室（Shell 脚本）/Python 工作室。机器人是 Shell，工单是命令，变量是挂在值上的名牌。新分类要在 `topics.js` 加 group，并在 deepen.js 加 zone。

## 检查方式

- 语法：`node -e "new Function(require('fs').readFileSync('文件','utf8'))"`。
- 把 `index.html css js content` 复制到暂存目录，用 `python3 -m http.server 8765 --bind 127.0.0.1` 开起来，在浏览器设成 1440×900：
  - 每篇、首页、`#/cheat`、`#/memo`、`#/world` 都没有横向跑版（`scrollWidth <= innerWidth`），
  - 短片文字没有超框或重叠：把 `tools/audit.js` 一起复制过去，在页面里 `eval(await (await fetch('audit.js')).text())` 后运行 `await auditFilms()`，它会逐镜头检查（`pipe#5` 和 `escape#1` 的门牌重叠是预期的，门牌会淡出），
  - 主控台没有「仿真结果和实际输出不同」的警告。

## 回报

用简体中文，附上改动文件的链接；说清楚哪些是补充、哪些没实际跑过、记录里哪里有缺。
