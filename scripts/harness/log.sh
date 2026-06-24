#!/usr/bin/env bash
# log.sh — append a trace entry to .harness/logs/<date>.jsonl
# Usage: ./scripts/harness/log.sh <action> <target> [details-json]

set -euo pipefail
cd "$(dirname "$0")/../.."

ACTION="${1:-unknown}"
TARGET="${2:-}"
DETAILS="${3:-null}"

DATE="$(date -u +%Y-%m-%d)"
TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LOG_DIR=".harness/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/$DATE.jsonl"

printf '{"ts":"%s","action":"%s","target":"%s","details":%s}\n' \
  "$TS" "$ACTION" "$TARGET" "$DETAILS" >> "$LOG_FILE"

echo "logged: $ACTION $TARGET"
