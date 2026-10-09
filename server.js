const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = 4173;

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const MATH_FILE = path.join(ROOT, "src", "math.js");
const DATA_DIR = path.join(ROOT, "data");

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

function contentTypeFor(filePath) {
  return CONTENT_TYPES[path.extname(filePath)] || "application/octet-stream";
}

// Resolve a request path to an on-disk file, confined to the served roots.
// Returns null for anything outside public/ or the single src/math.js file.
function resolveFile(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch (err) {
    // Malformed percent-encoding (e.g. "/%", "/%zz") throws URIError.
    // Treat as not found instead of letting it crash the process.
    return null;
  }

  if (decoded === "/src/math.js") {
    return MATH_FILE;
  }

  const requested = decoded === "/" ? "/index.html" : decoded;
  const resolved = path.normalize(path.join(PUBLIC_DIR, requested));

  // Confine to PUBLIC_DIR — reject path traversal.
  if (resolved !== PUBLIC_DIR && !resolved.startsWith(PUBLIC_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

// Handle GET /api/preset?name=<name>
// Reads data/<name>.txt and returns {name, expr}.
// name is not validated — this is a local internal tool (see README).
// path.join with DATA_DIR confines reads to data/ for normal inputs, but a
// name like '../package' would escape to repo root; accepted per issue spec.
function handlePreset(req, res) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const name = searchParams.get("name");

  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };

  const filePath = path.join(DATA_DIR, name + ".txt");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        return json(404, { error: "not found" });
      }
      return json(500, { error: err.message || "internal error" });
    }
    json(200, { name, expr: data.trim() });
  });
}

// Handle GET /api/calc?expr=<expression>
// Evaluates expr with new Function — runs in global scope, so arbitrary JS executes.
// Acceptable for a local tool (see README); never expose to untrusted networks.
function handleCalc(req, res) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const expr = searchParams.get("expr");

  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };

  if (expr === null || expr.trim() === "") {
    return json(400, { error: "expr is required" });
  }

  try {
    // eslint-disable-next-line no-new-func
    const result = new Function("return (" + expr + ")")();
    json(200, { expr, result });
  } catch (err) {
    json(400, { error: err.message || "invalid expression" });
  }
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/calc" || req.url.startsWith("/api/calc?")) {
    return handleCalc(req, res);
  }

  if (req.url === "/api/preset" || req.url.startsWith("/api/preset?")) {
    return handlePreset(req, res);
  }

  const filePath = resolveFile(req.url);

  if (!filePath) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    res.end(data);
  });
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use on ${HOST}.`);
  } else {
    console.error(err.message);
  }
  process.exit(1);
});

// Only start listening when run directly (`node server.js` / `npm start`),
// so tests can require this module and exercise resolveFile without binding a port.
if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`Calculator running at http://${HOST}:${PORT}/`);
  });
}

module.exports = { resolveFile, contentTypeFor, handlePreset, server };
