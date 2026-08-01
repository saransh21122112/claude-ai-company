# Autonomy Policy

Related: [[Company/Mission|Mission]] · [[Company/Priorities|Priorities]] · [[Company/Projects|Projects]]

This defines which decisions an agent can make on its own within a task, and
which ones must always pause and get your explicit go-ahead — so routine
work doesn't need a check-in at every micro-step, but anything with real
consequence still does.

This is a **policy agents follow**, not a technical guardrail — the actual
hard gate is still Claude Code's per-tool-call permission prompts (nothing
here removes or bypasses those). Changing that hard gate (e.g. editing
permission settings, adding auto-approve hooks) is a separate, higher-stakes
change that needs its own direct discussion with you before anything
touches it.

## Tier 1 — Autonomous (no check-in needed mid-task)

Within a single task a department is already working on, these don't need a
pause-and-ask:

- Reading, searching, investigating (any read-only tool use).
- Iterating on a draft multiple times before presenting it (e.g. revising
  copy, refactoring a diff, re-styling a page) — the check-in happens once,
  at the end, with the finished draft.
- Creating/editing files that are clearly draft/deliverable output (new
  project folders, vault notes that are drafts, scratch files) — subject to
  the normal Bash/Edit/Write tool prompts, which still apply every time
  regardless of this policy.
- Small, obviously-scoped fixes explicitly requested (e.g. "fix this typo",
  "rename this variable") — no need to re-confirm the obvious.

## Tier 2 — Notify, then proceed (state it, don't wait for a reply)

State clearly what you're about to do or just did, but don't block on a
reply before continuing the rest of the task:

- Choosing where new work lives (which folder, which existing project) —
  state the choice, keep going.
- Picking a reasonable default (a color scheme, a file name, a rank
  ordering) when the request doesn't specify one and getting it wrong is
  cheap to correct later.

## Tier 3 — Always pause and get explicit approval first

These always require a stop-and-ask, regardless of department, before
proceeding — because they're either irreversible, external-facing, or a
judgment call only you should make:

- Any git commit, push, merge, or force-anything.
- Deleting or overwriting a file/record that isn't obviously disposable
  scratch output.
- Any action that would send, publish, post, or pay something externally.
- Changing `Company/Priorities.md` ranking or `Company/Projects.md` status
  in a way that isn't just "add a row for new work" (e.g. marking something
  `done`, reordering priorities, removing a project).
- Editing Claude Code permission settings, hooks, CLAUDE.md, or this
  plugin's own agent/command definitions as a *side effect* of an unrelated
  task.
- Anything touching real financial, legal, or credential/secrets material.
- Any claim that something is "shipped" — only "ready for your review" is
  ever accurate language until you've actually taken the action.

## Department-specific always-pause triggers

_Fill these in per department as you learn where the general tiers above
aren't specific enough. Starting points, matching the department charters
in `Departments/`:_

- **Engineering / Software Engineering** — schema/breaking changes, anything
  touching secrets/credentials, changing a project's public-facing
  auto-publish behavior.
- **Product** — re-ranking `Priorities.md`, killing/deferring an active
  project.
- **Sales** — anything that could plausibly be mistaken for send-ready
  (subject lines, contact lists), even before a real send integration exists.
- **Operations** — anything resembling a real financial or legal action.
- **Design** — adopting a logo/brand asset as "final" rather than
  placeholder.
- **Data & Analytics** — any number presented as measured fact rather than
  clearly labeled estimate/placeholder.
- **Legal** — never deliver anything as final legal sign-off.
- **Finance** — anything resembling a real financial action.
- **Support** — anything that reads as a live customer-facing send.
- **QA** — no additional trigger beyond the general tiers; it also never
  fixes a bug itself (hands off to Engineering instead).

## Deeper sub-agents

A department agent may delegate a narrow, read-only or otherwise low-risk
slice of its work to a more specialized sub-agent instead of doing
everything itself — e.g. `code-reviewer` under Engineering (reads and
comments only, never edits). A sub-agent inherits this same policy; being
"deeper" in the hierarchy narrows *scope*, it never widens *autonomy* beyond
what's defined here.

#### Cross-plugin tools

Department agents can also use tools from other installed Claude Code
plugins (Vercel, Playwright, Greptile, etc.), not just this vault's own
Obsidian tools. The same tiers above apply, not a separate standard:

- **Tier 1 (autonomous)**: read-only cross-plugin calls — searching docs,
  listing projects/deployments, inspecting logs, navigating/screenshotting a
  page, viewing existing PR comments.
- **Tier 3 (always pause)**: anything a cross-plugin tool does that
  deploys, redeploys, resolves/dismisses a PR comment, or posts/sends —
  same as any other send/publish/change action.

Check each agent's own `tools:` list (in `plugins/ai-company/agents/*.md`)
and its instructions for exactly which cross-plugin tools it holds and how
it's told to treat them — that's the actual source of truth for what a
given agent can reach, this file just states the policy those instructions
should follow.

_This is v1 — calibrate the tier boundaries above as real work exposes where
they're too loose or too strict._
