const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const HOST = "127.0.0.1";
const PORT = process.env.PORT !== undefined ? Number(process.env.PORT) : 4173;

// Route allowlist: URL path -> { file relative to repo root, content type }.
const ROUTES = {
  "/": { file: "public/index.html", type: "text/html; charset=utf-8" },
  "/index.html": { file: "public/index.html", type: "text/html; charset=utf-8" },
  "/src/math.js": { file: "src/math.js", type: "text/javascript; charset=utf-8" },
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split("?")[0];
  const route = ROUTES[urlPath];

  if (!route) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
    return;
  }

  const filePath = path.resolve(ROOT, route.file);
  // Path-traversal guard: the resolved file must live under the repo root.
  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": route.type });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Serving calculator on http://${HOST}:${PORT}`);
});

module.exports = server;
