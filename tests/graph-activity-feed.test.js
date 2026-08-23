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
const CONCURRENT_AGENTS = ["data-lead", "researcher", "frontend-developer"]; // scenario 4, distinct from REAL_AGENTS above

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

// Genuine concurrent write, not just closely-spaced sync writes: fs.promises
// appendFile goes through libuv's thread pool, so Promise.all-ing several of
// these can actually interleave writes to the same fd rather than the
// single-threaded event loop serializing them for us.
function appendEventAsync(evt) {
  return fs.promises.appendFile(LOG_FILE, JSON.stringify(evt) + "\n");
}

// Returns { agent, status } for the last event per agent, in an events array.
function lastStatusByAgent(events, agents) {
  const out = {};
  for (const agent of agents) {
    const forAgent = events.filter(e => e.agent === agent && e.project === "regression-test");
    out[agent] = forAgent.length ? forAgent[forAgent.length - 1].status : undefined;
  }
  return out;
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

  // ---- Scenario 4: simultaneous agents (overlapping started, none done yet) ----
  console.log("\n=== Scenario 4: 3 agents simultaneously active (data-lead, researcher, frontend-developer) ===");
  const countBeforeS4 = s2Result.events.length;

  // Part 1: fire 3 "started" events concurrently, genuinely in parallel via
  // fs.promises.appendFile + Promise.all (see appendEventAsync above), not
  // sequential-but-close writes.
  const s4StartTs = new Date().toISOString();
  const s4ConcurrentStartTime = Date.now();
  await Promise.all(CONCURRENT_AGENTS.map(agent =>
    appendEventAsync({ ts: s4StartTs, agent, department: "regression", project: "regression-test", task: `graph-activity-feed scenario 4 (${agent})`, status: "started" })
  ));
  const s4ConcurrentLatencyMs = Date.now() - s4ConcurrentStartTime;

  const s4StartResult = await waitForCount(countBeforeS4 + CONCURRENT_AGENTS.length, 5000);
  check("scenario4: all 3 concurrent started events visible via API (none lost)", !s4StartResult.timedOut,
    `expected +${CONCURRENT_AGENTS.length}, got ${s4StartResult.events.length - countBeforeS4}`);

  // Verify no JSONL corruption from the concurrent writes: every line in the
  // raw log file must still parse as one JSON object per line.
  const rawLines = fs.readFileSync(LOG_FILE, "utf8").split("\n").filter(Boolean);
  let corruptLines = 0;
  for (const line of rawLines) {
    try { JSON.parse(line); } catch { corruptLines++; }
  }
  check("scenario4: no corrupted/interleaved lines in activity-log.jsonl after concurrent appends", corruptLines === 0,
    `${corruptLines} unparseable line(s) out of ${rawLines.length}`);

  const s4StartEvents = s4StartResult.events.filter(e => e.project === "regression-test" && e.task && e.task.includes("scenario 4") && e.status === "started");
  const s4AllThreeLanded = CONCURRENT_AGENTS.every(agent => s4StartEvents.some(e => e.agent === agent));
  check("scenario4: each of the 3 agents' started event landed correctly (correct agent id, not lost/swapped)", s4AllThreeLanded,
    JSON.stringify(s4StartEvents.map(e => e.agent)));

  // Part 2: app-logic check (by source inspection, cross-checked against the
  // API-level events above) — activeAgents in agent-graph-layers.html is a
  // `Map` keyed by agent id (declared "const activeAgents = new Map();" at
  // agent-graph-layers.html:721), and renderEvent() does
  // `activeAgents.set(agentNode.id, ...)` / `.delete(agentNode.id)` per event
  // (agent-graph-layers.html:1191-1195) — nothing in that path or in the
  // render/poll loop (agent-graph-layers.html:801-804, keyed iteration over
  // activeAgents.forEach) assumes a single active agent; it iterates the
  // whole Map every poll. With all 3 of CONCURRENT_AGENTS now showing
  // "started" as their latest event and none "done" (confirmed via the API
  // events just fetched), the Map would hold exactly 3 entries simultaneously.
  const s4StatusAfterStart = lastStatusByAgent(s4StartResult.events, CONCURRENT_AGENTS);
  const s4AllStartedNoneDone = CONCURRENT_AGENTS.every(agent => s4StatusAfterStart[agent] === "started");
  check("scenario4: all 3 agents simultaneously in 'started' state per latest API event (Map would hold 3 entries)",
    s4AllStartedNoneDone, JSON.stringify(s4StatusAfterStart));

  // Part 3: resolve out of order — middle-started (researcher) done first,
  // then frontend-developer, then data-lead (first-started) last — and
  // confirm each agent's state clears independently without disturbing the
  // others still active.
  const resolveOrder = ["researcher", "frontend-developer", "data-lead"];
  let countBeforeResolve = s4StartResult.events.length;
  let s4ResolveOk = true;
  const s4ResolveDetail = [];
  for (const agent of resolveOrder) {
    appendEvent({ ts: new Date().toISOString(), agent, department: "regression", project: "regression-test", task: `graph-activity-feed scenario 4 (${agent})`, status: "done" });
    const result = await waitForCount(countBeforeResolve + 1, 5000);
    countBeforeResolve = result.events.length;
    const statuses = lastStatusByAgent(result.events, CONCURRENT_AGENTS);
    const doneAgentOk = statuses[agent] === "done";
    const othersStillStarted = CONCURRENT_AGENTS.filter(a => a !== agent && resolveOrder.indexOf(a) > resolveOrder.indexOf(agent))
      .every(a => statuses[a] === "started");
    const ok = !result.timedOut && doneAgentOk && othersStillStarted;
    s4ResolveDetail.push(`${agent}->done:${ok ? "ok" : "FAIL"}(${JSON.stringify(statuses)})`);
    if (!ok) s4ResolveOk = false;
  }
  check("scenario4: out-of-order resolution — each agent clears independently, others unaffected", s4ResolveOk, s4ResolveDetail.join(" | "));

  // Part 4: measured latency for the concurrent-write path, same style as scenario 3.
  console.log(`Measured concurrent-append (3 parallel fs.promises.appendFile calls) wall time: ${s4ConcurrentLatencyMs}ms`);
  console.log(`Poll interval is ${POLL_INTERVAL_MS}ms; API-visible latency for the concurrent batch was ${s4StartResult.elapsedMs}ms.`);
  check("scenario4: concurrent-write API-visible latency is well under one poll interval", s4StartResult.elapsedMs < POLL_INTERVAL_MS,
    `${s4StartResult.elapsedMs}ms vs ${POLL_INTERVAL_MS}ms interval`);

  console.log(`\n${failures === 0 ? "ALL PASS" : failures + " CHECK(S) FAILED"}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("Test script errored:", err);
  process.exit(2);
});
