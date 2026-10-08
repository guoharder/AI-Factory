// Integration tests for GET /api/calc?expr=
// Spins up the server on an OS-assigned port (0), makes real HTTP requests,
// then closes the server. Mirrors the approach in server.regression.test.js.

const assert = require("node:assert");
const http = require("node:http");
const { server } = require("../server");

function get(port, path) {
  return new Promise((resolve, reject) => {
    http.get({ host: "127.0.0.1", port, path }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { body += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }).on("error", reject);
  });
}

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  try {
    // Case 1: valid expression — 2*(3+4) = 14
    {
      const { status, body } = await get(port, "/api/calc?expr=2*(3%2B4)");
      assert.strictEqual(status, 200, `expected 200, got ${status}`);
      const parsed = JSON.parse(body);
      assert.strictEqual(parsed.expr, "2*(3+4)", `expected expr "2*(3+4)", got "${parsed.expr}"`);
      assert.strictEqual(parsed.result, 14, `expected result 14, got ${parsed.result}`);
    }

    // Case 2: empty expr — should return 400 with an error key
    {
      const { status, body } = await get(port, "/api/calc?expr=");
      assert.strictEqual(status, 400, `expected 400, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in response body`);
    }

    // Case 3: invalid expr — should return 400 with an error key
    {
      const { status, body } = await get(port, "/api/calc?expr=notANumber");
      assert.strictEqual(status, 400, `expected 400, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in response body`);
    }

    console.log("api.test.js: all assertions passed");
  } finally {
    server.close();
  }
});
