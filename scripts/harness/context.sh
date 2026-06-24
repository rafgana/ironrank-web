#!/usr/bin/env bash
# context.sh — dump project state for the agent
# Output: project structure, key files, recent commits, harness state

set -euo pipefail
cd "$(dirname "$0")/../.."

echo "=== harness/context ==="
echo
echo "## Project tree (src/)"
ls -la src/ 2>/dev/null | head -20
echo
echo "## Pages (lazy-loaded)"
ls src/pages/ 2>/dev/null
echo
echo "## Key files"
for f in AGENTS.md HARNESS.md package.json tsconfig.json vite.config.ts public/sitemap.xml public/robots.txt; do
  if [[ -f "$f" ]]; then
    echo "  ✓ $f ($(wc -l < "$f") lines)"
  else
    echo "  ✗ $f (missing)"
  fi
done
echo
echo "## Recent commits (last 10)"
git log --oneline -10 2>/dev/null || echo "  (not a git repo)"
echo
echo "## Harness state"
if [[ -d .harness ]]; then
  for f in state.json plan.json query.json; do
    if [[ -f ".harness/state/$f" ]]; then
      echo "  ✓ .harness/state/$f"
    else
      echo "  · .harness/state/$f (not initialized)"
    fi
  done
else
  echo "  · .harness/ not initialized"
fi
echo
echo "## Test count"
ls tests/ 2>/dev/null
echo
echo "## Bundle size (last build)"
du -sh dist/ 2>/dev/null || echo "  (no dist/)"
ls -la dist/assets/*.js 2>/dev/null | awk '{print $5, $9}' | head -5
echo
echo "=== context OK ==="
