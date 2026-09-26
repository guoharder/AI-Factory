const assert = require("node:assert");
const { mean, median } = require("../src/stats");

// mean: typical, single-element, empty
assert.strictEqual(mean([1, 2, 3, 4]), 2.5);
assert.strictEqual(mean([5]), 5);
assert.throws(() => mean([]), /mean of empty array/);

// median: typical (odd, unsorted), even, single-element, empty
assert.strictEqual(median([3, 1, 2]), 2);
assert.strictEqual(median([1, 2, 3, 4]), 2.5);
assert.strictEqual(median([7]), 7);
assert.throws(() => median([]), /median of empty array/);

// median: numeric sort, not lexicographic ([1, 2, 10] -> 2, not 10)
assert.strictEqual(median([1, 2, 10]), 2);

// median: purity — must not mutate its input
const v = [3, 1, 2];
median(v);
assert.deepStrictEqual(v, [3, 1, 2]);

console.log("stats.test.js: all assertions passed");
