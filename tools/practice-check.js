// 练习场自我检查：每一题的参考解答都要通过，起始状态不能已经通过
// 用法：node tools/practice-check.js（在项目根目录）
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const KM = { problems: [], problem(p) { this.problems.push(p); } };
const ctx = { window: { KnowledgeMap: KM }, KnowledgeMap: KM, console };
ctx.window.window = ctx.window;
vm.createContext(ctx);
['js/py.js', 'js/shell.js', 'content/practice/problems.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));

let bad = 0;
KM.problems.forEach((p, i) => {
  const { results, shown } = KM.Shell.verify(p);
  const fails = results.filter((r) => !r.ok);
  const atStart = KM.Shell.judge(new KM.Shell(p.setup), p.checks).every((r) => r.ok);
  const ok = !fails.length && !atStart;
  if (!ok) bad += 1;
  console.log(`${ok ? '✓' : '✗'} ${i + 1}. ${p.id}`);
  fails.forEach((f) => console.log(`    没通过：${f.say} ${f.got || ''}`));
  if (atStart) console.log('    什么都不做就通过了');
  if (!ok || process.env.SHOW) console.log(shown.replace(/^/gm, '    | '));
});
console.log(`${KM.problems.length} 题，${bad} 题有问题`);
process.exit(bad ? 1 : 0);
