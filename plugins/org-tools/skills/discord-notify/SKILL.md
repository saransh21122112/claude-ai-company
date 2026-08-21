---
name: discord-notify
description: Post an already-drafted message to a paired Discord channel via the Discord MCP tools — for sales-lead, support-lead, or ops-manager sending an approved notification. Does not draft content, and always confirms with Saransh immediately before the send call since posting externally is Tier 3.
---

# Discord notify

A thin wrapper around the `mcp__plugin_discord_discord__*` tools, granted to
`sales-lead`, `support-lead`, and `ops-manager`. This skill covers the
mechanics of *posting an already-approved message* — it never originates
message content itself.

## Preconditions

1. **A channel must already be paired.** Pairing happens once, manually, by
   Saransh running `/discord:access` — it cannot be scripted or triggered
   by this skill. If no `mcp__plugin_discord_discord__*` tools resolve to a
   real paired server/channel, stop and say so: this skill is buildable and
   reviewable before pairing, but cannot actually send until pairing has
   happened.
2. **The message must already be drafted and approved**, not authored here.
   If handed only a topic/intent rather than finished text, stop and ask
   the calling agent (`sales-lead`/`support-lead`/`ops-manager`) to draft
   the message first — drafting is that agent's job, not this skill's.

## Steps

1. Confirm the target channel (paired channel name/ID) and the exact
   message text to send.
2. **Always ask Saransh to explicitly confirm the send, immediately before
   calling the send tool** — every single time, even if a similar message
   was approved moments ago in the same session. Posting to Discord is
   Tier 3 per `Company/AutonomyPolicy.md`; a onetime "draft it and send
   automatically going forward" instruction does not stand in for this
   confirmation. Show the exact text and destination channel in the
   confirmation ask, not a paraphrase.
3. Only after explicit confirmation, call the appropriate
   `mcp__plugin_discord_discord__*` send tool with the confirmed text and
   channel.
4. Report the result (sent / failed with error) back to the calling agent
   — never describe a message as sent unless the tool call actually
   succeeded.

## What this skill is not

- Not a content drafter — outreach copy, support replies, and status
  announcements are each drafted by the calling agent using its own normal
  process; this skill only handles the send mechanic.
- Not a scheduler or recurring-post tool — one confirmed message per
  invocation.

## Status

Buildable and reviewable now. **Cannot be end-to-end verified** until
Saransh runs `/discord:access` to pair a real channel — treat "skill
drafted and wired for the three agents" and "a real send verified against
a live channel" as two separate milestones; don't report the second as done
until it's actually been exercised against a paired channel.
