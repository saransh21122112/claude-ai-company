#!/usr/bin/env node
// Mechanical fallback for the live agent-graph.html activity feed.
//
// Department agents are *told*, in their own prompt, to log a "started"/
// "done" line to activity-log.jsonl — but that depends on the agent
// actually remembering to do it, which has proven unreliable (a real
// eng-lead run skipped it entirely despite a mid-task reminder). This hook
// fires on SubagentStart/SubagentStop regardless of what the agent's own
// prompt does, so the graph always shows at least a start/stop breadcrumb.
// It does not replace the agent's own richer logging (task text, "blocked",
// "handoff" with a target) — those need the agent's own judgment. This is
// just the safety net under it.
"use strict";
const fs = require("fs");
const path = require("path");

const LOG_FILE = path.join(__dirname, "..", "activity-log.jsonl");

// Only the department-agent ids that actually exist as nodes in
// agent-graph.html — anything else (Explore, Plan, general-purpose, etc.)
// is silently ignored rather than polluting the log.
const KNOWN_AGENTS = new Set([
  "eng-lead", "product-lead", "researcher", "ops-manager", "design-lead",
  "data-lead", "sales-lead", "legal-lead", "finance-lead", "support-lead",
  "qa-lead", "swe-lead", "code-reviewer", "frontend-developer",
  "backend-developer", "ui-ux-designer",
  "spec-reviewer", "fact-checker", "status-compiler", "design-reviewer",
  "metrics-auditor", "prospect-researcher", "contract-reviewer",
  "expense-auditor", "faq-writer", "test-runner",
]);

let raw = "";
process.stdin.on("data", (chunk) => { raw += chunk; });
process.stdin.on("end", () => {
  try {
    const input = JSON.parse(raw || "{}");
    const agentType = input.agent_type || "";
    const agentId = agentType.includes(":") ? agentType.split(":").pop() : agentType;
    if (!KNOWN_AGENTS.has(agentId)) return;

    const isStop = input.hook_event_name === "SubagentStop";
    const summary = String(input.last_assistant_message || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    const line = {
      ts: new Date().toISOString(),
      agent: agentId,
      task: isStop ? (summary || "(auto) session ended") : "(auto) session started",
      status: isStop ? "done" : "started",
      auto: true, // marks this as a hook-generated fallback, not the agent's own narration
    };
    fs.appendFileSync(LOG_FILE, JSON.stringify(line) + "\n");
  } catch {
    // A logging nicety should never break the agent session it's watching.
  }
});
