#!/usr/bin/env bash
set -euo pipefail

# IronRank Web - Deploy script
# Usage:
#   VPS_HOST=user@host VPS_PATH=/var/www/ironrank ./scripts/deploy.sh
#
# Or override defaults in the script below.

# OJO: nginx sirve /ironrank/ desde /opt/stack/site/rafagandia/ironrank
# (alias en /etc/nginx/sites-available/rafagandia.com), NO desde /var/www/ironrank.
VPS_HOST="${VPS_HOST:-rafa@rafagandia.com}"
VPS_PATH="${VPS_PATH:-/opt/stack/site/rafagandia/ironrank}"
LOCAL_DIST="$(cd "$(dirname "$0")/.." && pwd)/dist"

echo "🔨 Building production bundle..."
cd "$(dirname "$0")/.."
npm run build

if [ ! -d "$LOCAL_DIST" ]; then
  echo "❌ dist/ not found. Build failed?"
  exit 1
fi

echo "📦 Uploading to $VPS_HOST:$VPS_PATH ..."
if [ "$(hostname)" = "atleticosobrino.com" ]; then
  # Ya estamos en el VPS: rsync local (el destino es de root, requiere sudo)
  sudo rsync -a --delete \
    --exclude '*.map' \
    --exclude '*.html.bak' \
    "$LOCAL_DIST/" "$VPS_PATH/"
else
  rsync -avz --delete \
    --exclude '*.map' \
    --exclude '*.html.bak' \
    "$LOCAL_DIST/" "$VPS_HOST:$VPS_PATH/"
fi

echo "✅ Deployed to https://rafagandia.com/ironrank/"
