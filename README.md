# AI-Factory

## Stats API

The stats module (`src/stats.js`) exports six functions for descriptive statistics and numeric utilities. Load it in Node:

```js
const { mean, median, percentile, range, clamp, t1stamp } = require('./src/stats');
```

---

### `mean(values)`

Returns the arithmetic mean of a numeric array.

- **Returns** `number`
- **Throws** `Error("mean of empty array")` when `values` is empty

---

### `median(values)`

Returns the median of a numeric array. For even-length arrays, returns the average of the two middle values after sorting. The input is not mutated.

- **Returns** `number`
- **Throws** `Error("median of empty array")` when `values` is empty

```js
median([3, 1, 2])      // 2  (odd length — middle value)
median([1, 2, 3, 4])   // 2.5  (even length — average of 2 and 3)
```

---

### `percentile(values, p)`

Returns the `p`-th percentile of a numeric array using linear interpolation (R-7 / NumPy `"linear"` method), with `p` in `[0, 100]`. `percentile(v, 50)` equals `median(v)` for all inputs. The input is not mutated.

- **Returns** `number`
- **Throws** `Error("percentile of empty array")` when `values` is empty
- **Throws** `Error("percentile p must be in [0, 100]")` when `p` is out of range or not a finite number

```js
percentile([1, 2, 3, 4], 25)   // 1.75
percentile([1, 2, 3, 4], 50)   // 2.5
```

---

### `range(values)`

Returns the difference between the largest and smallest element (`max - min`). Single-pass; the input is not mutated.

- **Returns** `number`
- **Throws** `Error("range of empty array")` when `values` is empty

```js
range([1, 2, 3, 4])   // 3
range([-5, -1, -10])  // 9
```

---

### `clamp(value, min, max)`

Bounds a scalar to the inclusive interval `[min, max]`. Returns `min` when `value < min`, `max` when `value > max`, and `value` unchanged otherwise.

- **Returns** `number`
- **Throws** `Error("clamp expects finite numbers")` when any argument is non-finite or not a number
- **Throws** `Error("clamp min must be <= max")` when `min > max`

```js
clamp(5, 0, 10)    // 5
clamp(-3, 0, 10)   // 0
clamp(42, 0, 10)   // 10
```

---

### `t1stamp()`

Returns the fixed string marker `"t1"`. Takes no arguments.

- **Returns** `"t1"`

```js
t1stamp()   // "t1"
```

---

## Calc API

`GET /api/calc?expr=<expression>` evaluates an arithmetic expression and returns the result as JSON.

> **Note:** evaluation uses `new Function`, which executes arbitrary JavaScript in the server process. This endpoint is intended for local use only — never expose it to untrusted networks.

**Success — HTTP 200**

```
GET /api/calc?expr=2*(3+4)
```

```json
{"expr":"2*(3+4)","result":14}
```

- **Returns** `{ "expr": string, "result": number }`

**Error — HTTP 400**

```json
{"error":"expr is required"}
```

- **Returns** `{ "error": string }` when `expr` is missing or empty
- **Returns** `{ "error": string }` when the expression cannot be evaluated (syntax error, undefined identifier, etc.)
