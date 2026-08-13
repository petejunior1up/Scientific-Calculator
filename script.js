/* ==========================================================================
   1. COMPLEX NUMBER ENGINE
   ========================================================================== */

class Complex {
  constructor(re = 0, im = 0) {
    this.re = re;
    this.im = im;
  }
  add(o) { return new Complex(this.re + o.re, this.im + o.im); }
  sub(o) { return new Complex(this.re - o.re, this.im - o.im); }
  mul(o) {
    return new Complex(
      this.re * o.re - this.im * o.im,
      this.re * o.im + this.im * o.re
    );
  }
  div(o) {
    const d = o.re * o.re + o.im * o.im;
    if (d === 0) throw new Error('Division by zero');
    return new Complex(
      (this.re * o.re + this.im * o.im) / d,
      (this.im * o.re - this.re * o.im) / d
    );
  }
  pow(n) {
    if (!Number.isInteger(n)) throw new Error('Only whole-number exponents are supported');
    let result = new Complex(1, 0);
    const base = this;
    const exp = Math.abs(n);
    for (let i = 0; i < exp; i++) result = result.mul(base);
    return n < 0 ? new Complex(1, 0).div(result) : result;
  }
  neg() { return new Complex(-this.re, -this.im); }
  conj() { return new Complex(this.re, -this.im); }
  abs() { return Math.hypot(this.re, this.im); }
  arg() { return Math.atan2(this.im, this.re); }
}

/** Format a number, trimming float noise and trailing zeros. */
function fmt(n, precision = 4) {
  const rounded = Number(n.toFixed(precision));
  return rounded.toString();
}

/** Render a Complex as a human-readable a+bi string. */
function formatComplex(c, precision = 4) {
  const re = fmt(c.re, precision);
  const imAbs = fmt(Math.abs(c.im), precision);
  if (c.im === 0) return re;
  if (c.re === 0) return `${c.im < 0 ? '-' : ''}${imAbs}i`;
  return `${re} ${c.im < 0 ? '-' : '+'} ${imAbs}i`;
}

/** Render a Complex in polar form r∠θ (θ in degrees). */
function formatPolar(c, precision = 3) {
  const r = fmt(c.abs(), precision);
  const theta = fmt((c.arg() * 180) / Math.PI, precision);
  return `${r} ∠ ${theta}°`;
}

/* ==========================================================================
   2. TOKENIZER
   ========================================================================== */

function tokenize(input) {
  const tokens = [];
  const s = input.replace(/\s+/g, '');
  let i = 0;

  while (i < s.length) {
    const c = s[i];

    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const numStr = s.slice(i, j);
      let isImag = false;
      if (s[j] === 'i') { isImag = true; j++; }
      tokens.push({ type: isImag ? 'IMAG' : 'NUM', value: parseFloat(numStr) });
      i = j;
      continue;
    }

    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const word = s.slice(i, j);
      if (word === 'i') tokens.push({ type: 'IMAG', value: 1 });
      else if (word === 'pi') tokens.push({ type: 'NUM', value: Math.PI });
      else if (word === 'e') tokens.push({ type: 'NUM', value: Math.E });
      else tokens.push({ type: 'FUNC', value: word });
      i = j;
      continue;
    }

    if ('+-*/^()'.includes(c)) {
      tokens.push({ type: c, value: c });
      i++;
      continue;
    }

    throw new Error(`Unexpected character "${c}"`);
  }

  return tokens;
}

/* ==========================================================================
   3. RECURSIVE-DESCENT PARSER
   Grammar:
     expr   := term (('+'|'-') term)*
     term   := factor (('*'|'/') factor)*
     factor := unary ('^' unary)*
     unary  := ('-'|'+') unary | primary
     primary:= NUM | IMAG | '(' expr ')' | FUNC '(' expr ')'
   ========================================================================== */

