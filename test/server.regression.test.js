// Regression: RBK-11-F1 — malformed percent-encoded URL crashed the server (uncaught URIError)
// Found by /qa on 2026-09-24
// Report: /workspace/.multica/output/qa-report.json
//
// Before the fix, resolveFile() called decodeURIComponent() with no guard, so a
// request for "/%" (or any invalid percent-encoding) threw URIError synchronously
// in the request handler and, with no uncaughtException handler, killed the whole
// Node process. resolveFile now catches the URIError and returns null, which the
// request handler turns into a 404. This test calls resolveFile directly with the
// exact malformed inputs from the review finding and asserts it returns null
// (no throw), while confirming normal paths still resolve correctly.

const assert = require("node:assert");
const path = require("node:path");
const { resolveFile } = require("../server");

// The bug: these all threw URIError before the fix. They must now return null.
for (const bad of ["/%", "/%zz", "/%e0%a4%a", "/%c3%28", "/foo%"]) {
  assert.doesNotThrow(() => resolveFile(bad), `resolveFile(${JSON.stringify(bad)}) must not throw`);
  assert.strictEqual(resolveFile(bad), null, `resolveFile(${JSON.stringify(bad)}) should be null -> 404`);
}

// Normal paths still resolve so the guard did not over-reject valid requests.
assert.ok(resolveFile("/").endsWith(path.join("public", "index.html")), "/ resolves to public/index.html");
assert.ok(resolveFile("/index.html").endsWith(path.join("public", "index.html")), "/index.html resolves");
assert.ok(resolveFile("/src/math.js").endsWith(path.join("src", "math.js")), "/src/math.js resolves");

// Valid percent-encoding still decodes correctly (e.g. %2E == "."). This one
// decodes to /index.html and must still resolve.
assert.ok(resolveFile("/index%2Ehtml").endsWith(path.join("public", "index.html")), "valid %2E decoding still works");

// Path traversal remains blocked (guard unchanged by the fix).
assert.strictEqual(resolveFile("/../package.json"), null, "traversal still blocked");
assert.strictEqual(resolveFile("/../../etc/passwd"), null, "deep traversal still blocked");
assert.strictEqual(resolveFile("/%2e%2e/package.json"), null, "encoded traversal blocked (%2e%2e)");
assert.strictEqual(resolveFile("/..%2fpackage.json"), null, "encoded traversal blocked (..%2f)");
assert.strictEqual(
  resolveFile("/foo/%2e%2e/%2e%2e/etc/passwd"),
  null,
  "encoded nested traversal blocked"
);

console.log("server.regression.test.js: all assertions passed");
