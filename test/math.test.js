const assert = require("node:assert");
const { add, sub, mul } = require("../src/math");

assert.strictEqual(add(2, 3), 5);
assert.strictEqual(add(-1, 1), 0);
assert.strictEqual(sub(5, 2), 3);
assert.strictEqual(mul(3, 4), 12);
assert.strictEqual(mul(-2, 5), -10);

console.log("math.test.js: all assertions passed");
