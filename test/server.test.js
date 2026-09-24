const assert = require("node:assert");
const http = require("node:http");
const path = require("node:path");

// --- Dual-export contract of src/math.js -----------------------------------

// Node/CommonJS path: require returns all five functions.
const mathNode = require("../src/math");
for (const fn of ["add", "sub", "mul", "div", "pow"]) {
  assert.strictEqual(
    typeof mathNode[fn],
    "function",
    `require('../src/math').${fn} should be a function`
  );
}
assert.strictEqual(mathNode.add(2, 3), 5);
assert.strictEqual(mathNode.pow(2, 3), 8);

// Browser path: simulate a browser by setting global.window, then re-loading
// the source in a fresh module cache so the window branch runs.
(function verifyBrowserBranch() {
  const fakeWindow = {};
  global.window = fakeWindow;
  const resolved = require.resolve("../src/math");
  delete require.cache[resolved];
  try {
    require("../src/math");
  } finally {
    delete require.cache[resolved];
    delete global.window;
  }
  assert.ok(fakeWindow.math, "browser branch should set window.math");
  for (const fn of ["add", "sub", "mul", "div", "pow"]) {
    assert.strictEqual(
      typeof fakeWindow.math[fn],
      "function",
      `window.math.${fn} should be a function`
    );
  }
  assert.strictEqual(fakeWindow.math.mul(3, 4), 12);
})();

// --- Server routing ---------------------------------------------------------

function get(port, urlPath) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: urlPath, method: "GET" },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            contentType: res.headers["content-type"] || "",
            body,
          })
        );
      }
    );
    req.on("error", reject);
    req.end();
  });
}

(async function runServerTests() {
  // Use an ephemeral port so we never collide with a running dev server.
  process.env.PORT = "0";
  const server = require("../server");

  await new Promise((resolve) => {
    if (server.listening) return resolve();
    server.once("listening", resolve);
  });
  const port = server.address().port;
  assert.notStrictEqual(port, 4173, "test should use an ephemeral (non-4173) port");

  try {
    const root = await get(port, "/");
    assert.strictEqual(root.status, 200, "GET / should be 200");
    assert.match(root.contentType, /text\/html/, "GET / should be text/html");
    assert.match(root.body, /Web Calculator/, "GET / should return calculator markup");
    assert.match(root.body, /src\/math\.js/, "page should reference src/math.js");

    const mathRes = await get(port, "/src/math.js");
    assert.strictEqual(mathRes.status, 200, "GET /src/math.js should be 200");
    assert.match(mathRes.contentType, /javascript/, "math.js should be served as JS");
    assert.match(mathRes.body, /function add/, "math.js body should be served");

    const notFound = await get(port, "/nope");
    assert.strictEqual(notFound.status, 404, "unknown path should be 404");

    // Traversal attempt must not leak files outside the route allowlist.
    const traversal = await get(port, "/../package.json");
    assert.notStrictEqual(
      traversal.status,
      200,
      "traversal attempt should not return 200"
    );
    assert.doesNotMatch(
      traversal.body,
      /"private"\s*:\s*true/,
      "traversal attempt should not leak package.json contents"
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  console.log("server.test.js: all assertions passed");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
