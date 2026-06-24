#!/usr/bin/env bash
# evals.sh — smoke tests for the live site
# Checks: SEO (JSON-LD, sitemap, robots), a11y (axe-core), bundle gzip

set -euo pipefail
cd "$(dirname "$0")/../.."

SITE="${SITE_URL:-https://rafagandia.com/ironrank}"
TS="$(date +%Y%m%d-%H%M%S)"
OUT_DIR=".harness/evals"
mkdir -p "$OUT_DIR"

echo "=== harness/evals @ $TS ==="
echo
echo "[1/3] SEO: JSON-LD, sitemap, robots"

# 1a. JSON-LD blocks on landing
landing_schemas=$(curl -s "$SITE/landing/" | grep -c "application/ld+json")
echo "  Landing JSON-LD blocks: $landing_schemas (expected >= 4)"
if [[ $landing_schemas -lt 4 ]]; then
  echo "  ✗ FAIL: missing JSON-LD blocks"
  exit 1
fi

# 1b. Sitemap
sitemap_urls=$(curl -s "$SITE/sitemap.xml" | grep -c "<loc>")
echo "  Sitemap URLs: $sitemap_urls"
if [[ $sitemap_urls -lt 4 ]]; then
  echo "  ✗ FAIL: sitemap has < 4 URLs"
  exit 1
fi

# 1c. robots.txt
robots_sitemap=$(curl -s "$SITE/robots.txt" | grep -c "^Sitemap:")
robots_ai=$(curl -s "$SITE/robots.txt" | grep -cE "GPTBot|ChatGPT-User|PerplexityBot")
echo "  robots Sitemap: $robots_sitemap, AI bots: $robots_ai"
if [[ $robots_sitemap -lt 1 ]]; then
  echo "  ✗ FAIL: robots.txt missing Sitemap directive"
  exit 1
fi

echo
echo "[2/3] A11y: critical/serious violations via axe-core"
# (skipped here — covered in test 15 of tests/e2e.mjs)
echo "  (covered by test 15 in tests/e2e.mjs)"

echo
echo "[3/3] Bundle: gzipped JS + CSS sizes"
if [[ -d dist/assets ]]; then
  raw=$(du -sb dist/assets/*.js dist/assets/*.css 2>/dev/null | awk '{sum+=$1} END {print sum}')
  gz=$(cat dist/assets/*.js dist/assets/*.css 2>/dev/null | gzip -9 | wc -c)
  echo "  Raw: ${raw} bytes"
  echo "  Gz:  ${gz} bytes"
  echo "  Ratio: $(awk "BEGIN {printf \"%.1f\", $gz/$raw*100}")%"
fi

# Persist
cat > "$OUT_DIR/last.json" <<EOF
{
  "ts": "$TS",
  "seo": { "landing_schemas": $landing_schemas, "sitemap_urls": $sitemap_urls, "robots_sitemap": $robots_sitemap, "robots_ai": $robots_ai },
  "bundle": { "raw": ${raw:-0}, "gz": ${gz:-0} }
}
EOF

echo
echo "=== evals OK ==="
echo "Saved to $OUT_DIR/last.json"
