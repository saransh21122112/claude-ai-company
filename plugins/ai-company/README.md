# ai-company

An in-house AI company for one person, built as a Claude Code plugin.
Department agents (engineering, research & content, business ops, sales &
marketing, legal, finance, support, QA) draft and deliver work grounded in
company context stored as notes in an Obsidian vault — every action still
goes through Claude Code's normal permission prompts, so nothing happens
without human approval.

`~/.claude/CLAUDE.md` (global) carries a quick-orientation summary of this
whole setup so a new session doesn't start from zero — it's a cache, not
the source of truth; the vault always wins if they disagree, and it should
be updated whenever anything structural here changes.

## Setup (new machine / new user)

This plugin depends on several other Claude Code plugins that live in
separate marketplaces, not in this repo. From the repo root, run:

```
./setup.sh       # macOS / Linux, or Windows via WSL / Git Bash
.\setup.ps1      # Windows PowerShell (no WSL needed)
```

Both do the same thing — pick whichever matches your shell. This registers
this repo as a local marketplace, adds the `ponytail`
marketplace, and installs every plugin the department agents below expect
to have available (Vercel, Playwright, Greptile, Hugging Face, Adobe for
Creativity, Discord, feature-dev, plugin-dev, pr-review-toolkit,
agent-sdk-dev, code-review, commit-commands, frontend-design, skill-creator,
security-guidance, ralph-loop, explanatory/learning output styles,
ponytail). Restart Claude Code (or `/reload-plugins`) afterward. Obsidian
still needs the one-time manual setup described further down — that step
can't be scripted.

## Structure

- `.mcp.json` — connects to the `obsidian` MCP server (the Local REST API
  with MCP community plugin, running inside the Obsidian desktop app) that
  gives agents `mcp__plugin_ai-company_obsidian__*` tools to read/search/
  write vault notes.
- `agents/` — one subagent per department: `eng-lead`, `product-lead`,
  `researcher`, `ops-manager`, `design-lead`, `data-lead`, `sales-lead`,
  `legal-lead`, `finance-lead`, `support-lead`, `qa-lead`. Each reads its
  context from the vault before starting work. Departments can also have
  narrower, deeper sub-agents for low-risk slices of their work — e.g.
  `code-reviewer` (read-only, no Edit/Write/Bash) under Engineering — see
  `Company/AutonomyPolicy.md` for how these relate to autonomy tiers.
  `product-lead`, `ops-manager`, and `qa-lead` also hold the `Task` tool so
  they can hand work directly to another department agent instead of only
  naming it in text.
- `commands/` — `/eng`, `/product`, `/research`, `/ops`, `/design`, `/data`,
  `/sales`, `/legal`, `/finance`, `/support`, `/qa` for direct department
  requests, plus `/company` as a dispatcher for requests that are ambiguous
  or span multiple departments.

## Cross-plugin tools

Several other installed plugins are wired into specific department agents,
not just this plugin's own Obsidian tools:

