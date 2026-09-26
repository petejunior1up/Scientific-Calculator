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
  /** Exact integer power via repeated multiplication (used by the ^ operator). */
  pow(n) {
    if (!Number.isInteger(n)) return this.powReal(n);
    let result = new Complex(1, 0);
    const base = this;
    const exp = Math.abs(n);
    for (let i = 0; i < exp; i++) result = result.mul(base);
    return n < 0 ? new Complex(1, 0).div(result) : result;
  }
  /** Principal value z^p for any real p, via polar form. Powers roots too. */
  powReal(p) {
    if (this.re === 0 && this.im === 0) return new Complex(0, 0);
    const r = Math.pow(this.abs(), p);
    const theta = this.arg() * p;
    return new Complex(r * Math.cos(theta), r * Math.sin(theta));
  }
  neg() { return new Complex(this.re === 0 ? 0 : -this.re, this.im === 0 ? 0 : -this.im); }
  conj() { return new Complex(this.re, -this.im); }
  abs() { return Math.hypot(this.re, this.im); }
  arg() { return Math.atan2(this.im, this.re); }
  recip() { return new Complex(1, 0).div(this); }
  sign() {
    const m = this.abs();
    return m === 0 ? new Complex(0, 0) : new Complex(this.re / m, this.im / m);
  }

  /* ---- exponential / logarithmic ---- */
  exp() {
    const r = Math.exp(this.re);
    return new Complex(r * Math.cos(this.im), r * Math.sin(this.im));
  }
  ln() { return new Complex(Math.log(this.abs()), this.arg()); }
  log10() { return this.ln().scale(1 / Math.LN10); }
  log2() { return this.ln().scale(1 / Math.LN2); }
  sqrt() { return this.powReal(0.5); }
  cbrt() { return this.powReal(1 / 3); }
  scale(k) { return new Complex(this.re * k, this.im * k); }

  /* ---- trigonometric ---- */
  sin() { return new Complex(Math.sin(this.re) * Math.cosh(this.im), Math.cos(this.re) * Math.sinh(this.im)); }
  cos() { return new Complex(Math.cos(this.re) * Math.cosh(this.im), -Math.sin(this.re) * Math.sinh(this.im)); }
  tan() { return this.sin().div(this.cos()); }
  cot() { return this.cos().div(this.sin()); }
  sec() { return new Complex(1, 0).div(this.cos()); }
  csc() { return new Complex(1, 0).div(this.sin()); }

  /* ---- inverse trigonometric (principal values) ---- */
  asin() {
    const iZ = new Complex(-this.im, this.re);
    const sq = new Complex(1, 0).sub(this.mul(this)).sqrt();
    const ln = iZ.add(sq).ln();
    return new Complex(ln.im, -ln.re); // multiply by -i
  }
  acos() { return new Complex(Math.PI / 2, 0).sub(this.asin()); }
  atan() {
    const iZ = new Complex(-this.im, this.re);
    const ratio = new Complex(1, 0).sub(iZ).div(new Complex(1, 0).add(iZ));
    const ln = ratio.ln();
    return new Complex(-ln.im / 2, ln.re / 2); // multiply by i/2
  }

  /* ---- hyperbolic ---- */
  sinh() { return new Complex(Math.sinh(this.re) * Math.cos(this.im), Math.cosh(this.re) * Math.sin(this.im)); }
  cosh() { return new Complex(Math.cosh(this.re) * Math.cos(this.im), Math.sinh(this.re) * Math.sin(this.im)); }
  tanh() { return this.sinh().div(this.cosh()); }
  coth() { return this.cosh().div(this.sinh()); }
  sech() { return new Complex(1, 0).div(this.cosh()); }
  csch() { return new Complex(1, 0).div(this.sinh()); }

  /* ---- inverse hyperbolic ---- */
  asinh() { return this.add(this.mul(this).add(new Complex(1, 0)).sqrt()).ln(); }
  acosh() { return this.add(this.mul(this).sub(new Complex(1, 0)).sqrt()).ln(); }
  atanh() {
    const ln = new Complex(1, 0).add(this).div(new Complex(1, 0).sub(this)).ln();
    return ln.scale(0.5);
  }

  /* ---- rounding (applied component-wise) ---- */
  floorC() { return new Complex(Math.floor(this.re), Math.floor(this.im)); }
  ceilC() { return new Complex(Math.ceil(this.re), Math.ceil(this.im)); }
  roundC() { return new Complex(Math.round(this.re), Math.round(this.im)); }
  truncC() { return new Complex(Math.trunc(this.re), Math.trunc(this.im)); }
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
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9]/.test(s[j])) j++;
      const word = s.slice(i, j);
      if (word === 'i') tokens.push({ type: 'IMAG', value: 1 });
      else if (word === 'pi') tokens.push({ type: 'NUM', value: Math.PI });
      else if (word === 'tau') tokens.push({ type: 'NUM', value: Math.PI * 2 });
      else if (word === 'phi') tokens.push({ type: 'NUM', value: (1 + Math.sqrt(5)) / 2 });
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

