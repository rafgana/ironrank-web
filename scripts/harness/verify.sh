#!/usr/bin/env bash
# verify.sh — the harness self-verification loop
# Runs: tsc + build + 21 E2E tests
# Exit 0 = OK, Exit 1 = broken

set -euo pipefail
cd "$(dirname "$0")/../.."

echo "=== harness/verify ==="
echo "[1/3] tsc --noEmit"
npx tsc --noEmit

echo "[2/3] build"
npm run build

echo "[3/3] E2E tests"
if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
  node tests/e2e.mjs
else
  echo "  (skipping tests that require SERVICE_ROLE_KEY)"
  SUPABASE_SERVICE_ROLE_KEY="" node tests/e2e.mjs
fi

echo "=== verify OK ==="
