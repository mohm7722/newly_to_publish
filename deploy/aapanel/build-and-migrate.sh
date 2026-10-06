#!/usr/bin/env bash
# ============================================================================
# Full deploy: install deps, build backend, migrate, then build + (re)start
# both apps with PM2.
# ----------------------------------------------------------------------------
# IMPORTANT ORDERING: the Next.js storefront fetches catalog data from the
# backend at BUILD time (static generation of category/product pages). So the
# backend MUST be running before `next build`. This script starts the backend
# with PM2 first, waits for /health, then builds and starts the storefront.
#
# Prerequisites:
#   - apps/backend/.env            (filled in)
#   - apps/storefront/.env.production (filled in)
#   - database created, imported, and assets migrated
#   - PM2 installed (npm install -g pm2, or via aaPanel's PM2 manager)
#
# Re-runnable: use this for every future deploy/update too.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[build] ERROR: pm2 not found in PATH. Install it first:" >&2
  echo "          npm install -g pm2" >&2
  exit 1
fi

echo "[build] Node: $(node -v)   npm: $(npm -v)   pm2: $(pm2 -v)"

echo "[build] 1/6 Installing dependencies (runs patch-package) ..."
npm install

echo "[build] 2/6 Building Medusa backend (server + admin) ..."
( cd apps/backend && npm run build )

echo "[build] 3/6 Running database migrations (no-op if already up to date) ..."
( cd apps/backend && npx medusa db:migrate )

echo "[build] 4/6 Starting the backend (needed for the storefront build) ..."
pm2 startOrReload ecosystem.config.js --only medusa-backend --update-env
echo "[build]     Waiting for backend health on http://127.0.0.1:9000/health ..."
backend_up=false
for _ in $(seq 1 45); do
  if curl -fsS -o /dev/null http://127.0.0.1:9000/health; then
    backend_up=true
    break
  fi
  sleep 2
done
if [ "$backend_up" != "true" ]; then
  echo "[build] ERROR: backend did not become healthy. Check: pm2 logs medusa-backend" >&2
  exit 1
fi
echo "[build]     Backend is up."

echo "[build] 5/6 Building Next.js storefront ..."
( cd apps/storefront && npm run build )

echo "[build] 6/6 Starting the storefront ..."
pm2 startOrReload ecosystem.config.js --only storefront --update-env
pm2 save

echo "[build] Done. Both apps are managed by PM2 (pm2 status). Run 'pm2 startup' once to persist across reboots."
