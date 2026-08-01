#!/usr/bin/env bash
# Bootstraps the plugins the ai-company agents depend on.
#
# The ai-company plugin itself ships in this repo (registered via
# .claude-plugin/marketplace.json). Everything below comes from *other*
# marketplaces and has to be fetched separately by anyone who clones this
# repo fresh. Run this once from anywhere:
#
#   ./setup.sh
set -euo pipefail

if ! command -v claude >/dev/null 2>&1; then
  echo "error: 'claude' CLI not found on PATH. Install Claude Code first: https://code.claude.com/docs/en/setup" >&2
  exit 1
fi

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "== Registering this repo as a local marketplace =="
claude plugin marketplace add "$REPO_DIR"

echo "== Adding the ponytail marketplace =="
claude plugin marketplace add DietrichGebert/ponytail

# name@marketplace, one per line. claude-plugins-official is Anthropic's
# official marketplace and doesn't need to be added explicitly.
PLUGINS=(
  "ai-company@ai-company-local"
  "vercel@claude-plugins-official"
  "playwright@claude-plugins-official"
  "greptile@claude-plugins-official"
  "huggingface-skills@claude-plugins-official"
  "adobe-for-creativity@claude-plugins-official"
  "discord@claude-plugins-official"
  "feature-dev@claude-plugins-official"
  "plugin-dev@claude-plugins-official"
  "pr-review-toolkit@claude-plugins-official"
  "agent-sdk-dev@claude-plugins-official"
  "code-review@claude-plugins-official"
  "commit-commands@claude-plugins-official"
  "frontend-design@claude-plugins-official"
  "skill-creator@claude-plugins-official"
  "security-guidance@claude-plugins-official"
  "ralph-loop@claude-plugins-official"
  "explanatory-output-style@claude-plugins-official"
  "learning-output-style@claude-plugins-official"
  "ponytail@ponytail"
)

echo "== Installing plugins =="
for p in "${PLUGINS[@]}"; do
  echo "-- $p"
  claude plugin install "$p" || echo "   (failed to install $p, continuing)"
done

echo
echo "Done. Restart Claude Code (or run /reload-plugins in an existing session) to pick everything up."
echo "Note: discord and adobe-for-creativity need an interactive login on first use — see their own docs."