function parseComplex(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const advance = () => tokens[pos++];

  function expr() {
    let left = term();
    while (peek() && (peek().type === '+' || peek().type === '-')) {
      const op = advance().type;
      const right = term();
      left = op === '+' ? left.add(right) : left.sub(right);
    }
    return left;
  }

  function term() {
    let left = factor();
    while (peek() && (peek().type === '*' || peek().type === '/')) {
      const op = advance().type;
      const right = factor();
      left = op === '*' ? left.mul(right) : left.div(right);
    }
    return left;
  }

  function factor() {
    let base = unary();
    while (peek() && peek().type === '^') {
      advance();
      const exp = unary();
      if (exp.im !== 0) throw new Error('Complex exponents are not supported');
      base = base.pow(exp.re);
    }
    return base;
  }

  function unary() {
    if (peek() && peek().type === '-') { advance(); return unary().neg(); }
    if (peek() && peek().type === '+') { advance(); return unary(); }
    return primary();
  }

  function primary() {
    const t = peek();
    if (!t) throw new Error('Unexpected end of expression');

    if (t.type === 'NUM') { advance(); return new Complex(t.value, 0); }
    if (t.type === 'IMAG') { advance(); return new Complex(0, t.value); }

    if (t.type === '(') {
      advance();
      const val = expr();
      if (!peek() || peek().type !== ')') throw new Error('Missing closing parenthesis');
      advance();
      return val;
    }

    if (t.type === 'FUNC') {
      advance();
      if (!peek() || peek().type !== '(') throw new Error(`Expected "(" after ${t.value}`);
      advance();
      const arg = expr();
      if (!peek() || peek().type !== ')') throw new Error('Missing closing parenthesis');
      advance();
      switch (t.value) {
        case 'conj': return arg.conj();
        case 'abs':  return new Complex(arg.abs(), 0);
        case 'arg':  return new Complex((arg.arg() * 180) / Math.PI, 0);
        case 're':   return new Complex(arg.re, 0);
        case 'im':   return new Complex(arg.im, 0);
        default: throw new Error(`Unknown function "${t.value}"`);
      }
    }

    throw new Error(`Unexpected token "${t.value}"`);
  }

  const result = expr();
  if (pos !== tokens.length) throw new Error('Unexpected trailing input');
  return result;
}

function evaluateExpression(input) {
  const tokens = tokenize(input);
  if (tokens.length === 0) throw new Error('Nothing to evaluate');
  return parseComplex(tokens);
}

/* ==========================================================================
   4. UI STATE + KEYPAD WIRING
   ========================================================================== */

const exprEl = document.getElementById('expr');
const resultEl = document.getElementById('result');
const keypad = document.getElementById('keypad');
const historyEl = document.getElementById('history');
const clearHistoryBtn = document.getElementById('clearHistory');

let expression = '';
let history = []; // { expr, complex }

function renderExpr() {
  exprEl.textContent = expression || '0';
}

function insert(value) {
  expression += value;
  renderExpr();
}

function backspace() {
  expression = expression.slice(0, -1);
  renderExpr();
}

function clearAll() {
  expression = '';
  renderExpr();
  resultEl.innerHTML = '';
}

function showError(message) {
  resultEl.innerHTML = `<span class="error">${message}</span>`;
}

function evaluate() {
  if (!expression.trim()) return;
  try {
    const value = evaluateExpression(expression);
    resultEl.innerHTML = `${formatComplex(value)}<span class="polar">${formatPolar(value)}</span>`;
    history.unshift({ expr: expression, complex: value });
    history = history.slice(0, 12);
    renderHistory();
    plotResult(value, true);
  } catch (err) {
    showError(err.message);
  }
}

