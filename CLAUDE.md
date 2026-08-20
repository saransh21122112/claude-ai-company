# Saransh's AI Company — orientation for every new session

This file is a quick-orientation cache so a fresh Claude Code session
doesn't start from zero. **It is not the source of truth** — the Obsidian
vault at `~/Documents/AI-Company-Vault` is. If anything here conflicts with
the vault, the vault wins; update this file to match, don't trust this file
over it.

## What this is

An in-house AI company for one person (Saransh), built as a Claude Code
plugin (`ai-company`, installed from the local marketplace at
`/Users/saransh/vs code/claude_code_ai_company`). Department agents draft
and deliver work grounded in company context stored as Obsidian vault notes.
Core value: **draft, don't act** — every department produces work for human
review; nothing is sent/published/committed/deployed on an agent's own
authority.

## Source of truth (read these first, via `mcp__plugin_ai-company_obsidian__*`)

- `Company/Mission.md` — what the company is, values, department list
- `Company/Priorities.md` — ranked current priorities
- `Company/Projects.md` — **the actively-updated status board**, one row per
  tracked project, department(s), status, next action
- `Company/AutonomyPolicy.md` — which decisions agents make autonomously
  (Tier 1), narrate-then-proceed (Tier 2), or always pause for explicit
  approval first (Tier 3 — commits/pushes, deletes, anything
  send/publish/pay externally, re-ranking Priorities/Projects, credentials,
  claiming something is "shipped"). Also documents the live activity log
  convention (see below) and which cross-plugin tools are wired in where.
- `Company/Departments/*.md` — one charter per department (Engineering,
  Product, Research, Operations, Design, Data & Analytics, Sales), each with
  Scope/Conventions/Definition-of-done/Standing-constraints/Autonomy
  sections, cross-linked to each other and to Mission/Priorities/Projects
  for Obsidian's graph view.

## Department agents & commands (`plugins/ai-company/`)

Agents: `eng-lead`, `product-lead`, `researcher`, `ops-manager`,
`design-lead`, `data-lead`, `sales-lead`, `legal-lead`, `finance-lead`,
`support-lead`, `qa-lead`, plus a narrower read-only sub-agent
`code-reviewer` (Engineering). `eng-lead` can also delegate via `Task` to
`feature-dev`, `plugin-dev`, and `pr-review-toolkit`'s agents
(`pr-review-toolkit`'s own `code-reviewer` is Saransh's preferred default
for review requests — see `eng-lead.md`). `qa-lead` holds `Task` to hand
bugs it finds back to `eng-lead` rather than fixing them itself.
`product-lead` and `ops-manager` also hold `Task`, to delegate directly to
another department agent instead of only naming it in text.

**Software Engineering (2026-08-01 addition, separate department from
Engineering):** `swe-lead` owns `frontend-developer`, `backend-developer`,
and `ui-ux-designer` as `Task`-delegated specialists — role-shaped
implementation/design work, distinct from `eng-lead`'s general
build/review/triage remit and `design-lead`'s company-wide visual/brand
scope. Charter at `Company/Departments/SoftwareEngineering.md`.

**One sub-agent per remaining lead (2026-08-04 addition):** the other 10
leads now each own exactly one `Task`-delegated specialist, same
one-level-deeper pattern as `swe-lead`/`eng-lead`: `product-lead` →
`spec-reviewer` (pre-handoff brief completeness check), `researcher` →
`fact-checker` (citation/claim verification on finished drafts),
`ops-manager` → `status-compiler` (cross-project status digest),
`design-lead` → `design-reviewer` (read-only visual/UX/accessibility
audit), `data-lead` → `metrics-auditor` (read-only dashboard/metric
correctness check), `sales-lead` → `prospect-researcher` (prospect
research/qualification), `legal-lead` → `contract-reviewer` (read-only
contract risk-flagging, never sign-off), `finance-lead` →
`expense-auditor` (read-only expense/financial-draft consistency check),
`support-lead` → `faq-writer` (FAQ knowledge-base content, no customer
contact), `qa-lead` → `test-runner` (executes existing test suites,
doesn't author new ones). All 10 leads gained the `Task` tool if they
didn't already have it (`product-lead`/`ops-manager`/`qa-lead` already
did; the other seven are newly granted). Every new sub-agent is
read-only-by-construction or execution-only as noted, with no `Task` and
no `Skill` tool of its own — scope narrows, autonomy never widens, same
rule as `code-reviewer`/`frontend-developer`/`backend-developer`/
`ui-ux-designer`. Reachable only via `Task` delegation, no dedicated
`/command`, same as those four.

