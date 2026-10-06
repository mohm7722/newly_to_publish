#!/usr/bin/env bash
set -euo pipefail
ROOT=/var/www/newly
ARCHIVE=/home/ubuntu/_changes.tar
LIST=/home/ubuntu/_filelist.txt
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/home/ubuntu/newly-storefront-${STAMP}.tar"

sed -i 's/\r$//' "$LIST"
cd "$ROOT"
while IFS= read -r file; do
  case "$file" in
    apps/storefront/src/*) ;;
    *) echo "Unsafe deployment path: $file" >&2; exit 1 ;;
  esac
  test -f "$file"
done < "$LIST"

tar -cf "$BACKUP" -T "$LIST"
tar -xf "$ARCHIVE" -C "$ROOT"
while IFS= read -r file; do
  sed -i 's/\r$//' "$ROOT/$file"
done < "$LIST"

if ! (cd "$ROOT/apps/storefront" && npm run build); then
  echo "Build failed; restoring source backup" >&2
  tar -xf "$BACKUP" -C "$ROOT"
  (cd "$ROOT/apps/storefront" && npm run build) || true
  exit 1
fi

pm2 restart storefront --update-env
for attempt in $(seq 1 30); do
  if curl -fsS -o /dev/null http://127.0.0.1:8000/ye/; then
    pm2 status
    echo "DEPLOY_OK backup=$BACKUP"
    exit 0
  fi
  sleep 2
done

pm2 status
pm2 logs storefront --lines 80 --nostream
exit 1