function factorialComplex(z) {
  if (z.im !== 0) throw new Error('Factorial requires a real number');
  if (!Number.isInteger(z.re) || z.re < 0) throw new Error('Factorial requires a non-negative integer');
  if (z.re > 170) throw new Error('Factorial is too large');
  let out = 1;
  for (let n = 2; n <= z.re; n++) out *= n;
  return new Complex(out, 0);
}

/* ==========================================================================
   2b. FUNCTION TABLE
   Each entry maps a name usable in expressions to a Complex -> Complex (or
   Complex -> real, wrapped back into a Complex) transform. Grouped by
   category — the UI reads this same table to build the function panel.
   ========================================================================== */

const FUNCTION_GROUPS = [
  {
    label: 'basic',
    fns: {
      conj:  { fn: (z) => z.conj(),                      desc: 'conjugate' },
      abs:   { fn: (z) => new Complex(z.abs(), 0),        desc: 'modulus |z|' },
      arg:   { fn: (z) => new Complex((z.arg() * 180) / Math.PI, 0), desc: 'angle (deg)' },
      re:    { fn: (z) => new Complex(z.re, 0),           desc: 'real part' },
      im:    { fn: (z) => new Complex(z.im, 0),           desc: 'imaginary part' },
      recip: { fn: (z) => z.recip(),                      desc: '1/z' },
      sign:  { fn: (z) => z.sign(),                       desc: 'unit direction' },
      sq:    { fn: (z) => z.mul(z),                       desc: 'z squared' },
      cube:  { fn: (z) => z.mul(z).mul(z),                desc: 'z cubed' },
      fourth:{ fn: (z) => z.pow(4),                       desc: 'z to the fourth' },
      norm:  { fn: (z) => new Complex(z.re*z.re + z.im*z.im, 0), desc: '|z| squared' },
      pct:   { fn: (z) => z.scale(0.01),                  desc: 'percentage / 100' },
      fact:  { fn: (z) => factorialComplex(z),            desc: 'factorial n!' },
    },
  },
  {
    label: 'exponential / log',
    fns: {
      exp:   { fn: (z) => z.exp(),   desc: 'e^z' },
      ln:    { fn: (z) => z.ln(),    desc: 'natural log' },
      log10: { fn: (z) => z.log10(), desc: 'log base 10' },
      log2:  { fn: (z) => z.log2(),  desc: 'log base 2' },
      sqrt:   { fn: (z) => z.sqrt(),                         desc: 'square root' },
      cbrt:   { fn: (z) => z.cbrt(),                         desc: 'cube root' },
      root4:  { fn: (z) => z.powReal(0.25),                  desc: 'principal fourth root' },
      expm1:  { fn: (z) => z.exp().sub(new Complex(1, 0)),   desc: 'e^z - 1' },
      log1p:  { fn: (z) => new Complex(1, 0).add(z).ln(),    desc: 'ln(1 + z)' },
    },
  },
  {
    label: 'trigonometric',
    fns: {
      sin: { fn: (z) => z.sin(), desc: 'sine' },
      cos: { fn: (z) => z.cos(), desc: 'cosine' },
      tan: { fn: (z) => z.tan(), desc: 'tangent' },
      cot: { fn: (z) => z.cot(), desc: 'cotangent' },
      sec: { fn: (z) => z.sec(), desc: 'secant' },
      csc: { fn: (z) => z.csc(), desc: 'cosecant' },
    },
  },
  {
    label: 'inverse trig',
    fns: {
      asin: { fn: (z) => z.asin(), desc: 'arcsine' },
      acos: { fn: (z) => z.acos(), desc: 'arccosine' },
      atan: { fn: (z) => z.atan(), desc: 'arctangent' },
      acot: { fn: (z) => z.recip().atan(), desc: 'inverse cotangent' },
      asec: { fn: (z) => z.recip().acos(), desc: 'inverse secant' },
      acsc: { fn: (z) => z.recip().asin(), desc: 'inverse cosecant' },
    },
  },
  {
    label: 'hyperbolic',
    fns: {
      sinh: { fn: (z) => z.sinh(), desc: 'hyperbolic sine' },
      cosh: { fn: (z) => z.cosh(), desc: 'hyperbolic cosine' },
      tanh: { fn: (z) => z.tanh(), desc: 'hyperbolic tangent' },
      coth: { fn: (z) => z.coth(), desc: 'hyperbolic cotangent' },
      sech: { fn: (z) => z.sech(), desc: 'hyperbolic secant' },
      csch: { fn: (z) => z.csch(), desc: 'hyperbolic cosecant' },
    },
  },
  {
    label: 'inverse hyperbolic',
    fns: {
      asinh: { fn: (z) => z.asinh(), desc: 'inverse sinh' },
      acosh: { fn: (z) => z.acosh(), desc: 'inverse cosh' },
      atanh: { fn: (z) => z.atanh(), desc: 'inverse tanh' },
      acoth: { fn: (z) => z.recip().atanh(), desc: 'inverse coth' },
      asech: { fn: (z) => z.recip().acosh(), desc: 'inverse sech' },
      acsch: { fn: (z) => z.recip().asinh(), desc: 'inverse csch' },
    },
  },
  {
    label: 'conversions / special',
    fns: {
      deg:   { fn: (z) => z.scale(180 / Math.PI), desc: 'radians to degrees' },
      rad:   { fn: (z) => z.scale(Math.PI / 180), desc: 'degrees to radians' },
      sinc:  { fn: (z) => (z.re === 0 && z.im === 0) ? new Complex(1, 0) : z.sin().div(z), desc: 'sin(z) / z' },
      cis:   { fn: (z) => new Complex(0, 1).mul(z).exp(), desc: 'cos(z) + i sin(z)' },
    },
  },
  {
    label: 'rounding',
    fns: {
      floor: { fn: (z) => z.floorC(), desc: 'round down' },
      ceil:  { fn: (z) => z.ceilC(),  desc: 'round up' },
      round: { fn: (z) => z.roundC(), desc: 'round nearest' },
      trunc: { fn: (z) => z.truncC(), desc: 'drop decimals' },
    },
  },
  {
    label: 'aliases',
    fns: {
      mag:   { fn: (z) => new Complex(z.abs(), 0), desc: 'alias of abs' },
      phase: { fn: (z) => new Complex((z.arg() * 180) / Math.PI, 0), desc: 'alias of arg' },
      log:   { fn: (z) => z.ln(),  desc: 'alias of ln' },
      inv:   { fn: (z) => z.recip(), desc: 'alias of recip' },
    },
  },
];