Commands: `/eng`, `/product`, `/research`, `/ops`, `/design`, `/data`,
`/sales`, `/legal`, `/finance`, `/support`, `/qa`, `/swe` (direct department
routing), `/company` (dispatcher for ambiguous/cross-department requests).

**`/git-commit` (2026-08-21 addition):** standalone command, not
department-routed — stages changes, computes a LOC-changed summary from
`git diff --stat`, infers a Conventional-Commit-style message
(feat/fix/chore) from the diff, commits under whatever `git config
user.name`/`user.email` is already set (never overridden), and pushes. No
`Co-Authored-By: Claude` trailer on these commits — attribution is the
existing git identity only. `git add`/`commit`/`push` still go through
Claude Code's normal permission prompts (Tier 3, per `AutonomyPolicy.md` —
"any git commit, push, merge, or force-anything" always pauses for
approval); the command narrating a draft message is not itself the
approval. On success it appends a line (with a new `loc: {files, added,
removed}` field) to that repo's `activity-log.jsonl` if one already exists
at the repo root — skips silently otherwise, doesn't create the file in
repos that don't already use this convention.

## Cross-plugin tools already wired in

- `eng-lead`: Vercel MCP (read-only), Playwright, `Task` (→ `code-reviewer`,
  `feature-dev`, `plugin-dev`, `pr-review-toolkit` agents), `Skill` +
  Hugging Face Hub auth (ML/model/training work via `huggingface-skills`)
- `design-lead`: Playwright, `Skill` + Adobe for Creativity auth (asset
  production: photo batch-edit, PDF-from-data, social image variations,
  template design, quick video cuts, resize, retouch); `frontend-design`
  skill for aesthetic direction
- `data-lead`: Vercel MCP, `Skill` (Hugging Face dataset-viewer skills for
  external dataset stats)
- `researcher`: `Skill` (`huggingface-papers`, `huggingface-best` for
  AI/ML research questions)
- `sales-lead`: `Skill` (Adobe `adobe-create-social-variations` for
  marketing image assets)
