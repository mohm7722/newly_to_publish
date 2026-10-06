#!/usr/bin/env bash
set -euo pipefail
ROOT=/var/www/newly
UPLOAD=/home/ubuntu/_checkout-rollback-filelist.txt
DELETE=/home/ubuntu/_checkout-rollback-delete.txt
ARCHIVE=/home/ubuntu/_checkout-rollback.tar
DEPLOY_ID=$(date +%Y%m%d-%H%M%S)
BACKUP=/home/ubuntu/checkout-rollback-backup-$DEPLOY_ID
mkdir -p "$BACKUP"
: > "$BACKUP/.missing-before"
cd "$ROOT"
for list in "$UPLOAD" "$DELETE"; do
  while IFS= read -r f || [ -n "$f" ]; do
    [ -n "$f" ] || continue
    case "$f" in /*|*..*) echo "Unsafe path: $f" >&2; exit 1;; esac
    if [ -e "$f" ]; then
      mkdir -p "$BACKUP/$(dirname "$f")"
      cp -a "$f" "$BACKUP/$f"
    else
      printf '%s\n' "$f" >> "$BACKUP/.missing-before"
    fi
  done < "$list"
done
tar -xf "$ARCHIVE" -C "$ROOT"
while IFS= read -r f || [ -n "$f" ]; do
  [ -n "$f" ] || continue
  test -f "$ROOT/$f"
  sed -i 's/\r$//' "$ROOT/$f"
done < "$UPLOAD"
while IFS= read -r f || [ -n "$f" ]; do
  [ -n "$f" ] || continue
  rm -f "$ROOT/$f"
done < "$DELETE"
printf '%s\n' "$BACKUP" > /home/ubuntu/_checkout-rollback-backup-path
printf 'BACKUP=%s\nRESTORED=%s\nDELETED=%s\n' "$BACKUP" "$(wc -l < "$UPLOAD")" "$(wc -l < "$DELETE")"