/** Flat name -> transform lookup, built from the groups above. */
const FUNCTIONS = {};
FUNCTION_GROUPS.forEach((group) => {
  Object.entries(group.fns).forEach(([name, { fn }]) => { FUNCTIONS[name] = fn; });
});

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
      const fn = FUNCTIONS[t.value];
      if (!fn) throw new Error(`Unknown function "${t.value}"`);
      return fn(arg);
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
const quickFunctions = document.getElementById('quickFunctions');
const fnPanel = document.getElementById('fnPanel');
const fnToggleBtn = document.querySelector('[data-action="toggleFn"]');

let expression = '';

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
  } catch (err) {
    showError(err.message);
  }
}

quickFunctions.addEventListener('click', (e) => {
  const btn = e.target.closest('button.quick-key');
  if (!btn) return;
  insert(btn.dataset.value);
});

keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('button.key');
  if (!btn) return;
  const action = btn.dataset.action;
  if (action === 'insert' || action === 'func') insert(btn.dataset.value);
  else if (action === 'back') backspace();
  else if (action === 'clear') clearAll();
  else if (action === 'equals') evaluate();
  else if (action === 'toggleFn') toggleFnPanel();
});

/* ---- function panel: built from FUNCTION_GROUPS, one chip per function ---- */

function buildFnPanel() {
  fnPanel.innerHTML = '';
  FUNCTION_GROUPS.forEach((group) => {
    const wrap = document.createElement('div');
    wrap.className = 'fn-group';

    const label = document.createElement('p');
    label.className = 'fn-group-label';
    label.textContent = group.label;
    wrap.appendChild(label);

    const chips = document.createElement('div');
    chips.className = 'fn-chips';
    Object.entries(group.fns).forEach(([name, { desc }]) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'fn-chip';
      chip.title = desc;
      chip.textContent = name;
      chip.addEventListener('click', () => insert(`${name}(`));
      chips.appendChild(chip);
    });
    wrap.appendChild(chips);
    fnPanel.appendChild(wrap);
  });
}

function toggleFnPanel() {
  const isHidden = fnPanel.hasAttribute('hidden');
  if (isHidden) fnPanel.removeAttribute('hidden');
  else fnPanel.setAttribute('hidden', '');
  fnToggleBtn.setAttribute('aria-expanded', String(isHidden));
}

buildFnPanel();

window.addEventListener('keydown', (e) => {
  if (/^[0-9.+\-*/^()i]$/.test(e.key)) { insert(e.key); return; }
  if (e.key === 'Enter' || e.key === '=') { evaluate(); return; }
  if (e.key === 'Backspace') { backspace(); return; }
  if (e.key === 'Escape') { clearAll(); return; }
});
