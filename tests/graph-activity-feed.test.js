#!/usr/bin/env node
// Regression test for the live activity-feed wiring behind the agent-roster
// graphs (agent-graph-layers.html in particular). Dependency-free, matching
// server.js's own "no DB, no external service" convention — no Playwright
// npm package is installed in this repo, so this script exercises the same
// wiring the page's poll() function drives (server.js tailing
// plugins/ai-company/activity-log.jsonl, exposed at GET /api/activity) at
// the HTTP/log layer rather than through a real browser. DOM-level checks
// (node pulse state, click-to-pin detail panel) were verified once via the
// Playwright MCP tool interactively — see the qa-lead report for that run;
// re-adding that as an automated leg here would mean installing a browser
// automation dependency into a repo that deliberately has none, so it's
// left as a documented gap (search this repo's activity-log.jsonl reports
// for "graph-activity-feed" to find the manual run notes).
//
// Run: node tests/graph-activity-feed.test.js
// Requires: node server.js already running (defaults to :8643; override
// with GRAPH_SERVER env var).
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const LOG_FILE = path.join(ROOT, "plugins/ai-company/activity-log.jsonl");
const SERVER = process.env.GRAPH_SERVER || "http://localhost:8643";
const POLL_INTERVAL_MS = 2000; // matches setInterval(poll, 2000) in agent-graph-layers.html

const REAL_AGENTS = ["eng-lead", "qa-lead", "legal-lead"]; // real node ids in the graph

let failures = 0;
function check(label, cond, detail) {
  const mark = cond ? "PASS" : "FAIL";
  console.log(`[${mark}] ${label}${detail ? " — " + detail : ""}`);
  if (!cond) failures++;
  return cond;
}

function appendEvent(evt) {
  fs.appendFileSync(LOG_FILE, JSON.stringify(evt) + "\n");
}

async function fetchActivity(limit) {
  const res = await fetch(`${SERVER}/api/activity?limit=${limit}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET /api/activity -> ${res.status}`);
  const data = await res.json();
  return data.events || [];
}

// Poll until the API reflects `expectedCount` new events (or timeout), same
// polling shape the page itself uses, so this doubles as the real
// end-to-end latency measurement for "last activity" showing up.
async function waitForCount(minCount, timeoutMs) {
  const start = Date.now();
  for (;;) {
    const events = await fetchActivity(500);
    if (events.length >= minCount) return { events, elapsedMs: Date.now() - start };
    if (Date.now() - start > timeoutMs) return { events, elapsedMs: Date.now() - start, timedOut: true };
    await new Promise(r => setTimeout(r, 50));
  }
}