| Plugin | Wired into | What it's used for | Status |
|---|---|---|---|
| Vercel (official) | `eng-lead`, `data-lead` | search docs, list projects/deployments, inspect logs | Its MCP wildcard technically also exposes `deploy_to_vercel` — treat any deploy call as Tier 3 regardless of what's reachable |
| Playwright | `eng-lead`, `design-lead` | navigate/screenshot/click a built page to actually check it | Read-only usage only |
| Greptile | `code-reviewer` | view/resolve existing PR review comments | Needs `GREPTILE_API_KEY` configured |
| `Skill` tool (generic) | `eng-lead`, `design-lead`, `data-lead`, `researcher`, `sales-lead`, `ops-manager`, `finance-lead`, `support-lead`, `qa-lead` | lets each agent invoke any installed skill, not a curated subset — see each agent's own prompt for which skills it's pointed at | Deliberately withheld from `code-reviewer` and `legal-lead` to keep them narrow by construction |
| Hugging Face Hub | `eng-lead` (models/training/deployment), `data-lead` (dataset stats), `researcher` (papers/model comparisons) | via the `huggingface-skills` skill set + auth MCP tools | Needs login on first use |
| Adobe for Creativity | `design-lead` (asset production), `sales-lead` (social image variations) | via skills + auth MCP tools | Needs login on first use |
| `ralph-loop` | `ops-manager` | proposing (not auto-starting) recurring check-ins | No extra setup |
| Discord | `sales-lead`, `support-lead`, `ops-manager` (tool wildcard granted) | messaging — reading channel/message history | Wildcard also exposes send/post, but that stays Tier 3 (always pause first) per each agent's own prompt; unusable at all until Saransh runs `/discord:access` once to pair a server/channel (manual, can't be scripted) |
| `feature-dev`'s agents | reachable via `eng-lead`'s `Task` tool | codebase exploration/architecture for large changes | No extra setup |
| `plugin-dev`'s agents | reachable via `eng-lead`'s `Task` tool | building/validating another agent, command, or skill for this company | No extra setup |
| `pr-review-toolkit`'s agents | reachable via `eng-lead`'s `Task` tool | `code-reviewer` (Saransh's preferred default for review requests) plus deeper passes — `silent-failure-hunter`, `code-simplifier`, `comment-analyzer`, `pr-test-analyzer`, `type-design-analyzer` | No extra setup. Note: this plugin's `code-reviewer` has no `tools:` restriction of its own (not guaranteed read-only like this company's `code-reviewer`, which is the fallback if it's unreachable) |
| security-guidance, frontend-design, ponytail | — (automatic) | hooks/skill, not called directly by name | Already active regardless of any agent's tool list |
| `code-review`, `commit-commands`, `explanatory-output-style`, `learning-output-style` | — (user-invoked, not agent tools) | slash commands / output styles you run yourself | Installed and enabled, not wired into any agent since they're not autonomously callable |

Same autonomy tiers apply to these as to everything else — see
`Company/AutonomyPolicy.md`'s "Cross-plugin tools" section. Read-only calls
(listing, viewing, screenshotting) are Tier 1 (autonomous); anything that
would deploy, resolve/dismiss, or send/post is Tier 3 (always pause first) —
none of the currently-wired tools can actually do that yet regardless.

## Company vault

The shared context that used to live as plain files inside this plugin now
lives in an Obsidian vault at `~/Documents/AI-Company-Vault`, decoupled from
the plugin package so it survives plugin updates and is browsable/editable
in the Obsidian app itself:

```
AI-Company-Vault/
  Company/
    Mission.md
    Priorities.md
    Projects.md        ← the one actively-updated status board
    AutonomyPolicy.md  ← which decisions are autonomous vs. always pause-and-ask
    Departments/
      Engineering.md
      Product.md
      Research.md
      Operations.md
      Design.md
      Data-Analytics.md
      Sales.md
      Legal.md
      Finance.md
      Support.md
      QA.md
  Research/             ← researcher agent saves finished docs here
  Sales/                ← sales-lead agent saves drafts here
```

Update `Company/Priorities.md` and `Company/Projects.md` (in Obsidian, or by
asking `/ops`) as your actual work changes — agents read these live, so
keeping them current is what makes output relevant instead of generic.

## One-time setup required

This plugin needs the Obsidian app running with the vault open and the
**Local REST API with MCP** community plugin enabled, since Obsidian only
trusts and runs community plugins after an explicit in-app confirmation
(this can't be scripted):

1. Open Obsidian (already installed, vault already created and pointed at
   `~/Documents/AI-Company-Vault`, plugin files already placed).
2. Settings → Community plugins → if prompted, click **"Turn on community
   plugins"**, then confirm **"Local REST API with MCP"** is enabled.
3. Open the plugin's settings tab, copy the generated **API key**.
4. Set it as an environment variable before launching `claude`:
   `export OBSIDIAN_API_KEY="<the key>"` (add to your shell profile so it
   persists).
5. Restart Claude Code so the `obsidian` MCP server in `.mcp.json` picks up
   the key. Run `/mcp` to confirm it's connected.

If Obsidian isn't running or the key isn't set, agents are instructed to say
so explicitly and continue on the request alone rather than failing
silently — the plugin degrades gracefully, it doesn't hard-require Obsidian.

## Usage

```
/company "draft outreach for the new feature and plan the eng work to ship it"
/eng "fix the CSV export bug in Project Atlas"
/product "scope real-time call scoring for Pulse into a brief"
/research "competitor landscape for our clipping tool"
/ops "summarize where all our projects stand"
/design "style the Pulse landing page from the copy draft"
/data "add a net-worth-over-time chart to wealth_Dashboard"
/sales "cold email pitching indie creators"
/legal "draft a terms of service for Pulse"
/finance "draft a rough budget for running Pulse next quarter"
/support "draft a response to a user asking why their export failed"
/qa "write a test plan for the CSV export feature in Project Atlas"
```

## Current constraints

- Real external actions are limited to `git push`/`gh pr create` (via
  `eng-lead`'s existing `Bash` tool) and Discord read/post (via the
  `sales-lead`/`support-lead`/`ops-manager` wildcard grant, unusable until
  `/discord:access` is paired) — both still gated by Claude Code's normal
  Tier-3 permission prompt every single time. No email/CRM/social-posting
  integration exists (no plugin for it is installed). Every other
  department produces drafts/diffs only.
- Supervision relies entirely on Claude Code's default per-tool-call
  permission prompts — no custom hook guardrails yet.
- `Company/AutonomyPolicy.md` reduces how often agents pause to narrate/ask
  *within* a task (e.g. no need to check in after every draft revision), but
  is a policy agents follow, not a technical guardrail — it never removes or
  auto-approves an actual tool-call permission prompt, and it hard-requires
  a stop-and-ask for anything irreversible, external-facing, financial/legal,
  or that changes `Priorities.md`/`Projects.md` ranking/status.

## Phase 3 (future, not built yet)

- Real send/publish integrations once accounts/credentials exist (email —
  no provider chosen yet; CRM; social posting).
- Custom `hooks/hooks.json` guardrails, once there are real external-action
  tools worth guarding.
- Scheduled/cron automation (e.g. a daily research digest written straight
  into the vault) via the `schedule`/`loop` skills.
- Splitting into multiple plugins, if any one department's scope outgrows
  sharing this plugin.
