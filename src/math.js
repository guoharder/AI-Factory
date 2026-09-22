function add(a, b) {
  return a + b;
}

function sub(a, b) {
  return a - b;
}

function mul(a, b) {
  return a * b;
}

function div(a, b) {
  if (b === 0) throw new Error("division by zero");
  return a / b;
}

function pow(a, n) {
  if (!Number.isInteger(n) || n < 0) throw new Error("exponent must be a non-negative integer");
  let r = 1;
  for (let i = 0; i < n; i++) r *= a;
  return r;
}

module.exports = { add, sub, mul, div, pow };