async function main() {
  if (!fs.existsSync(LOG_FILE)) {
    console.error(`Log file not found: ${LOG_FILE}`);
    process.exit(2);
  }

  const baseline = await fetchActivity(100000);
  const baselineCount = baseline.length;
  console.log(`Baseline: ${baselineCount} events already in log/API.\n`);

  // ---- Scenario 1: single-agent started -> done ----
  console.log("=== Scenario 1: single agent (eng-lead) started -> done ===");
  const s1Agent = "eng-lead";
  const s1StartedAt = new Date().toISOString();
  appendEvent({ ts: s1StartedAt, agent: s1Agent, department: "Engineering", project: "regression-test", task: "graph-activity-feed scenario 1", status: "started" });
  const s1StartResult = await waitForCount(baselineCount + 1, 5000);
  const s1StartLatencyMs = s1StartResult.elapsedMs;
  check("scenario1: started event visible via API", !s1StartResult.timedOut, `latency ${s1StartLatencyMs}ms`);

  await new Promise(r => setTimeout(r, 300)); // "shortly after", per the task spec
  const s1DoneAt = new Date().toISOString();
  const doneAppendStart = Date.now();
  appendEvent({ ts: s1DoneAt, agent: s1Agent, department: "Engineering", project: "regression-test", task: "graph-activity-feed scenario 1", status: "done" });
  const s1DoneResult = await waitForCount(baselineCount + 2, 5000);
  const s1DoneLatencyMs = Date.now() - doneAppendStart;
  check("scenario1: done event visible via API", !s1DoneResult.timedOut, `latency ${s1DoneLatencyMs}ms`);

  const s1Tail = s1DoneResult.events.slice(-2);
  check("scenario1: started then done, in order, same agent",
    s1Tail.length === 2 && s1Tail[0].status === "started" && s1Tail[0].agent === s1Agent &&
    s1Tail[1].status === "done" && s1Tail[1].agent === s1Agent);

  // ---- Scenario 2: 3 agents, sequential started -> done pairs ----
  console.log("\n=== Scenario 2: 3 agents in sequence (eng-lead, qa-lead, legal-lead) ===");
  const s2ExpectedOrder = [];
  let countBeforeS2 = s1DoneResult.events.length;
  for (const agent of REAL_AGENTS) {
    appendEvent({ ts: new Date().toISOString(), agent, department: "regression", project: "regression-test", task: `graph-activity-feed scenario 2 (${agent})`, status: "started" });
    s2ExpectedOrder.push({ agent, status: "started" });
    await new Promise(r => setTimeout(r, 150));
    appendEvent({ ts: new Date().toISOString(), agent, department: "regression", project: "regression-test", task: `graph-activity-feed scenario 2 (${agent})`, status: "done" });
    s2ExpectedOrder.push({ agent, status: "done" });
    await new Promise(r => setTimeout(r, 150));
  }
  const s2Result = await waitForCount(countBeforeS2 + s2ExpectedOrder.length, 5000);
  check("scenario2: all 6 events visible via API (none dropped)", !s2Result.timedOut,
    `expected ${countBeforeS2 + s2ExpectedOrder.length}, got ${s2Result.events.length}`);

  const s2Tail = s2Result.events.slice(-s2ExpectedOrder.length);
  const s2OrderOk = s2Tail.length === s2ExpectedOrder.length &&
    s2Tail.every((evt, i) => evt.agent === s2ExpectedOrder[i].agent && evt.status === s2ExpectedOrder[i].status);
  check("scenario2: order preserved exactly (no reordering/overwrite)", s2OrderOk,
    s2OrderOk ? "" : JSON.stringify(s2Tail.map(e => `${e.agent}:${e.status}`)));

  // per-agent state-transition sanity: for each agent, its own started/done
  // pair should not have another agent's event interleaved *between* them
  // in a way that would leak active-state (each pair is adjacent above, so
  // this just re-confirms grouping).
  let noLeak = true;
  for (let i = 0; i < REAL_AGENTS.length; i++) {
    const pair = s2Tail.slice(i * 2, i * 2 + 2);
    if (!(pair[0].agent === REAL_AGENTS[i] && pair[1].agent === REAL_AGENTS[i])) noLeak = false;
  }
  check("scenario2: no cross-agent state leakage (each agent's pair stays grouped)", noLeak);

  // ---- Scenario 3: measured "last activity" latency vs poll interval ----
  console.log("\n=== Scenario 3: measured latency vs poll interval ===");
  console.log(`Poll interval found in agent-graph-layers.html (setInterval(poll, 2000)): ${POLL_INTERVAL_MS}ms`);
  console.log(`Measured log-append -> API-visible latency: started=${s1StartLatencyMs}ms, done=${s1DoneLatencyMs}ms`);
  console.log(`This is the server-side (file tail -> HTTP response) latency only. The page`);
  console.log(`itself only re-fetches every ${POLL_INTERVAL_MS}ms, so real on-screen latency for a`);
  console.log(`browser tab is this value PLUS up to ${POLL_INTERVAL_MS}ms of poll wait (average`);
  console.log(`~${POLL_INTERVAL_MS / 2}ms, worst case ~${POLL_INTERVAL_MS}ms) — not instant. See qa-lead's report for a`);
  console.log(`directly-measured browser-visible latency from one live Playwright run.`);
  check("scenario3: API-level latency is well under one poll interval", s1StartLatencyMs < POLL_INTERVAL_MS && s1DoneLatencyMs < POLL_INTERVAL_MS,
    `started=${s1StartLatencyMs}ms done=${s1DoneLatencyMs}ms vs ${POLL_INTERVAL_MS}ms interval`);

  console.log(`\n${failures === 0 ? "ALL PASS" : failures + " CHECK(S) FAILED"}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("Test script errored:", err);
  process.exit(2);
});