- `ops-manager`: `Skill` (`ralph-loop` for proposing recurring check-ins —
  propose, don't auto-start one)
- `code-reviewer`: Greptile (needs `GREPTILE_API_KEY`, not yet configured).
  Deliberately has no `Skill` tool — it stays read-only by construction and
  granting `Skill` would break that guarantee.
- Most non-review department agents were granted the generic `Skill` tool
  (2026-07-29, extended to `finance-lead`/`support-lead`/`qa-lead` when
  added), which exposes every installed skill, not a curated subset —
  there's no per-skill grant mechanism today. Each agent's own instructions
  reiterate that a skill is a bundle of instructions, not an autonomy
  bypass: anything a skill does that would deploy, publish, push, pay, or
  send externally is still Tier 3 per `AutonomyPolicy.md`. `legal-lead`
  deliberately has no `Skill` tool, same reasoning as `code-reviewer`.
- Discord (`discord:access`, `discord:configure`) is installed and its
  tool wildcard is now granted to `sales-lead`, `support-lead`, and
  `ops-manager` — but it has no usable MCP tool names until it's actually
  paired via `/discord:access` (manual, one-time, can't be scripted).
  Read (list/read channels & messages) is Tier 1 once paired; send/post is
  Tier 3, enforced by each agent's own prompt rather than tool scoping —
  same known-gap pattern as the Vercel `deploy_to_vercel` wildcard below.
- `ponytail` is a hooks-based coding-style enforcer (YAGNI/minimal-diff),
  not something wired per-agent — it applies session-wide via hooks, same
  as any other installed hook plugin.
- Known and *not yet re-addressed*: `eng-lead` and `data-lead` hold
  `mcp__plugin_vercel_vercel__*` as a wildcard, which as of this plugin
  version includes a real `deploy_to_vercel` tool — despite both agents'
  own prompts still saying deploy isn't reachable via the MCP. Saransh was
  asked and chose to leave this as-is for now; it is a live gap between
  the documented Tier-3 deploy policy and actual tool access, worth
  revisiting deliberately rather than assuming the prompt text is a real
  guardrail.
- `hookify` and `ralph-wiggum` plugin installs were **blocked by Claude
  Code's own auto-mode classifier** when attempted — don't retry without
  Saransh explicitly asking again, and treat that as a real signal, not
  just caution. (`ralph-loop` is a different plugin and installed fine —
  don't confuse the two.)

## Standing side-projects (all under `~/Projects/`, never inside the plugin repo)

- `pulse-website/` — Pulse (AI sales call copilot) landing page draft
- `company-tools/` — `deployment-status.sh` (read-only Vercel/Render check)
  + `.env` with real credentials (Vercel, Render, Turso, Voyage, YouTube
    refresh token — gitignored, **never** copy these into the vault or the
    plugin repo). Slack/GitHub/Microsoft creds given so far are OAuth *app*
    secrets, not usable access tokens — see that folder's README for what's
    actually needed to enable those for real.
- `company-graph/` — constellation-style live visualization of company
  structure, all 11 department agents as their own nodes, live task
  activity (who's working on what, agent-to-agent handoffs), plus a
  `dashboard.html` roster/timeline view. `api/graph.js`/`api/activity.js`
  hold the actual API logic (Turso/libSQL), written Vercel-Serverless-style
  but framework-agnostic. **Primary way to run it (2026-07-29): Docker
  Desktop** — `cd ~/Projects/company-graph && docker compose up --build -d`,
  open `http://localhost:8642`. `server.js` is a small dependency-free Node
  HTTP server (Docker's entrypoint) that reuses `api/graph.js`/
  `api/activity.js` unchanged via a small req/res shim — same Turso DB as
  Vercel, so it's genuinely live without any redeploy dependency. Needs a
  local `~/Projects/company-graph/.env` with just `TURSO_DATABASE_URL` +
  `TURSO_AUTH_TOKEN` (gitignored). Also still deployed to Vercel at
  `company-graph-delta.vercel.app` (confirmed live 2026-07-29) —
  `log-activity.sh` posts there by default regardless of which frontend
  you're viewing, since both read/write the same Turso DB.
  `graph-data.json`/`activity-log.jsonl` remain as static fallbacks for
  when neither Docker nor Vercel's API is reachable (e.g. plain
  `python3 -m http.server`). Log activity via `./log-activity.sh <agent>
  <department> <project> "<task>" <started|in-progress|done|blocked|handoff>
  ["<detail>"]` — for `handoff`, `<detail>` must start `to:<target-agent-id>`
  so the graph draws an agent-to-agent edge. A Vercel `--prod` redeploy
  (to pick up newer frontend code) has repeatedly been blocked by Claude
  Code's own permission classifier from agent sessions — that's why Docker
  became primary; `company-graph-ten.vercel.app` is a dead deployment
  (`DEPLOYMENT_NOT_FOUND`), ignore it. Separately: the dashboard staying
  empty of *new* activity is mostly a usage gap, not a bug —
  `log-activity.sh` only fires when a department agent is actually invoked
  (via `/eng`, `/product`, etc.); a top-level session doing work directly
  logs nothing, by design.

## Standing constraints (apply to every agent, every session)

- Never commit, push, merge, or deploy externally without explicit human
  action in that specific moment — a completed diff/build is "ready for
  your review", never "shipped"/"deployed".
- Never write live credentials into the vault or the `ai-company` plugin
  repo — they belong in the relevant project's own gitignored `.env`.
- New standalone work gets its own folder under `~/Projects/<slug>/` — never
  into `claude_code_ai_company`/`plugins/` (that's the company's own
  tooling, not a deliverable's home).
- If Claude Code's own permission system blocks an action outright, don't
  work around it — stop and explain to Saransh, let him decide.

## Keeping this file current

This file should be a living summary, not a one-time snapshot — whichever
agent/session makes a structural change (new department, new standing
project, new cross-plugin tool wired in, a constraint that changed) should
update this file too, the same way it would update `Company/Projects.md`.
If this file and the vault ever disagree, fix this file to match the vault,
not the other way around.
