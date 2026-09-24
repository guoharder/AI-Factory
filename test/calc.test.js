const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

// (a) The page's four operations, exercised through the same source of truth.
const { add, sub, mul, div } = require("../src/math");

assert.strictEqual(add(2, 3), 5);
assert.strictEqual(sub(5, 2), 3);
assert.strictEqual(mul(3, 4), 12);
assert.strictEqual(div(10, 2), 5);
assert.throws(() => div(1, 0), /division by zero/);

// (b) The browser (no-CommonJS) load branch: evaluate src/math.js in a context
// with no `module`/`exports`, and assert it defines a mathLib global.
const source = fs.readFileSync(path.join(__dirname, "..", "src", "math.js"), "utf8");
const sandbox = { globalThis: {} };
sandbox.globalThis.globalThis = sandbox.globalThis;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);

const mathLib = sandbox.globalThis.mathLib;
assert.ok(mathLib, "mathLib global should be defined in the browser branch");
assert.strictEqual(typeof mathLib.add, "function");
assert.strictEqual(typeof mathLib.sub, "function");
assert.strictEqual(typeof mathLib.mul, "function");
assert.strictEqual(typeof mathLib.div, "function");
assert.strictEqual(mathLib.add(2, 3), 5);
assert.strictEqual(mathLib.div(10, 2), 5);
assert.throws(() => mathLib.div(1, 0), /division by zero/);
assert.strictEqual(typeof mathLib.pow, "function");
assert.strictEqual(mathLib.pow(2, 10), 1024);
assert.strictEqual(mathLib.pow(5, 0), 1);
assert.throws(() => mathLib.pow(2, -1), /non-negative integer/);

console.log("calc.test.js: all assertions passed");
