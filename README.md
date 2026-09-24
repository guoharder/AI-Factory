# AI-Factory

A minimal, dependency-free math app with a web calculator page. Arithmetic lives
in a single source of truth (`src/math.js`) that is reused both by Node tests and
by the browser calculator — no arithmetic is reimplemented anywhere else.

## Operations

All operations are exported from `src/math.js`:

- `add(a, b)` — returns `a + b`
- `sub(a, b)` — returns `a - b`
- `mul(a, b)` — returns `a * b`
- `div(a, b)` — returns `a / b`; throws `Error("division by zero")` when `b === 0`
- `pow(a, n)` — returns `a` raised to the integer power `n`; throws
  `Error("exponent must be a non-negative integer")` when `n` is not a
  non-negative integer

`src/math.js` is dual-exported: as a CommonJS module under Node and as a
`mathLib` global in the browser.

## Run

```sh
npm start
```

This starts `server.js`, which serves the calculator at
http://127.0.0.1:4173/. The server serves `public/index.html` and
`/src/math.js`, confined to those paths (path traversal and malformed
percent-encoded URLs are rejected with a 404).

## Test

```sh
npm test
```

This runs the three test files with plain `node`:

- `test/math.test.js` — exercises `add`, `sub`, `mul`, `div`, `pow`
- `test/calc.test.js` — verifies the four calculator operations and the
  browser `mathLib` global branch
- `test/server.regression.test.js` — guards `resolveFile` against malformed
  URLs and path traversal

## Project layout

- `src/math.js` — the math library (single source of truth)
- `server.js` — static-file server for the calculator page
- `public/index.html` — the web calculator UI
- `test/` — assertion-based tests run by `npm test`
