// Integration tests for GET /api/preset?name=
// Spins up the server on a random port, makes real HTTP requests, then closes.
// Note: runs sequentially with api.test.js via npm test (&&), so there is no
// port conflict on the shared server instance. Parallelising would break this.
const assert = require("assert");
const http = require("http");
const { server } = require("../server");

function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${urlPath}`, (res) => {
      let body = "";
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  try {
    // Case 1: known preset file exists — expect 200 with name and expr
    const found = await get(port, "/api/preset?name=circle");
    assert.strictEqual(found.status, 200, `expected 200, got ${found.status}`);
    const foundBody = JSON.parse(found.body);
    assert.strictEqual(foundBody.name, "circle", `name should be 'circle'`);
    assert.strictEqual(typeof foundBody.expr, "string", `expr should be a string`);
    assert.ok(foundBody.expr.length > 0, `expr should be non-empty`);

    // Case 2: missing file — expect 404 with error key
    const missing = await get(port, "/api/preset?name=__no_such_file__");
    assert.strictEqual(missing.status, 404, `expected 404, got ${missing.status}`);
    const missingBody = JSON.parse(missing.body);
    assert.ok("error" in missingBody, `response body should have an 'error' key`);

    // Case 3: missing name — expect 400 with error key
    const noName = await get(port, "/api/preset");
    assert.strictEqual(noName.status, 400, `expected 400, got ${noName.status}`);
    const noNameBody = JSON.parse(noName.body);
    assert.ok("error" in noNameBody, `response body should have an 'error' key`);

    // Case 4: path traversal attempt — expect 400 with error key
    const traversal = await get(port, "/api/preset?name=../package");
    assert.strictEqual(traversal.status, 400, `expected 400, got ${traversal.status}`);
    const traversalBody = JSON.parse(traversal.body);
    assert.ok("error" in traversalBody, `response body should have an 'error' key`);

    console.log("preset.test.js: all assertions passed");
  } finally {
    server.close();
  }
});
