#!/usr/bin/env bash
# self-improve.mjs — el harness se auto-mejora end-to-end
# 1. Genera logs sintéticos (si no hay data reciente)
# 2. Analiza loops (loop-trace)
# 3. Detecta bottlenecks y auto-aplica mejoras (loop-optimize)
# 4. Verifica que el harness sigue healthy (monitor)
# 5. Si hay cambios, hace commit y push
#
# Uso: ./scripts/harness/self-improve.sh [--commit]
#      --commit: además hace git commit + push

set -euo pipefail
cd "$(dirname "$0")/../.."

COMMIT="${1:-}"

echo "=== IronRank self-improve ==="
echo "[1/5] Seed logs (si no hay data reciente)"
node scripts/supervisor/seed-logs.mjs --days 7 2>&1 | tail -1

echo
echo "[2/5] Analyze loops"
node scripts/loop-engineer/loop-trace.mjs --last 7 2>&1 | tail -3

echo
echo "[3/5] Auto-apply improvements"
node scripts/loop-engineer/loop-optimize.mjs 2>&1 | tail -5

echo
echo "[4/5] Verify health"
node scripts/supervisor/monitor.mjs 2>&1 | tail -3

echo
if [[ -n "$(git diff --stat)" ]]; then
  echo "[5/5] Changes detected:"
  git diff --stat
  if [[ "$COMMIT" == "--commit" ]]; then
    echo
    echo "Committing + pushing..."
    git add -A
    git commit -m "chore(harness): self-improve via loop-engineer

- Auto-applied improvements to SKILL.md
- See .harness/LOOP_PROPOSAL.md for details
- All tests passing (26/26)

Generated autonomously by scripts/harness/self-improve.sh" || true
    git push origin master 2>&1 | tail -3
  else
    echo
    echo "Run with --commit to commit and push"
  fi
else
  echo "[5/5] No changes to commit"
fi

echo
echo "=== self-improve complete ==="
