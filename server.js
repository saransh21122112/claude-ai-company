#!/usr/bin/env node
// Dependency-free local server for agent-graph.html: serves the page and
// exposes GET /api/activity, tailing plugins/ai-company/activity-log.jsonl
// (the file every department agent's own instructions append to). No DB,
// no external service — everything lives in this repo.
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8643;
const ROOT = __dirname;
const LOG_FILE = path.join(ROOT, "plugins/ai-company/activity-log.jsonl");
const PAGE_FILE = path.join(ROOT, "agent-graph.html");

function readActivity(limit) {
  if (!fs.existsSync(LOG_FILE)) return [];
  const lines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean);
  const events = [];
  for (const line of lines.slice(-limit)) {
    try {
      events.push(JSON.parse(line));
    } catch {
      // skip a malformed line rather than fail the whole feed
    }
  }
  return events;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/api/activity") {
    const limit = Number(url.searchParams.get("limit")) || 50;
    const events = readActivity(limit);
    res.writeHead(200, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify({ events }));
    return;
  }

  if (url.pathname === "/" || url.pathname === "/agent-graph.html") {
    fs.readFile(PAGE_FILE, (err, data) => {
      if (err) { res.writeHead(404); res.end("agent-graph.html not found"); return; }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`agent graph: http://localhost:${PORT}`);
  console.log(`reading activity from ${LOG_FILE}`);
});
