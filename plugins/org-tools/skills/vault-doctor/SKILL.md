---
name: vault-doctor
description: Cross-check the Obsidian vault (source of truth) against the two CLAUDE.md orientation caches and report drift — for "check CLAUDE.md is in sync with the vault", "has anything drifted", or a periodic vault/CLAUDE.md health check. Report only, no edits, takes no arguments.
---

# Vault doctor

The vault (`~/Documents/AI-Company-Vault/Company/`) is the source of truth.
Both `~/.claude/CLAUDE.md` (global) and
`/Users/saransh/vs code/claude_code_ai_company/CLAUDE.md` (repo-checked-in)
are supposed to be living summaries of it, kept current by whichever
session last made a structural change. Nothing checks that automatically —
this skill is that check. It reports drift, it never fixes it.

## Sources to read

1. Vault: `Company/Mission.md`, `Company/Priorities.md`, `Company/Projects.md`,
   `Company/AutonomyPolicy.md`, and every file under `Company/Departments/`.
   Prefer `mcp__plugin_ai-company_obsidian__*` (get/search/list) if
   available. **If those MCP tools are unavailable** (server not running,
   no API key), say so explicitly in the report's header and fall back to
   reading the vault directly off disk at `~/Documents/AI-Company-Vault/Company/`
   — don't fail silently either way; note which path was actually used.
2. `~/.claude/CLAUDE.md`
3. `/Users/saransh/vs code/claude_code_ai_company/CLAUDE.md`

## What to check

Read all three, then classify each notable claim/section into one of:

- **Vault-only** — a department, project, policy, or standing fact exists
  in the vault but neither CLAUDE.md mentions it at all.
- **CLAUDE-only** — either CLAUDE.md describes an agent, tool grant,
  project, or convention that has no corresponding trace in the vault (e.g.
  it names a department/project the vault doesn't know about).
- **Contradicting claim** — same topic appears in more than one source but
  the facts disagree (status of a project, which tools an agent holds,
  a policy tier, a file path, a "done" date). Quote the conflicting lines
  from each source side by side.

Scope this to substance, not prose style — a differently-worded summary of
the same fact is not drift; a different fact is. Two CLAUDE.md files
disagreeing *with each other* (not just with the vault) is also worth its
own line, since the file-comparison note at the top of each says "the vault
wins, update this file to match" — if they diverge from each other that's
itself a signal one is stale.

## Report format

```markdown
# Vault-doctor report — <date>

Vault source: <obsidian MCP | direct filesystem read, and why>

## Vault-only (missing from both CLAUDE.md files)
- <item> — <one-line vault citation>

## CLAUDE-only (no trace in the vault)
- <item> — <which CLAUDE.md, one-line quote>

## Contradicting claims
- <topic>: vault says "<...>" / global CLAUDE.md says "<...>" / repo CLAUDE.md says "<...>"

## Clean
No drift found in: <list the sections that matched cleanly>, if any.
```

If a category is empty, keep its heading with "None found." — don't omit
it, since an empty category is itself useful signal that nothing there
needs Saransh's attention.

## What this skill does not do

- Does not edit either CLAUDE.md or any vault note — output is a report
  only, for Saransh (or the agent that invoked it) to act on.
- Does not fact-check claims against live system state (e.g. it won't go
  verify a tool grant actually works) — only cross-document consistency
  between these three sources.
- Takes no arguments — it always reads all three sources in full; there's
  no partial/single-department mode.
