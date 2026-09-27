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

// Dual export: CommonJS (Node) + browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mean, median, percentile };
} else {
  globalThis.statsLib = { mean, median, percentile };
}
