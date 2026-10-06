#!/usr/bin/env bash
#
# Production start wrapper for the Medusa backend.
#
# Medusa v2 must be started from inside the compiled ".medusa/server"
# directory so that the admin build (public/admin) resolves correctly.
# That directory is regenerated on every `medusa build`, so we:
#   1. copy the backend .env into it on each start to keep environment
#      variables (DATABASE_URL, JWT_SECRET, COOKIE_SECRET, CORS, ...) available;
#   2. point ".medusa/server/static" at a PERSISTENT uploads directory via a
#      symlink. Medusa serves "/static" from "<cwd>/static" and the local file
#      provider writes uploads there, but ".medusa" is wiped on every build, so
#      without this symlink every product image uploaded through the admin would
#      disappear on the next deploy.
#
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$BACKEND_DIR/.medusa/server"

# Persistent location for uploaded files (product images, etc.). Override with
# FILE_UPLOAD_PERSIST_DIR if your runtime-data lives elsewhere.
PERSIST_DIR="${FILE_UPLOAD_PERSIST_DIR:-$BACKEND_DIR/../../runtime-data/uploads}"

if [ ! -f "$SERVER_DIR/index.js" ] && [ ! -d "$SERVER_DIR" ]; then
  echo "[run-server] Build output not found at $SERVER_DIR. Run 'medusa build' first." >&2
  exit 1
fi

if [ -f "$BACKEND_DIR/.env" ]; then
  cp "$BACKEND_DIR/.env" "$SERVER_DIR/.env"
fi

# --- Persistent uploads: make .medusa/server/static -> $PERSIST_DIR ----------
mkdir -p "$PERSIST_DIR"
STATIC_LINK="$SERVER_DIR/static"
if [ -L "$STATIC_LINK" ]; then
  # Already a symlink: leave it (re-point only if it drifted).
  :
elif [ -d "$STATIC_LINK" ]; then
  # Fresh build may have created a real dir (possibly with seeded files).
  # Move any contents into the persistent dir, then replace with a symlink.
  if [ -n "$(ls -A "$STATIC_LINK" 2>/dev/null || true)" ]; then
    cp -an "$STATIC_LINK/." "$PERSIST_DIR/" 2>/dev/null || true
  fi
  rm -rf "$STATIC_LINK"
fi
if [ ! -L "$STATIC_LINK" ]; then
  ln -s "$PERSIST_DIR" "$STATIC_LINK"
fi

cd "$SERVER_DIR"
exec npm run start
