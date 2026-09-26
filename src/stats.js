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

// Dual export: CommonJS (Node) + browser global
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { mean, median };
} else {
  globalThis.statsLib = { mean, median };
}
