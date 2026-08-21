---
name: changelog-writer
description: Turn a git commit range into a categorized (feat/fix/chore) draft changelog entry — for "write a changelog for this range", "summarize what shipped since X", or "draft release notes" requests. Draft only, does not write CHANGELOG.md or touch releases/tags.
---

# Changelog writer

`/git-commit` already classifies a single commit's diff into a
feat/fix/chore message. This skill applies that same classification across
a *range* of commits and groups the result into a categorized draft
changelog entry — it does not reimplement classification rules, it reuses
them.

## Steps

1. **Determine the range.**
   - If the user gave an explicit range (`v1.2.0..HEAD`, two commit SHAs, a
     date), use it.
   - Otherwise, look for a `CHANGELOG.md` at the repo root. If one exists
     and its most recent entry references a commit SHA or tag, use that as
     the range start (`<last-entry-ref>..HEAD`).
   - If neither is available, stop and ask for an explicit range — don't
     guess how far back to go.

2. **Gather the commits**: `git log --oneline <range>` for the list, then
   `git show <sha>` or `git diff <range>` per commit (or in bulk) for
   content to classify.

3. **Classify each commit** using the same rules as step 3 of
   `plugins/org-tools/commands/git-commit.md` (new files/functions/routes →
   `feat`, error-handling/bugfix-shaped diffs → `fix`, formatting/config/docs
   → `chore`, everything else → uncategorized/"other"). Read that file
   before classifying — don't redefine the rules here.

4. **Draft the entry**, grouped by category, newest-commit-first within
   each group (most recent work is usually what the reader cares about
   first; use judgment to reorder only when a later commit is clearly a
   fixup/follow-on to an earlier one in the same group):

   ```markdown
   ## <range or date>

   ### Features
   - <one-line summary> (`<short-sha>`)

   ### Fixes
   - <one-line summary> (`<short-sha>`)

   ### Chores
   - <one-line summary> (`<short-sha>`)
   ```

   Merge commits and commits that only touch the changelog itself are
   skipped. If a category is empty, omit its heading. If every commit in
   the range is skipped this way (nothing left to report), say so plainly
   instead of outputting an empty or heading-only entry.

5. **Stop here.** Output the draft entry as text for review. Do not create
   or append to a `CHANGELOG.md`, tag a release, or touch GitHub Releases —
   all three are Tier 3 actions and out of scope for this skill entirely,
   even if a `CHANGELOG.md` already exists to append to. If Saransh wants it
   written to a file, that's a separate `Write`/`Edit` call under the normal
   permission prompt, not something this skill does on its own.
