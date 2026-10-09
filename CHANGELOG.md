# Changelog

## [Unreleased]

### Added

- Add `GET /api/calc?expr=` endpoint: evaluates arithmetic expressions server-side and returns `{"expr","result"}` on HTTP 200, or `{"error"}` on HTTP 400 for missing, empty, or unevaluable expressions (RBK-54).
- Add integration test suite `test/api.test.js` covering valid expression, empty `expr`, and invalid `expr` cases, wired into `npm test` (RBK-54).
- Document the Calc API endpoint in README.md with request/response examples, HTTP status codes, and a local-use-only security note (RBK-54).
- Add localStorage-backed calculation history to the web calculator: each successful computation is appended to a list below the result box, capped at 20 entries, persisted across page refreshes, with a Clear button and silent degradation in private/incognito mode (RBK-53).
- Added Stats API reference section to README.md documenting `mean`, `median`, `percentile`, `range`, `clamp`, and `t1stamp` with signatures, return values, error conditions, and usage examples (RBK-52).
