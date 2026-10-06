#!/usr/bin/env bash
# Full cookie-based admin login flow (mimics the browser).
set -uo pipefail

BASE="${1:-http://98.82.244.9}"
EMAIL="admin@newlyye.com"
PASS="${2:-abc123}"
JAR="$(mktemp)"

TOKEN=$(curl -s -X POST "$BASE/auth/user/emailpass" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" | sed -E 's/.*"token":"([^"]+)".*/\1/')

curl -s -o /dev/null -c "$JAR" -X POST "$BASE/auth/session" \
  -H "Authorization: Bearer $TOKEN"

curl -s -o /dev/null -w "cookie-based /admin/users/me = %{http_code}\n" \
  -b "$JAR" "$BASE/admin/users/me"

rm -f "$JAR"
