const assert = require("node:assert");
const { add, sub, mul, div, pow } = require("../src/math");

assert.strictEqual(add(2, 3), 5);
assert.strictEqual(add(-1, 1), 0);
assert.strictEqual(sub(5, 2), 3);
assert.strictEqual(mul(3, 4), 12);
assert.strictEqual(mul(-2, 5), -10);

assert.strictEqual(div(10, 2), 5);
assert.throws(() => div(1, 0), /division by zero/);

assert.strictEqual(pow(2, 10), 1024);
assert.strictEqual(pow(5, 0), 1);
assert.throws(() => pow(2, -1), /non-negative integer/);

console.log("math.test.js: all assertions passed");
