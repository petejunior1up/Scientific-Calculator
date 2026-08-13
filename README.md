# Scientific-Calculator
A scientific calculator with most functions.
# Argand — a complex number calculator

A dependency-free, futuristic complex-number calculator. Type an expression like
`(2-i)*(1+3i)` and it evaluates it, showing the result in both `a + bi` and polar
(`r ∠ θ`) form, and plots it live on an Argand plane.

## Files

| File | What it does |
|---|---|
| `index.html` | Page structure — the display, keypad, and plane panel |
| `style.css` | The futuristic glass/HUD visual styling |
| `script.js` | The complex-number math engine, expression parser, and UI wiring |

No build tools, no npm install, no frameworks — just open `index.html` in a browser.

## How the math works

`script.js` has three parts:

1. **`Complex` class** — a complex number `{re, im}` with `add`, `sub`, `mul`,
   `div`, `pow` (integer exponents), `conj`, `abs` (modulus), and `arg` (angle).
2. **Tokenizer** — turns a string like `"3+4i"` into tokens: `NUM(3)`, `+`, `IMAG(4)`.
3. **Parser** — a recursive-descent parser that respects standard order of
   operations (`^` before `*`/`/` before `+`/`-`) and understands parentheses
   and functions: `conj()`, `abs()`, `arg()`, `re()`, `im()`, plus the constants
   `pi` and `e`.

This is the same technique real calculator/interpreter engines use, just scoped
down to complex arithmetic — worth reading through `script.js` top to bottom if
you want to understand it, since it's fully commented.

## Step-by-step: publish it on GitHub

1. **Create a new repository** on GitHub — click the `+` in the top right →
   *New repository*. Name it something like `argand-calculator`, keep it public,
   and skip adding a README (you already have one).
2. **Add these three files** to the repo. Easiest way: on the repo's page, click
   *Add file → Upload files*, then drag in `index.html`, `style.css`, and
   `script.js` (and this `README.md`). Commit directly to `main`.
3. **Turn on GitHub Pages**: go to *Settings → Pages*. Under "Build and
   deployment", set **Source** to `Deploy from a branch`, **Branch** to `main`
   and folder to `/ (root)`, then **Save**.
4. **Wait ~1 minute**, then refresh that same Pages settings page — it'll show
   a live URL like `https://your-username.github.io/argand-calculator/`.
   That's your calculator, live, with nothing else to configure.

From here on, any time you edit a file and commit it, the live site updates
automatically within a minute or two.

## Ideas for extending it

- **Roots** — add an `nthroot(z, n)` function using De Moivre's theorem.
- **History persistence** — save `history` to `localStorage` so past
  calculations survive a page reload.
- **Keyboard shortcuts panel** — a small overlay listing what each key does.
- **Unit tests** — the `Complex` class and parser are pure functions with no
  DOM dependency, so they're easy to test with any JS test runner (Vitest,
  Jest) if you split them into their own module later.
