// 迷你 Python：只够重现交互模式里的算式、变量、print、input、int
//
// 动画演示（js/run.js）用它算出每一行运行后「名字表」变成什么样子，
// 再和笔记里的实际输出对照，对不上会在主控台警告。
(function () {
  const KM = window.KnowledgeMap;

  let serial = 0;
  // 每个值都有自己的编号：两个名字挂在同一个值上，编号就一样
  const val = (t, v) => ({ t, v, id: ++serial });
  const NONE = { t: 'NoneType', v: null, id: 0 };

  class PyError extends Error {
    constructor(kind, msg) { super(msg); this.kind = kind; }
  }

  // print 印出来的样子：文本不带引号
  function show(x) {
    if (x.t === 'str') return x.v;
    if (x.t === 'float') return Number.isInteger(x.v) ? `${x.v}.0` : String(x.v);
    if (x.t === 'NoneType') return 'None';
    if (x.t === 'type') return `<class '${x.v}'>`;
    return String(x.v);
  }
  // 交互模式直接显示的样子：文本带引号
  function repr(x) {
    if (x.t !== 'str') return show(x);
    return x.v.includes("'") && !x.v.includes('"') ? `"${x.v}"` : `'${x.v.replace(/'/g, "\\'")}'`;
  }

  function tokenize(src) {
    const re = /\s*("[^"]*"|'[^']*'|\d+\.\d*|\d+|[A-Za-z_]\w*|\/\/|\*\*|[+\-*/%(),])/y;
    const toks = [];
    let m;
    while (re.lastIndex < src.length && (m = re.exec(src))) toks.push(m[1]);
    if (src.slice(re.lastIndex).trim()) throw new PyError('SyntaxError', 'invalid syntax');
    return toks;
  }

  function arith(op, a, b) {
    const num = (x) => x.t === 'int' || x.t === 'float';
    if (num(a) && num(b)) {
      const f = a.t === 'float' || b.t === 'float';
      if ((op === '/' || op === '//' || op === '%') && b.v === 0) throw new PyError('ZeroDivisionError', 'division by zero');
      if (op === '/') return val('float', a.v / b.v);
      const v = { '+': a.v + b.v, '-': a.v - b.v, '*': a.v * b.v, '//': Math.floor(a.v / b.v), '%': ((a.v % b.v) + b.v) % b.v, '**': a.v ** b.v }[op];
      return val(f ? 'float' : 'int', v);
    }
    if (op === '+' && a.t === 'str' && b.t === 'str') return val('str', a.v + b.v);
    if (op === '*' && a.t === 'str' && b.t === 'int') return val('str', a.v.repeat(Math.max(0, b.v)));
    if (op === '*' && a.t === 'int' && b.t === 'str') return val('str', b.v.repeat(Math.max(0, a.v)));
    if (op === '+' && a.t === 'str') throw new PyError('TypeError', `can only concatenate str (not "${b.t}") to str`);
    throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${a.t}' and '${b.t}'`);
  }

  function call(name, args, ctx) {
    const [x] = args;
    switch (name) {
      case 'print':
        ctx.printed.push(args.map(show).join(' '));
        return NONE;
      case 'input': {
        const q = x ? show(x) : '';
        const a = ctx.answer(q);
        ctx.asked.push([q, a]);
        return val('str', a);
      }
      case 'int':
        if (x.t === 'int') return x;
        if (x.t === 'float') return val('int', Math.trunc(x.v));
        if (x.t === 'str' && /^\s*[+-]?\d+\s*$/.test(x.v)) return val('int', parseInt(x.v, 10));
        throw new PyError('ValueError', `invalid literal for int() with base 10: ${repr(x)}`);
      case 'float':
        if (x.t === 'str' && !/^\s*[+-]?(\d+\.?\d*|\.\d+)\s*$/.test(x.v)) throw new PyError('ValueError', `could not convert string to float: ${repr(x)}`);
        return val('float', Number(x.v));
      case 'str': return val('str', show(x));
      case 'type': return val('type', x.t);
      case 'len': return val('int', Array.from(String(x.v)).length);
      default: throw new PyError('NameError', `name '${name}' is not defined`);
    }
  }

  function evaluate(src, ctx) {
    const toks = tokenize(src);
    let i = 0;
    const peek = () => toks[i];
    const eat = (t) => { if (toks[i] !== t) throw new PyError('SyntaxError', 'invalid syntax'); i += 1; };
    function atom() {
      const t = toks[i++];
      if (t === undefined) throw new PyError('SyntaxError', 'invalid syntax');
      if (t === '(') { const a = expr(); eat(')'); return a; }
      if (/^["']/.test(t)) return val('str', t.slice(1, -1));
      if (/^\d+\.\d*$/.test(t)) return val('float', parseFloat(t));
      if (/^\d+$/.test(t)) return val('int', parseInt(t, 10));
      if (/^[A-Za-z_]/.test(t)) {
        if (peek() === '(') {
          i += 1;
          const args = [];
          while (peek() !== ')') {
            args.push(expr());
            if (peek() === ',') i += 1; else break;
          }
          eat(')');
          return call(t, args, ctx);
        }
        if (t === 'None') return NONE;
        if (!(t in ctx.vars)) throw new PyError('NameError', `name '${t}' is not defined`);
        ctx.reads.add(t);
        return ctx.vars[t];
      }
      throw new PyError('SyntaxError', 'invalid syntax');
    }
    function power() { const a = atom(); if (peek() === '**') { i += 1; return arith('**', a, unary()); } return a; }
    function unary() { if (peek() === '-') { i += 1; return arith('-', val('int', 0), unary()); } return power(); }
    function term() {
      let a = unary();
      while (['*', '/', '//', '%'].includes(peek())) { const op = toks[i++]; a = arith(op, a, unary()); }
      return a;
    }
    function expr() {
      let a = term();
      while (peek() === '+' || peek() === '-') { const op = toks[i++]; a = arith(op, a, term()); }
      return a;
    }
    const a = expr();
    if (i < toks.length) throw new PyError('SyntaxError', 'invalid syntax');
    return a;
  }

  // 运行一行。answer(问题)：input() 要拿到的回答
  function exec(line, vars, answer) {
    const ctx = { vars, reads: new Set(), printed: [], asked: [], answer: answer || (() => '') };
    const m = line.match(/^\s*([A-Za-z_]\w*)\s*=(?!=)\s*(.+)$/);
    const done = (r) => ({ reads: ctx.reads, printed: ctx.printed, asked: ctx.asked, vars, ...r });
    try {
      if (m) {
        const v = evaluate(m[2], ctx);
        return done({ kind: 'assign', name: m[1], value: v, alias: /^\s*[A-Za-z_]\w*\s*$/.test(m[2]) ? m[2].trim() : '', vars: { ...vars, [m[1]]: v } });
      }
      const v = evaluate(line, ctx);
      return done({ kind: 'expr', value: v, echo: v.t === 'NoneType' ? '' : repr(v) });
    } catch (e) {
      if (!(e instanceof PyError)) throw e;
      return done({ kind: 'error', error: `${e.kind}: ${e.message}` });
    }
  }

  KM.py = { exec, repr, show };
})();
