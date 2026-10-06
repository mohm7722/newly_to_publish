#!/usr/bin/env bash
# ============================================================================
# Build the backend + storefront and run database migrations.
# ----------------------------------------------------------------------------
# Run on the server from anywhere; it locates the project root itself.
# Prerequisites already in place:
#   - apps/backend/.env         (from .env.production.template, filled in)
#   - apps/storefront/.env.production (from its template, filled in)
#   - database created and (for option A) already imported
#
# Re-runnable: use this for every future deploy/update too.
# ============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$ROOT"

echo "[build] Node: $(node -v)   npm: $(npm -v)"

echo "[build] 1/4 Installing dependencies (runs patch-package) ..."
npm install

echo "[build] 2/4 Building Medusa backend (server + admin) ..."
( cd apps/backend && npm run build )

echo "[build] 3/4 Running database migrations (no-op if already up to date) ..."
( cd apps/backend && npx medusa db:migrate )

echo "[build] 4/4 Building Next.js storefront ..."
( cd apps/storefront && npm run build )

echo "[build] Done. Start/restart with:  pm2 start ecosystem.config.js  (or pm2 restart all)"
