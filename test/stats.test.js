const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { mean, median, percentile, range } = require("../src/stats");

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

// percentile: p50 equals median for odd and even lengths (linear interpolation)
assert.strictEqual(percentile([1, 2, 3, 4], 50), 2.5);
assert.strictEqual(percentile([1, 2, 3, 4], 50), median([1, 2, 3, 4]));
assert.strictEqual(percentile([3, 1, 2], 50), 2);
assert.strictEqual(percentile([3, 1, 2], 50), median([3, 1, 2]));

// percentile: p90/p99 exact linear-interpolation values on 1..10
// rank(p90) = 0.90 * 9 = 8.1  -> 9 + 0.1*(10-9) = 9.1
// rank(p99) = 0.99 * 9 = 8.91 -> 9 + 0.91*(10-9) = 9.91
const dist = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
assert.strictEqual(percentile(dist, 90), 9.1);
assert.strictEqual(percentile(dist, 99), 9.91);

// percentile: boundaries p=0 -> min, p=100 -> max
assert.strictEqual(percentile(dist, 0), 1);
assert.strictEqual(percentile(dist, 100), 10);

// percentile: single-element array returns that element for any p
assert.strictEqual(percentile([42], 0), 42);
assert.strictEqual(percentile([42], 90), 42);
assert.strictEqual(percentile([42], 100), 42);

// percentile: empty array throws
assert.throws(() => percentile([], 50), /percentile of empty array/);

// percentile: out-of-range and non-numeric p throw
assert.throws(() => percentile([1, 2, 3], 150), /percentile p must be in \[0, 100\]/);
assert.throws(() => percentile([1, 2, 3], -1), /percentile p must be in \[0, 100\]/);
assert.throws(() => percentile([1, 2, 3], NaN), /percentile p must be in \[0, 100\]/);

// percentile: numeric sort, not lexicographic ([10, 1, 2] at p0 -> 1, not 10)
assert.strictEqual(percentile([10, 1, 2], 0), 1);
assert.strictEqual(percentile([10, 1, 2], 100), 10);

// percentile: position landing exactly on a data point returns that value (AC-13)
// rank(p50) on 5 elements = 0.50 * 4 = 2 -> sorted[2] === 30, no interpolation
assert.strictEqual(percentile([10, 20, 30, 40, 50], 50), 30);
assert.strictEqual(percentile([1, 2, 3, 4], 25), 1.75);

// percentile: duplicate values are ranked distinctly; interpolated median lands
// on a repeated value (AC-15). rank(p50) on 4 elements = 1.5 -> 1 + 0.5*(1-1) = 1
assert.strictEqual(percentile([1, 1, 1, 2], 50), 1);

// percentile: purity — must not mutate its input
const pv = [3, 1, 2];
percentile(pv, 90);
assert.deepStrictEqual(pv, [3, 1, 2]);

// range: typical (max - min), single-element (0), negatives, duplicates/unsorted
assert.strictEqual(range([1, 2, 3, 4]), 3);
assert.strictEqual(range([5]), 0);
assert.strictEqual(range([-5, -1, -10]), 9);
assert.strictEqual(range([3, 1, 2, 1, 3]), 2);

// range: empty array throws
assert.throws(() => range([]), /range of empty array/);

// range: purity — must not mutate its input
const rv = [3, 1, 2];
range(rv);
assert.deepStrictEqual(rv, [3, 1, 2]);

// percentile: browser (no-CommonJS) load branch defines statsLib.percentile
const source = fs.readFileSync(path.join(__dirname, "..", "src", "stats.js"), "utf8");
const sandbox = { globalThis: {} };
sandbox.globalThis.globalThis = sandbox.globalThis;
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const statsLib = sandbox.globalThis.statsLib;
assert.ok(statsLib, "statsLib global should be defined in the browser branch");
assert.strictEqual(typeof statsLib.percentile, "function");
assert.strictEqual(statsLib.percentile([1, 2, 3, 4], 50), 2.5);
assert.strictEqual(typeof statsLib.range, "function");
assert.strictEqual(statsLib.range([1, 2, 3, 4]), 3);

console.log("stats.test.js: all assertions passed");
