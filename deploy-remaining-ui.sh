#!/usr/bin/env bash
set -euo pipefail
ROOT=/var/www/newly
LIST=/tmp/remaining-ui-files.txt
ARCHIVE=/tmp/remaining-ui-deploy.tar.gz
STAMP=$(date +%Y%m%d-%H%M%S)
BACKUP=/home/ubuntu/remaining-ui-backup-${STAMP}.tar.gz
sed -i 's/\r$//' "$LIST"
cd "$ROOT"
tar -czf "$BACKUP" -T "$LIST"
echo "BACKUP=$BACKUP"
tar -xzf "$ARCHIVE" -C "$ROOT"
while IFS= read -r file || [ -n "$file" ]; do sed -i 's/\r$//' "$ROOT/$file"; done < "$LIST"
cd "$ROOT/apps/storefront"
npm run build
pm2 restart storefront --update-env
pm2 status
pm2 logs storefront --lines 30 --nostream
rm -f "$LIST" "$ARCHIVE" /tmp/deploy-remaining-ui.sh