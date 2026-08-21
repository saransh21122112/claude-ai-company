---
name: status-digest
description: Produce a fixed-format cross-project status digest from Company/Projects.md plus an activity-log rollup — for "what's the status of everything", a periodic check-in, or status-compiler's own compilation step. Formatting/aggregation only, does not replace judgment-based synthesis or write back to the vault.
---

# Status digest

`status-compiler` already compiles cross-project status ad hoc from the
vault, but output varies run to run and doesn't fold in
`activity-log.jsonl`. This skill is the fixed-format layer underneath that:
same inputs, same shape every time, so `status-compiler` (or anyone else)
can call it and then add judgment on top rather than re-deriving the
format each time.

## Inputs

1. `Company/Projects.md` from the vault (via
   `mcp__plugin_ai-company_obsidian__*` if available, otherwise read
   directly off disk at `~/Documents/AI-Company-Vault/Company/Projects.md`
   — note which path was used, same as vault-doctor).
2. `activity-log.jsonl` — the ai-company plugin's log at
   `/Users/saransh/vs code/claude_code_ai_company/plugins/ai-company/activity-log.jsonl`.
   Each line is one JSON object with at least `ts`, `agent`, `task`,
   `status` (`started`/`done`/`blocked`/`handoff`), and usually `project`.
3. A date range for the activity rollup — default **last 7 days** from now
   if the caller doesn't specify one.

## Steps

1. Parse every project row out of `Company/Projects.md` (project name,
   department(s), status, next action).
2. Filter `activity-log.jsonl` to lines within the date range whose `ts`
   parses (skip malformed lines rather than erroring the whole digest).
3. For each project, count activity-log entries whose `project` field
   matches it (case-insensitive substring match, since project names in
   the log aren't always identical strings to the `Projects.md` row) by
   `status`: started / done / blocked / handoff.
4. Entries with no matching project row go in an "unmatched activity"
   bucket at the end — don't silently drop them.

## Output format

```markdown
# Status digest — <date range>

## <Project name>
- Department(s): <from Projects.md>
- Status: <from Projects.md>
- Next action: <from Projects.md>
- Activity (<range>): <N> started, <N> done, <N> blocked, <N> handoff

...one section per project, in Projects.md row order...

## Unmatched activity (<range>)
- <agent> — <task> (<status>, <ts>)  [only if any exist]
```

## What this skill is not

- Not a replacement for `status-compiler`'s own judgment — it hands back
  structured counts and current-state facts; narrative synthesis ("Pulse is
  blocked on pricing, prioritize that next") is still `status-compiler`'s
  job, not this skill's.
- Does not write anything back to `Company/Projects.md` or the vault —
  output is a draft digest for the caller to use or hand to Saransh.
