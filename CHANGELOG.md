# Changelog

## [Unreleased]

### Added

- Add `GET /api/preset?name=<name>` endpoint: reads `data/<name>.txt` and returns `{name, expr}` on HTTP 200; `name` is validated against `/^[\w-]+$/` — missing or invalid name returns HTTP 400, file not found returns HTTP 404 (RBK-55).
- Add preset expression dropdown to the calculator UI: selecting circle, square, or tax fetches the expression from `/api/preset`, evaluates it via `/api/calc`, and displays the result immediately — no typing required (RBK-55).
- Fix `input#a` to `type="text"` so preset expression strings (e.g. `3.14*2*2`) are accepted by the browser instead of being silently discarded (RBK-55).
- Add `compute()` fallback: when Operand A contains a non-numeric expression, the calculator evaluates it via `GET /api/calc` instead of showing a validation error (RBK-55).
- Add `Number.isFinite` guard to `handleCalc`: expressions that evaluate to `Infinity`, `NaN`, or a non-number now return HTTP 400 (RBK-55).
- Add `test/preset.test.js` covering exists, not-exists, missing-name (400), and path-traversal (400) cases; extend `test/api.test.js` with non-finite guard and preset-style arithmetic cases (RBK-55).
- Document Preset API in README with name validation rules, HTTP status codes, and curl examples (RBK-55).
- Add `GET /api/calc?expr=` endpoint: evaluates arithmetic expressions server-side and returns `{"expr","result"}` on HTTP 200, or `{"error"}` on HTTP 400 for missing, empty, or unevaluable expressions (RBK-54).
- Add integration test suite `test/api.test.js` covering valid expression, empty `expr`, and invalid `expr` cases, wired into `npm test` (RBK-54).
- Document the Calc API endpoint in README.md with request/response examples, HTTP status codes, and a local-use-only security note (RBK-54).
- Add localStorage-backed calculation history to the web calculator: each successful computation is appended to a list below the result box, capped at 20 entries, persisted across page refreshes, with a Clear button and silent degradation in private/incognito mode (RBK-53).
- Added Stats API reference section to README.md documenting `mean`, `median`, `percentile`, `range`, `clamp`, and `t1stamp` with signatures, return values, error conditions, and usage examples (RBK-52).