function renderHistory() {
  historyEl.innerHTML = '';
  history.forEach((h) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="h-expr">${h.expr}</span><span class="h-val">${formatComplex(h.complex, 3)}</span>`;
    historyEl.appendChild(li);
  });
}

keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('button.key');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'insert' || action === 'func') insert(btn.dataset.value);
  else if (action === 'back') backspace();
  else if (action === 'clear') clearAll();
  else if (action === 'equals') evaluate();
});

window.addEventListener('keydown', (e) => {
  if (/^[0-9.+\-*/^()i]$/.test(e.key)) { insert(e.key); return; }
  if (e.key === 'Enter' || e.key === '=') { evaluate(); return; }
  if (e.key === 'Backspace') { backspace(); return; }
  if (e.key === 'Escape') { clearAll(); return; }
});

clearHistoryBtn.addEventListener('click', () => {
  history = [];
  renderHistory();
  redrawPlane(null);
});

/* ==========================================================================
   5. ARGAND PLANE (SVG)
   ========================================================================== */

const NS = 'http://www.w3.org/2000/svg';
const plane = document.getElementById('plane');
const SIZE = 320;

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function currentRange() {
  const mags = history.map((h) => Math.max(Math.abs(h.complex.re), Math.abs(h.complex.im)));
  const maxMag = mags.length ? Math.max(...mags) : 0;
  return Math.max(4, Math.ceil(maxMag * 1.25));
}

function toXY(re, im, range) {
  const scale = (SIZE / 2 - 24) / range;
  return { x: SIZE / 2 + re * scale, y: SIZE / 2 - im * scale };
}

function redrawPlane(justPlotted) {
  plane.innerHTML = '';
  const range = currentRange();

  // grid lines
  for (let g = -range; g <= range; g++) {
    if (g === 0) continue;
    const p1 = toXY(g, -range, range);
    const p2 = toXY(g, range, range);
    plane.appendChild(svgEl('line', {
      x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
      stroke: 'rgba(140,160,220,0.08)', 'stroke-width': 1
    }));
    const q1 = toXY(-range, g, range);
    const q2 = toXY(range, g, range);
    plane.appendChild(svgEl('line', {
      x1: q1.x, y1: q1.y, x2: q2.x, y2: q2.y,
      stroke: 'rgba(140,160,220,0.08)', 'stroke-width': 1
    }));
  }

  // axes
  const xAxis1 = toXY(-range, 0, range), xAxis2 = toXY(range, 0, range);
  const yAxis1 = toXY(0, -range, range), yAxis2 = toXY(0, range, range);
  plane.appendChild(svgEl('line', { x1: xAxis1.x, y1: xAxis1.y, x2: xAxis2.x, y2: xAxis2.y, stroke: 'rgba(140,160,220,0.35)', 'stroke-width': 1 }));
  plane.appendChild(svgEl('line', { x1: yAxis1.x, y1: yAxis1.y, x2: yAxis2.x, y2: yAxis2.y, stroke: 'rgba(140,160,220,0.35)', 'stroke-width': 1 }));

  // axis labels
  const reLabel = svgEl('text', { x: SIZE - 14, y: SIZE / 2 - 8, fill: '#4deaff', 'font-size': 11, 'font-family': 'JetBrains Mono, monospace', 'text-anchor': 'end' });
  reLabel.textContent = 'Re';
  plane.appendChild(reLabel);
  const imLabel = svgEl('text', { x: SIZE / 2 + 8, y: 16, fill: '#9b6bff', 'font-size': 11, 'font-family': 'JetBrains Mono, monospace' });
  imLabel.textContent = 'Im';
  plane.appendChild(imLabel);

  // faded trail of past points (oldest → dimmest), skip index 0 (that's "current")
  history.slice(1).forEach((h, idx) => {
    const p = toXY(h.complex.re, h.complex.im, range);
    const opacity = Math.max(0.08, 0.35 - idx * 0.03);
    plane.appendChild(svgEl('circle', { cx: p.x, cy: p.y, r: 3, fill: '#4deaff', opacity }));
  });

  // current point + vector, animated
  if (justPlotted) {
    const p = toXY(justPlotted.re, justPlotted.im, range);
    const origin = toXY(0, 0, range);

    const vector = svgEl('line', {
      x1: origin.x, y1: origin.y, x2: p.x, y2: p.y,
      stroke: 'url(#vectorGradient)', 'stroke-width': 2, 'stroke-linecap': 'round'
    });
    plane.insertBefore(vector, plane.firstChild);

    const defs = svgEl('defs', {});
    const gradient = svgEl('linearGradient', { id: 'vectorGradient', x1: origin.x, y1: origin.y, x2: p.x, y2: p.y, gradientUnits: 'userSpaceOnUse' });
    const stop1 = svgEl('stop', { offset: '0%', 'stop-color': '#9b6bff' });
    const stop2 = svgEl('stop', { offset: '100%', 'stop-color': '#4deaff' });
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
    plane.appendChild(defs);

    const dot = svgEl('circle', { cx: p.x, cy: p.y, r: 5, fill: '#4deaff' });
    dot.style.filter = 'drop-shadow(0 0 6px #4deaff)';
    dot.style.transformOrigin = `${p.x}px ${p.y}px`;
    dot.style.animation = 'argand-pop 0.35s ease';
    plane.appendChild(dot);
  }
}

// keyframes for the "pop" animation, injected once
const styleTag = document.createElement('style');
styleTag.textContent = `
@keyframes argand-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.4); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}`;
document.head.appendChild(styleTag);

function plotResult(complex) {
  redrawPlane(complex);
}

/* initial empty plane */
redrawPlane(null);
