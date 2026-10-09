// Integration tests for the CRM lead endpoints (POST/GET/PATCH/DELETE /api/leads).
// Spins up the server on an OS-assigned port (0), makes real HTTP requests,
// then closes the server. Mirrors the approach in api.test.js / preset.test.js.

const assert = require("node:assert");
const http = require("node:http");
const { server, _resetLeads } = require("../server");

// Generic request helper: supports any method and an optional JSON body.
function request(port, method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const headers = {};
    if (data != null) {
      headers["Content-Type"] = "application/json; charset=utf-8";
      headers["Content-Length"] = Buffer.byteLength(data);
    }
    const req = http.request({ host: "127.0.0.1", port, method, path, headers }, (res) => {
      let chunks = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => { chunks += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, body: chunks }));
    });
    req.on("error", reject);
    if (data != null) req.write(data);
    req.end();
  });
}

function get(port, path) {
  return request(port, "GET", path);
}

server.listen(0, "127.0.0.1", async () => {
  const port = server.address().port;
  try {
    // Start from a clean in-memory store so the suite is order-independent.
    _resetLeads();

    // Case 1: create a lead — expect 201 with all fields populated
    {
      const { status, body } = await request(port, "POST", "/api/leads", {
        name: "Alice",
        contact: "alice@example.com",
      });
      assert.strictEqual(status, 201, `expected 201, got ${status}`);
      const lead = JSON.parse(body);
      assert.ok(typeof lead.id === "number" && lead.id > 0, `id should be a positive number`);
      assert.strictEqual(lead.name, "Alice", `name should be 'Alice'`);
      assert.strictEqual(lead.contact, "alice@example.com", `contact mismatch`);
      assert.strictEqual(lead.status, "new", `status should default to 'new'`);
      assert.strictEqual(lead.notes, "", `notes should default to ''`);
      assert.ok(typeof lead.createdAt === "string" && lead.createdAt.length > 0, `createdAt should be a string`);
    }

    // Case 2: create with missing required fields — expect 400 with error key
    {
      const { status, body } = await request(port, "POST", "/api/leads", {});
      assert.strictEqual(status, 400, `expected 400, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in response body`);
    }

    // Case 3: list leads — expect 200 with a JSON array
    {
      const { status, body } = await get(port, "/api/leads");
      assert.strictEqual(status, 200, `expected 200, got ${status}`);
      const arr = JSON.parse(body);
      assert.ok(Array.isArray(arr), `expected a JSON array`);
      assert.ok(arr.length >= 1, `array should contain the lead created above`);
    }

    // Capture a known lead id for the get/update/delete cases below.
    const listRes = await get(port, "/api/leads");
    const knownId = JSON.parse(listRes.body)[0].id;

    // Case 4: get an existing lead — expect 200 with the lead
    {
      const { status, body } = await get(port, `/api/leads/${knownId}`);
      assert.strictEqual(status, 200, `expected 200, got ${status}`);
      const lead = JSON.parse(body);
      assert.strictEqual(lead.id, knownId, `id should match the requested id`);
      assert.strictEqual(lead.name, "Alice", `name should still be 'Alice'`);
    }

    // Case 5: get a missing lead — expect 404 with error key
    {
      const { status, body } = await get(port, "/api/leads/99999");
      assert.strictEqual(status, 404, `expected 404, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in response body`);
    }

    // Case 6: update an existing lead — expect 200 with merged fields
    {
      const { status, body } = await request(port, "PATCH", `/api/leads/${knownId}`, {
        status: "contacted",
        notes: "left voicemail",
      });
      assert.strictEqual(status, 200, `expected 200, got ${status}`);
      const lead = JSON.parse(body);
      assert.strictEqual(lead.status, "contacted", `status should be 'contacted'`);
      assert.strictEqual(lead.notes, "left voicemail", `notes should be updated`);
      assert.strictEqual(lead.name, "Alice", `name should be unchanged by patch`);
      assert.strictEqual(lead.id, knownId, `id should be unchanged by patch`);
    }

    // Case 7: update a missing lead — expect 404 with error key
    {
      const { status, body } = await request(port, "PATCH", "/api/leads/99999", { status: "lost" });
      assert.strictEqual(status, 404, `expected 404, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in response body`);
    }

    // Case 8: delete an existing lead — expect 204 with no body
    {
      const { status, body } = await request(port, "DELETE", `/api/leads/${knownId}`);
      assert.strictEqual(status, 204, `expected 204, got ${status}`);
      assert.strictEqual(body, "", `204 response should have an empty body`);
    }

    // Case 9: delete a missing lead — expect 404 with error key
    {
      const { status, body } = await request(port, "DELETE", "/api/leads/99999");
      assert.strictEqual(status, 404, `expected 404, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in response body`);
    }

    // Case 10: unsupported method on /api/leads — expect 405 with Allow header
    {
      const { status, body } = await request(port, "PUT", "/api/leads");
      assert.strictEqual(status, 405, `expected 405, got ${status}`);
      const parsed = JSON.parse(body);
      assert.ok("error" in parsed, `expected "error" key in 405 response body`);
    }

    // Case 11: GET /crm.html — static file served with text/html content-type
    {
      const { status, body } = await get(port, "/crm.html");
      assert.strictEqual(status, 200, `expected 200 for /crm.html, got ${status}`);
      assert.ok(body.includes("CRM Lead Management"), `crm.html should contain page title`);
    }

    console.log("crm.test.js: all assertions passed");
  } finally {
    server.close();
  }
});
