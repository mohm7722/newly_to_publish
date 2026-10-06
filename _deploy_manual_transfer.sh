#!/usr/bin/env bash
set -Eeuo pipefail

ROOT=/var/www/newly
ARCHIVE=/home/ubuntu/_manual_transfer_changes.tar
LIST=/home/ubuntu/_manual_transfer_filelist.txt
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP="/home/ubuntu/newly-manual-transfer-predeploy-${STAMP}.tar"

sed -i 's/\r$//' "$LIST"
cd "$ROOT"

mkdir -p /home/ubuntu/deploy-stage
rm -rf /home/ubuntu/deploy-stage/*
tar -xf "$ARCHIVE" -C /home/ubuntu/deploy-stage

while IFS= read -r file; do
  case "$file" in
    apps/backend/medusa-config.ts|apps/backend/src/*|apps/storefront/src/*) ;;
    *) echo "Unsafe deployment path: $file" >&2; exit 1 ;;
  esac
  test -f "/home/ubuntu/deploy-stage/$file"
done < "$LIST"

tar -cf "$BACKUP" \
  apps/backend/src \
  apps/backend/medusa-config.ts \
  apps/storefront/src
tar -tf "$BACKUP" >/dev/null

echo "BACKUP_CREATED=$BACKUP"

rollback() {
  local line="${1:-unknown}"
  trap - ERR
  set +e
  echo "DEPLOY_FAILED_AT_LINE=$line; restoring source backup" >&2
  cd "$ROOT"
  rm -rf apps/backend/src apps/storefront/src
  tar -xf "$BACKUP" -C "$ROOT"
  (cd apps/backend && npm run build)
  pm2 restart medusa-backend --update-env
  (cd apps/storefront && npm run build)
  pm2 restart storefront --update-env
  pm2 status
  exit 1
}
trap 'rollback $LINENO' ERR

while IFS= read -r file; do
  install -D -m 0644 "/home/ubuntu/deploy-stage/$file" "$ROOT/$file"
done < "$LIST"

sudo install -d -o "$(id -un)" -g "$(id -gn)" -m 0700 \
  /var/lib/newly/manual-transfer-proofs

echo "RUNNING_DATABASE_MIGRATIONS"
(cd apps/backend && npx medusa db:migrate)

echo "BUILDING_BACKEND"
(cd apps/backend && npm run build)
pm2 restart medusa-backend --update-env

for attempt in $(seq 1 45); do
  if curl -fsS -o /dev/null http://127.0.0.1:9000/health; then
    break
  fi
  if [ "$attempt" -eq 45 ]; then
    pm2 logs medusa-backend --lines 120 --nostream
    false
  fi
  sleep 2
done

echo "BUILDING_STOREFRONT"
(cd apps/storefront && npm run build)
pm2 restart storefront --update-env

for attempt in $(seq 1 45); do
  if curl -fsS -o /dev/null http://127.0.0.1:8000/ye/; then
    break
  fi
  if [ "$attempt" -eq 45 ]; then
    pm2 logs storefront --lines 120 --nostream
    false
  fi
  sleep 2
done

rm -rf /home/ubuntu/deploy-stage
rm -f "$ARCHIVE" "$LIST" /home/ubuntu/_deploy_manual_transfer.sh
pm2 status
echo "DEPLOY_OK backup=$BACKUP"
