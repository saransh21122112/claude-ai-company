# Bootstraps the plugins the ai-company agents depend on (Windows/PowerShell).
#
# The ai-company plugin itself ships in this repo (registered via
# .claude-plugin/marketplace.json). Everything below comes from *other*
# marketplaces and has to be fetched separately by anyone who clones this
# repo fresh. Run this once from anywhere:
#
#   .\setup.ps1
#
# macOS/Linux: use ./setup.sh instead.

$ErrorActionPreference = "Stop"

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Error "'claude' CLI not found on PATH. Install Claude Code first: https://code.claude.com/docs/en/setup"
    exit 1
}

$RepoDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "== Registering this repo as a local marketplace =="
claude plugin marketplace add $RepoDir

Write-Host "== Adding the ponytail marketplace =="
claude plugin marketplace add DietrichGebert/ponytail

# name@marketplace, one per entry. claude-plugins-official is Anthropic's
# official marketplace and doesn't need to be added explicitly.
$Plugins = @(
    "ai-company@ai-company-local",
    "vercel@claude-plugins-official",
    "playwright@claude-plugins-official",
    "greptile@claude-plugins-official",
    "huggingface-skills@claude-plugins-official",
    "adobe-for-creativity@claude-plugins-official",
    "discord@claude-plugins-official",
    "feature-dev@claude-plugins-official",
    "plugin-dev@claude-plugins-official",
    "pr-review-toolkit@claude-plugins-official",
    "agent-sdk-dev@claude-plugins-official",
    "code-review@claude-plugins-official",
    "commit-commands@claude-plugins-official",
    "frontend-design@claude-plugins-official",
    "skill-creator@claude-plugins-official",
    "security-guidance@claude-plugins-official",
    "ralph-loop@claude-plugins-official",
    "explanatory-output-style@claude-plugins-official",
    "learning-output-style@claude-plugins-official",
    "ponytail@ponytail"
)

Write-Host "== Installing plugins =="
foreach ($p in $Plugins) {
    Write-Host "-- $p"
    try {
        claude plugin install $p
    } catch {
        Write-Warning "   (failed to install $p, continuing)"
    }
}

Write-Host ""
Write-Host "Done. Restart Claude Code (or run /reload-plugins in an existing session) to pick everything up."
Write-Host "Note: discord and adobe-for-creativity need an interactive login on first use - see their own docs."
