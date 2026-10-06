#!/usr/bin/env bash
set -euo pipefail
rm -f /home/ubuntu/_sync_manual_transfer_permissions.js
cd /var/www/newly
BACKEND=$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' http://127.0.0.1/health)
STOREFRONT=$(curl --max-time 15 -sS -o /dev/null -w '%{http_code}' http://127.0.0.1/ye/)
KEY=$(awk -F= '/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=/{print substr($0,index($0,"=")+1)}' apps/storefront/.env.local | tail -1 | tr -d '\r"')
BANK_OK=$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' -H "x-publishable-api-key: $KEY" 'http://127.0.0.1/store/payments/bank-accounts?currency_code=SAR')
BANK_BAD=$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' -H "x-publishable-api-key: $KEY" 'http://127.0.0.1/store/payments/bank-accounts?currency_code=USD')
AUTH_GUARD=$(curl --max-time 10 -sS -o /dev/null -w '%{http_code}' -H "x-publishable-api-key: $KEY" 'http://127.0.0.1/store/carts/cart_invalid/manual-transfer')
PROOF_MODE=$(stat -c '%a' /var/lib/newly/manual-transfer-proofs)
echo "SMOKE backend=$BACKEND storefront=$STOREFRONT bank_sar=$BANK_OK bank_invalid=$BANK_BAD auth_guard=$AUTH_GUARD proof_dir_mode=$PROOF_MODE"
pm2 status
