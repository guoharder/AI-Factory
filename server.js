const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = 4173;

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "public");
const MATH_FILE = path.join(ROOT, "src", "math.js");

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
  const decoded = decodeURIComponent(urlPath.split("?")[0]);

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

const server = http.createServer((req, res) => {
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

server.listen(PORT, HOST, () => {
  console.log(`Calculator running at http://${HOST}:${PORT}/`);
});
