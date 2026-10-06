#!/usr/bin/env bash
# Reproduce the admin login flow and inspect the session cookie flags.
set -uo pipefail

BASE="${1:-http://localhost:9000}"
EMAIL="admin@newlyye.com"
PASS="${2:-abc123}"

echo "== base: $BASE =="

TOKEN=$(curl -s -X POST "$BASE/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')

echo "token length: ${#TOKEN}"

echo "== POST /auth/session (show Set-Cookie) =="
curl -s -i -X POST "$BASE/auth/session" \
  -H "Authorization: Bearer $TOKEN" | grep -i -E "^HTTP|^set-cookie"

echo "== GET /admin/users/me with bearer token =="
curl -s -o /dev/null -w "bearer /admin/users/me = %{http_code}\n" \
  "$BASE/admin/users/me" -H "Authorization: Bearer $TOKEN"
