import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import {
  toNum,
  buildCreatedAtFilter,
  strParam,
} from "../../../../lib/reports/shared"
import { MANUAL_TRANSFER_MODULE } from "../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../modules/manual-transfer/service"

/**
 * GET /admin/reports/bank-transfers
 *
 * Bank-transfer submissions grouped by the customer's selected deposit
 * currency and the exact snapshotted account used for each proof.
 *
 * Filters: `date_from`, `date_to`, `currency_code`. Gated by `payments:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "payments:read")) {
    return
  }

  try {
    const q = req.query as Record<string, string | undefined>
    const created = buildCreatedAtFilter(q.date_from, q.date_to)
    const currency = strParam(q.currency_code)?.toUpperCase()
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submissions = await service.listForReport({
      ...(created ? { created_at: created } : {}),
      ...(currency ? { currency_code: currency } : {}),
    })

    type Bucket = {
      currency: string
      orders: number
      value: number
      accounts: Set<string>
    }
    const buckets = new Map<string, Bucket>()
    for (const submission of submissions) {
      if (!submission.order_id) continue
      const code = submission.currency_code.toUpperCase()
      const bucket = buckets.get(code) ?? {
        currency: code,
        orders: 0,
        value: 0,
        accounts: new Set<string>(),
      }
      bucket.orders += 1
      bucket.value += toNum(submission.expected_amount)
      bucket.accounts.add(`${submission.bank_name} — ${submission.account_number}`)
      buckets.set(code, bucket)
    }

    const rows = Array.from(buckets.values())
      .map((bucket) => ({
        currency: bucket.currency,
        orders: bucket.orders,
        value: bucket.value,
        accounts: Array.from(bucket.accounts),
      }))
      .sort((a, b) => b.value - a.value)

    nocache(res)
    res.status(200).json({
      rows,
      count: rows.length,
      submissions_total: submissions.length,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
