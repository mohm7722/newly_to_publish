#!/usr/bin/env bash
# ============================================================================
# Migrate on-disk assets to their persistent production locations and fix the
# image URLs stored in the database.
# ----------------------------------------------------------------------------
# Run ONCE on the server, AFTER importing the database (import-database.sh).
#
# It:
#   1. copies apps/backend/static/*  ->  runtime-data/uploads/   (product images)
#   2. copies apps/backend/data/manual-transfer-proofs/* -> runtime-data/manual-transfer-proofs/
#   3. rewrites http://localhost:9000/static/ -> https://www.newlyye.com/static/
#      in the database (via fix-image-urls.sql)
#
# Usage:
#   ./migrate-assets.sh <db_name> <db_user>
# (set PGPASSWORD beforehand, or you will be prompted)
# ============================================================================
set -euo pipefail

DB_NAME="${1:?usage: migrate-assets.sh <db_name> <db_user>}"
DB_USER="${2:?usage: migrate-assets.sh <db_name> <db_user>}"
DB_HOST="${PGHOST:-127.0.0.1}"
DB_PORT="${PGPORT:-5432}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"          # project root (/www/wwwroot/newly)
UPLOADS="$ROOT/runtime-data/uploads"
PROOFS="$ROOT/runtime-data/manual-transfer-proofs"

echo "[assets] Ensuring persistent dirs ..."
mkdir -p "$UPLOADS" "$PROOFS"

if [ -d "$ROOT/apps/backend/static" ]; then
  echo "[assets] Copying product images -> $UPLOADS"
  cp -an "$ROOT/apps/backend/static/." "$UPLOADS/" 2>/dev/null || true
fi

if [ -d "$ROOT/apps/backend/data/manual-transfer-proofs" ]; then
  echo "[assets] Copying bank-transfer proofs -> $PROOFS"
  cp -an "$ROOT/apps/backend/data/manual-transfer-proofs/." "$PROOFS/" 2>/dev/null || true
fi

echo "[assets] Rewriting image URLs in the database ..."
PGPASSWORD="${PGPASSWORD:-}" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$SCRIPT_DIR/fix-image-urls.sql"

echo "[assets] Done."
