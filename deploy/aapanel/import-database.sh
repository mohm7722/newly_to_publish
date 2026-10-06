#!/usr/bin/env bash
# ============================================================================
# Import the existing Medusa data into the production PostgreSQL database.
# ----------------------------------------------------------------------------
# Run ONCE, on the server, after you have:
#   - created an EMPTY database + user in aaPanel (PostgreSQL Manager)
#   - uploaded medusa-store-export.sql to the server
#
# The dump was produced by pg_dump 18.4. The `\restrict`/`\unrestrict` lines it
# contains are understood by a current psql client; if your psql is older and
# errors on them, this script strips them automatically into a temp copy.
#
# Usage:
#   ./import-database.sh <db_name> <db_user> [path/to/medusa-store-export.sql]
# Example:
#   ./import-database.sh medusa-store newly /www/wwwroot/newly/medusa-store-export.sql
#
# You will be prompted for the DB password (or set PGPASSWORD beforehand).
# ============================================================================
set -euo pipefail

DB_NAME="${1:?usage: import-database.sh <db_name> <db_user> [dump.sql]}"
DB_USER="${2:?usage: import-database.sh <db_name> <db_user> [dump.sql]}"
DUMP="${3:-medusa-store-export.sql}"
DB_HOST="${PGHOST:-127.0.0.1}"
DB_PORT="${PGPORT:-5432}"

if [ ! -f "$DUMP" ]; then
  echo "[import] Dump file not found: $DUMP" >&2
  exit 1
fi

# Safety: refuse to import into a non-empty database (avoids clobbering data).
TABLE_COUNT="$(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null || echo "ERR")"
if [ "$TABLE_COUNT" = "ERR" ]; then
  echo "[import] Could not connect to database '$DB_NAME' as '$DB_USER'. Check credentials/PGPASSWORD." >&2
  exit 1
fi
if [ "$TABLE_COUNT" != "0" ]; then
  echo "[import] Database '$DB_NAME' already has $TABLE_COUNT tables; refusing to import over it." >&2
  echo "[import] Drop/recreate the database in aaPanel first if you really want a clean import." >&2
  exit 1
fi

echo "[import] Importing $DUMP into $DB_NAME ..."
set +e
PGPASSWORD="${PGPASSWORD:-}" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$DUMP"
STATUS=$?
set -e

if [ $STATUS -ne 0 ]; then
  echo "[import] First attempt failed. Retrying without \\restrict/\\unrestrict lines ..." >&2
  TMP="$(mktemp)"
  grep -vE '^\\(restrict|unrestrict)\b' "$DUMP" > "$TMP"
  PGPASSWORD="${PGPASSWORD:-}" psql -v ON_ERROR_STOP=1 -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$TMP"
  rm -f "$TMP"
fi

echo "[import] Done. Imported $(PGPASSWORD="${PGPASSWORD:-}" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';") tables."
