# AI-Factory

## Web Calculator

The calculator is a browser-based UI served at `http://127.0.0.1:4173/` when the app is running.

```bash
npm start
```

Enter two numbers in the **Operand A** and **Operand B** fields, then click an operation button (Add, Subtract, Multiply, Divide) to compute a result.

### Calculation history

Each successful computation is appended to a history list displayed below the result box. The list is capped at 20 entries. History is saved to `localStorage` under the key `calc_history`, so it survives page refreshes. Errors and invalid input are never recorded.

A **Clear history** button wipes the list and removes the stored key. In private/incognito mode or when storage is full, the calculator degrades silently — the result still appears, history just isn't persisted.

---

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
- **Returns** `{ "error": string }` when the expression evaluates to a non-finite value (`Infinity`, `-Infinity`, `NaN`)

## Preset API

`GET /api/preset?name=<name>` reads `data/<name>.txt` and returns the stored arithmetic expression as JSON.

> **Note:** this endpoint is intended for local use only — never expose it to untrusted networks.

`name` must be a non-empty string matching `^[\w-]+$` (letters, digits, underscores, hyphens). Missing or invalid names return HTTP 400, which also prevents path traversal.

Preset files live at `data/<name>.txt`, one expression per file. The repo ships with `circle`, `square`, and `tax`.

**Success — HTTP 200**

```
GET /api/preset?name=circle
```

```json
{"name":"circle","expr":"3.14*2*2"}
```

- **Returns** `{ "name": string, "expr": string }`

**Error — HTTP 400**

```json
{"error":"invalid name"}
```

- **Returns** `{ "error": string }` when `name` is missing or does not match `^[\w-]+$`

**Error — HTTP 404**

```json
{"error":"not found"}
```

- **Returns** `{ "error": string }` when `data/<name>.txt` does not exist

```bash
curl 'http://localhost:4173/api/preset?name=circle'
# {"name":"circle","expr":"3.14*2*2"}

curl -i 'http://localhost:4173/api/preset?name=missing'
# HTTP/1.1 404 Not Found
# {"error":"not found"}

curl -i 'http://localhost:4173/api/preset'
# HTTP/1.1 400 Bad Request
# {"error":"invalid name"}
```

---

## CRM Lead Management

A simple in-memory lead store is available via REST API and a browser UI at `/crm.html`.

> **Note:** the store is in-memory — leads reset when the server restarts. It is intended for local use only.

### Endpoints

---

#### `POST /api/leads`

Create a new lead.

**Request body** `{ "name": string, "contact": string, "notes"?: string }`

**Success — HTTP 201**

```json
{
  "id": 1,
  "name": "Alice",
  "contact": "alice@example.com",
  "status": "new",
  "notes": "",
  "createdAt": "2026-10-09T12:00:00.000Z"
}
```

**Error — HTTP 400** when `name` or `contact` is missing.

```json
{ "error": "name and contact are required" }
```

---

#### `GET /api/leads`

List all leads.

**Success — HTTP 200** — returns a JSON array of lead objects (empty array when no leads exist).

```bash
curl 'http://localhost:4173/api/leads'
# [{"id":1,"name":"Alice","contact":"alice@example.com","status":"new","notes":"","createdAt":"..."}]
```

---

#### `GET /api/leads/:id`

Get a single lead by its numeric `id`.

**Success — HTTP 200** — returns the lead object.

**Error — HTTP 404** when the `id` does not exist.

```bash
curl 'http://localhost:4173/api/leads/1'
# {"id":1,"name":"Alice",...}

curl -i 'http://localhost:4173/api/leads/99'
# HTTP/1.1 404 Not Found
# {"error":"lead not found"}
```

---

#### `PATCH /api/leads/:id`

Update one or more fields on an existing lead. Allowed fields: `name`, `contact`, `status`, `notes`.

Valid `status` values: `new`, `contacted`, `qualified`, `lost`.

**Request body** `{ "status"?: string, "name"?: string, "contact"?: string, "notes"?: string }`

**Success — HTTP 200** — returns the updated lead object.

**Error — HTTP 404** when the `id` does not exist.

```bash
curl -X PATCH 'http://localhost:4173/api/leads/1' \
  -H 'Content-Type: application/json' \
  -d '{"status":"contacted","notes":"left voicemail"}'
# {"id":1,"name":"Alice","contact":"alice@example.com","status":"contacted","notes":"left voicemail","createdAt":"..."}
```

---

#### `DELETE /api/leads/:id`

Remove a lead permanently.

**Success — HTTP 204** — no response body.

**Error — HTTP 404** when the `id` does not exist.

```bash
curl -X DELETE 'http://localhost:4173/api/leads/1'
# (204 No Content)
```

---

### Unsupported methods

Any HTTP method not listed above returns `405 Method Not Allowed` with an `Allow` header naming the permitted methods.

```bash
curl -i -X PUT 'http://localhost:4173/api/leads'
# HTTP/1.1 405 Method Not Allowed
# Allow: GET, POST
# {"error":"method not allowed"}
```

---

### CRM UI

Open `http://localhost:4173/crm.html` in a browser to manage leads visually. The page lists all leads, provides a form to create new ones, supports inline editing (name, contact, status, notes), and includes a delete button per row.
