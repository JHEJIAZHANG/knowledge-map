// 真终端机自我检查：在服务器的真容器里，逐题跑参考解答，再用 judge 检查
// 用法：KM_TOKEN=token node tools/real-check.js wss://服务器网址/ws [题目 id …]
// token 在服务器上用 python3 ~/km-term/km-bridge.py token 印出来。
// 每题会先把容器重置，跑完再删掉，不会留下东西。
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');
const url = process.argv[2];
const only = process.argv.slice(3);
if (!url || !process.env.KM_TOKEN) { console.log('用法：KM_TOKEN=token node tools/real-check.js wss://服务器网址/ws [题目 id …]'); process.exit(2); }
const KM = { problems: [], problem(p) { this.problems.push(p); } };
KM.ui = { h: () => ({}), icon: () => '', memory: { get: (k, d) => d, set() {} } };
const ctx = { window: { KnowledgeMap: KM }, KnowledgeMap: KM, console, WebSocket, setTimeout, clearTimeout, btoa, location: {} };
ctx.window.window = ctx.window;
vm.createContext(ctx);
['js/py.js', 'js/shell.js', 'content/practice/problems.js', 'js/real.js'].forEach((f) => vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f }));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const conn = new KM.real.Conn(url.replace(/^https/, 'wss'));
  await conn.open();
  const a = await conn.ask({ t: 'auth', token: process.env.KM_TOKEN });
  if (!a.ok) throw new Error(a.err);
  let screen = '';
  let last = Date.now();
  conn.onOut = (d) => { screen += d; last = Date.now(); };
  const settle = async () => { const t0 = Date.now(); await sleep(300); while (Date.now() - last < 600 && Date.now() - t0 < 15000) await sleep(100); };
  let bad = 0;
  for (const [i, p] of KM.problems.entries()) {
    if (only.length && !only.includes(p.id)) continue;
    const box = KM.real.boxOf(p);
    let r = await conn.ask({ t: 'box', box });
    if (!r.fresh) { await conn.ask({ t: 'reset' }); r = await conn.ask({ t: 'box', box }); }
    const s = await conn.exec(['bash', '-s'], { user: 'root', cwd: '/', stdin: KM.real.setupScript(p) });
    if (s.code !== 0) { console.log(`✗ ${i + 1}. ${p.id}：准备题目失败 ${s.err}`); bad += 1; continue; }
    const atStart = (await KM.real.judge(conn, p)).results.every((x) => x.ok);
    const sh = new KM.Shell(p.setup);
    const cwd = p.setup && p.setup.cwd ? KM.Shell.norm(sh.root, p.setup.cwd) : sh.root;
    screen = '';
    conn.send({ t: 'shell', cwd, cols: 120, rows: 40 });
    await settle();
    for (const step of p.answer) {
      if (typeof step === 'string') { conn.send({ t: 'in', d: `${step}\r` }); await settle(); } else {
        await conn.exec(['bash', '-c', 'cat > "$1"', '_', KM.Shell.norm(cwd, step.edit)], { stdin: step.text });
      }
    }
    const { results } = await KM.real.judge(conn, p);
    const fails = results.filter((x) => !x.ok);
    const ok = !fails.length && !atStart;
    if (!ok) bad += 1;
    console.log(`${ok ? '✓' : '✗'} ${i + 1}. ${p.id}`);
    fails.forEach((f) => console.log(`    没通过：${f.say} ${f.got || ''}`));
    if (atStart) console.log('    什么都不做就通过了');
    if (!ok || process.env.SHOW) console.log(screen.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').replace(/\r/g, '').replace(/^/gm, '    | '));
    await conn.ask({ t: 'reset' });
  }
  conn.close();
  console.log(`${bad} 题有问题`);
  process.exit(bad ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
