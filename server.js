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
// name must be a non-empty /^[\w-]+$/ string; missing or invalid values get
// HTTP 400, which also blocks path traversal (dots and slashes are rejected).
function handlePreset(req, res) {
  const { searchParams } = new URL(req.url, "http://localhost");
  const name = searchParams.get("name");

  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };

  if (!name || !/^[\w-]+$/.test(name)) {
    return json(400, { error: "invalid name" });
  }

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
    if (!Number.isFinite(result)) {
      return json(400, { error: "expression did not return a finite number" });
    }
    json(200, { expr, result });
  } catch (err) {
    json(400, { error: err.message || "invalid expression" });
  }
}

// ---------------------------------------------------------------------------
// CRM lead store — in-memory, resets on server restart
// ---------------------------------------------------------------------------
let leads = [];
let nextLeadId = 1;

// Reads the full request body and resolves with the parsed JSON object,
// or rejects if the body is not valid JSON.
function readJSON(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        resolve(raw.trim() ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

// POST /api/leads — create a new lead
// Body: { name, contact, notes? }
// Returns 201 + lead on success, 400 if name or contact is missing.
function handleLeadCreate(req, res) {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };

  readJSON(req).then((body) => {
    const { name, contact, notes } = body || {};
    if (!name || !contact) {
      return json(400, { error: "name and contact are required" });
    }
    const lead = {
      id: nextLeadId++,
      name: String(name),
      contact: String(contact),
      status: "new",
      notes: notes != null ? String(notes) : "",
      createdAt: new Date().toISOString(),
    };
    leads.push(lead);
    json(201, lead);
  }).catch(() => json(400, { error: "invalid JSON body" }));
}

// GET /api/leads — list all leads
function handleLeadList(req, res) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(leads));
}

// GET /api/leads/:id — get a single lead by id
function handleLeadGet(req, res, id) {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  const lead = leads.find((l) => l.id === id);
  if (!lead) return json(404, { error: "lead not found" });
  json(200, lead);
}

// PATCH /api/leads/:id — update allowed fields on an existing lead
// Allowed fields: name, contact, status, notes
function handleLeadUpdate(req, res, id) {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  const lead = leads.find((l) => l.id === id);
  if (!lead) return json(404, { error: "lead not found" });

  readJSON(req).then((body) => {
    const allowed = ["name", "contact", "status", "notes"];
    for (const key of allowed) {
      if (body[key] != null) lead[key] = String(body[key]);
    }
    json(200, lead);
  }).catch(() => json(400, { error: "invalid JSON body" }));
}

// DELETE /api/leads/:id — remove a lead; returns 204 No Content on success
function handleLeadDelete(req, res, id) {
  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(body));
  };
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return json(404, { error: "lead not found" });
  leads.splice(idx, 1);
  res.writeHead(204);
  res.end();
}

const server = http.createServer((req, res) => {
  if (req.url === "/api/calc" || req.url.startsWith("/api/calc?")) {
    return handleCalc(req, res);
  }

  if (req.url === "/api/preset" || req.url.startsWith("/api/preset?")) {
    return handlePreset(req, res);
  }

  // CRM leads — dispatch on method and path
  if (req.url === "/api/leads" || req.url.startsWith("/api/leads/")) {
    const urlPath = req.url.split("?")[0]; // strip any query string
    if (urlPath === "/api/leads") {
      if (req.method === "POST") return handleLeadCreate(req, res);
      if (req.method === "GET")  return handleLeadList(req, res);
      // Unsupported method on /api/leads
      res.writeHead(405, {
        "Content-Type": "application/json; charset=utf-8",
        "Allow": "GET, POST",
      });
      return res.end(JSON.stringify({ error: "method not allowed" }));
    }
    const match = urlPath.match(/^\/api\/leads\/(\d+)$/);
    if (match) {
      const id = parseInt(match[1], 10);
      if (req.method === "GET")    return handleLeadGet(req, res, id);
      if (req.method === "PATCH")  return handleLeadUpdate(req, res, id);
      if (req.method === "DELETE") return handleLeadDelete(req, res, id);
      // Unsupported method on /api/leads/:id
      res.writeHead(405, {
        "Content-Type": "application/json; charset=utf-8",
        "Allow": "GET, PATCH, DELETE",
      });
      return res.end(JSON.stringify({ error: "method not allowed" }));
    }
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    return res.end(JSON.stringify({ error: "not found" }));
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

module.exports = {
  resolveFile,
  contentTypeFor,
  handlePreset,
  handleLeadCreate,
  handleLeadList,
  handleLeadGet,
  handleLeadUpdate,
  handleLeadDelete,
  server,
  // Exposed for test isolation: allows tests to reset the store between suites.
  _resetLeads() { leads = []; nextLeadId = 1; },
};
