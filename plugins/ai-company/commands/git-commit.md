---
description: Stage, classify, and commit/push changes with an auto-generated message and LOC-changed metrics
argument-hint: (optional) context about what changed, e.g. "added CSV export"
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git config:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git rev-parse:*), Read, Write
---

## Context

- Status: !`git status`
- Unstaged + staged diff: !`git diff HEAD`
- Diffstat (for LOC counts): !`git diff --stat HEAD`
- Recent commits (style reference): !`git log --oneline -5`
- Author identity: !`git config user.name` <!`git config user.email`>
- Repo root: !`git rev-parse --show-toplevel`

## Your task

1. **Verify identity.** If `git config user.name` or `user.email` above is
   empty, stop and ask Saransh to set it — never invent or hardcode an
   identity. Otherwise use it as-is; do not change it.

2. **Compute LOC metrics** from the diffstat above: files changed, lines
   added, lines removed. Show this as a short summary first.

3. **Classify the change** from the diff content and any extra context in
   `$ARGUMENTS`:
   - New files / new functions / new routes / new components → `feat:`
   - Changes clustered around error handling, conditionals, or the words
     "fix"/"bug" appear in `$ARGUMENTS` → `fix:`
   - Formatting, config, docs, renames with no behavior change → `chore:`
   - Everything else (tuning, manual tweaks) → a plain descriptive message,
     no forced prefix
   This is a judgment call from reading the diff, not a rigid parser.

4. **Draft the commit message**: one-line Conventional-Commit-style summary
   (prefix from step 3) plus a short body only if the diff spans more than
   one concern. Do **not** add a `Co-Authored-By: Claude` trailer — the
   commit is attributed to the existing git identity only.

5. **Stage, commit, and push** via `git add`, `git commit -m "..."`, and
   `git push`. Each of these is a normal `Bash` call and goes through Claude
   Code's own permission prompt — that prompt IS the approval step. Never
   describe anything as "committed" or "pushed" until the corresponding tool
   call actually ran and succeeded. If push fails or needs `-u`/upstream
   setup, report it rather than force-pushing or guessing at flags.

6. **Log the result.** Once the commit (and push, if it happened) succeeded,
   append one line to `<repo-root>/activity-log.jsonl` if that file already
   exists at the repo root (skip silently if this repo has no such file —
   don't create one in a repo that doesn't already use this convention).
   Match the existing schema and add a `loc` field:
   ```json
   {"ts":"<ISO8601 UTC>","agent":"git-commit-skill","department":"Engineering","project":"<repo dir name>","task":"<the commit summary line>","status":"done","loc":{"files":N,"added":N,"removed":N}}
   ```

$ARGUMENTS
