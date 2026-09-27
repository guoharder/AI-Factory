function mean(values) {
  if (values.length === 0) throw new Error("mean of empty array");
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

function median(values) {
  if (values.length === 0) throw new Error("median of empty array");
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

// percentile: p-th percentile via linear interpolation (R-7 / NumPy "linear"
// default), with p given in [0, 100]. Chosen so percentile(v, 50) === median(v)
// for both odd and even lengths, making percentile a strict generalization of
// median. Pure: input is copied before sorting.
function percentile(values, p) {
  if (values.length === 0) throw new Error("percentile of empty array");
  if (typeof p !== "number" || !Number.isFinite(p) || p < 0 || p > 100) {
    throw new Error("percentile p must be in [0, 100]");
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const rank = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(rank);
  const hi = Math.ceil(rank);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (rank - lo) * (sorted[hi] - sorted[lo]);
}

// range: difference between the largest and smallest element (max - min).
// Single-pass reduction — no sort, no copy, inherently pure. Uses an explicit
// for...of loop (mirrors mean()) rather than Math.max(...values)/Math.min(...)
// which throws RangeError on very large arrays (spread argument-count limit).
function range(values) {
  if (values.length === 0) throw new Error("range of empty array");
  let min = values[0];
  let max = values[0];
  for (const v of values) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return max - min;
}

// clamp: bound value to the inclusive range [min, max] — return min when
// value < min, max when value > max, otherwise value unchanged. Operates on
// scalars (unlike its array siblings) so it is inherently pure. Rejects an
// invalid range (min > max) per the issue, and — matching percentile()'s
// input-validation defensiveness — requires value, min, and max to all be
// finite numbers.
function clamp(value, min, max) {
  if (
    typeof value !== "number" || !Number.isFinite(value) ||
    typeof min !== "number" || !Number.isFinite(min) ||
    typeof max !== "number" || !Number.isFinite(max)
  ) {
    throw new Error("clamp expects finite numbers");
  }
  if (min > max) throw new Error("clamp min must be <= max");
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

// Dual export: CommonJS (Node) + browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mean, median, percentile, range, clamp };
} else {
  globalThis.statsLib = { mean, median, percentile, range, clamp };
}
