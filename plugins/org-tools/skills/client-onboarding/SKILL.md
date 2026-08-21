---
name: client-onboarding
description: Ordered checklist for onboarding a first outside client — contract draft (legal-lead step), then invoice draft + proposed Projects.md row (ops-manager step). Invoked separately by each lead in sequence, never self-orchestrating across them. Draft-only throughout.
---

# Client onboarding

Mission.md names taking on outside client work as a company goal, but
nothing operational exists for it yet. This skill is the checklist for the
first time it happens — split across two separate invocations because
skills run inside one agent's session and `legal-lead` cannot `Task`
`ops-manager` (or vice versa).

## Who invokes this, and when

- **Step 1 (contract draft)** — invoked with `legal-lead`. Saransh, or a
  `product-lead` handoff, triggers this first.
- **Steps 2–3 (invoice draft + proposed `Projects.md` row)** — invoked
  separately with `ops-manager`, after step 1 is done. The basic engagement
  details (client name, scope, rate) must be carried over into this second
  invocation explicitly — either by Saransh relaying them or by
  `product-lead` including them in the handoff. This skill does not persist
  state between the two invocations on its own.

Out of scope entirely: client outreach/pitching (`sales-lead`'s territory,
not invoked here), payment processing, and the decision to take on outside
clients at all — this skill assumes that decision has already been made.

## Step 1 — legal-lead: contract draft

Given client name, scope of work, and rate/terms:
- Draft a client services contract covering scope, deliverables, payment
  terms, IP ownership, and termination — legal-lead's normal contract-draft
  process and disclaimers apply (never final legal advice, never sign-off).
- Output: one draft contract, clearly marked as a draft for Saransh's
  review, same as any other legal-lead deliverable.
- Stop here. Do not draft an invoice or touch `Projects.md` — that's step
  2–3's job, in a separate ops-manager invocation.

## Steps 2–3 — ops-manager: invoice draft + proposed Projects.md row

Given the same client name, scope, and rate (carried over from step 1):

1. **Invoice draft** — a draft invoice for the engagement's first
   milestone/payment, in ops-manager's normal invoice format.
2. **Proposed `Company/Projects.md` row** — draft the row text (project
   name, department(s), status, next action) for this new client
   engagement. Draft text only — do **not** actually write it into
   `Projects.md`; adding a project row is a Tier 2/3 action per
   `AutonomyPolicy.md`, same as any other Projects.md edit.

Output: two drafts (invoice, proposed row text), both clearly marked for
Saransh's review.

## Done-when

Both invocations have run and produced their drafts: one contract draft
(from `legal-lead`) and one invoice draft + one proposed `Projects.md` row
(from `ops-manager`). Nothing is written to the vault, sent to a client, or
invoiced for real — every output here is a draft awaiting Saransh's review.
