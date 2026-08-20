---
name: presentation-builder
description: Build an organization-branded slide deck (presentation) as a multi-slide HTML Artifact — for status updates, pitch decks, briefings, or any "make me a presentation on X" request from a department agent.
---

# Presentation builder

Builds a slide deck as a single self-contained HTML file, one `<section>`
per slide, published via the `Artifact` tool. This is the shared, reusable
way any department agent produces a presentation — don't hand-roll a
one-off HTML deck outside this skill.

## Before writing any slide

1. Load the `artifact-design` skill first — it governs layout, typography,
   and light/dark theming for the deck the same way it would for any other
   artifact. Don't skip this because "it's just slides."
2. If the deck includes a diagram, chart, or process flow, also load
   `artifact-diagramming` (diagrams) or `dataviz` (charts/metrics) before
   drawing it — reuse those skills' guidance rather than inventing ad hoc
   chart/diagram styling here.
3. Pull the company name, mission framing, and tone from
   `Company/Mission.md` in the Obsidian vault (via
   `mcp__plugin_ai-company_obsidian__*`) when the deck is company-facing —
   don't invent branding language.

## Structure

- One HTML file, one `<section class="slide">` per slide, each sized to
  fill the viewport (`min-height: 100vh` or a fixed aspect-ratio box) so
  the deck reads as discrete slides, not a scrolling doc.
- A slide counter or simple nav (arrow keys / click zones via a small
  inline `<script>`) is a reasonable, low-effort addition — don't build a
  full presenter-mode/speaker-notes system unless asked.
- Keep total slide count matched to the request — a "quick status update"
  deck is 3-6 slides, a "pitch deck" is typically 8-12. Ask if the scope is
  genuinely unclear rather than guessing at a large deck.

## Publish

Call `Artifact` on the finished HTML file, same as any other artifact:
pick a distinctive `title` (the deck's subject, not "Presentation"), a
one-line `description`, and a favicon emoji matching the deck's topic.
Redeploy (same file path) if the user asks for revisions rather than
publishing a second copy.

## What this skill is not

Not a tool for exporting an actual `.pptx`/`.key` file — the output is a
viewable, shareable HTML deck. If the requester specifically needs a native
PowerPoint/Keynote file to edit offline, say so up front rather than
delivering an HTML deck and calling it done.
