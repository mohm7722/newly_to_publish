import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { buildCreatedAtFilter } from "../../../../lib/reports/shared"
import { ABANDONED_CART_MODULE } from "../../../../modules/abandoned-cart"
import type AbandonedCartModuleService from "../../../../modules/abandoned-cart/service"

/**
 * GET /admin/reports/abandoned-carts
 *
 * Abandoned-cart recovery report. Lists the reminder records produced by the
 * abandoned-cart feature and summarizes recovery performance: how many carts
 * were reminded, how many reminders were sent, how many carts were recovered
 * (completed into an order after being reminded), and the resulting recovery
 * rate.
 *
 * Filters: `date_from`, `date_to` (on the reminder record `created_at`).
 * Gated by `orders:read` (consistent with the other order-oriented reports).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "orders:read")) {
    return
  }

  try {
    const q = req.query as Record<string, string | undefined>
    const service = req.scope.resolve<AbandonedCartModuleService>(
      ABANDONED_CART_MODULE
    )

    const filters: Record<string, unknown> = {}
    const created = buildCreatedAtFilter(q.date_from, q.date_to)
    if (created) filters.created_at = created

    const records = (await service.listAbandonedCartReminders(filters, {
      take: 5000,
      order: { created_at: "DESC" },
    })) as Array<Record<string, any>>

    let remindersSent = 0
    let recoveredCount = 0

    const rows = records.map((r) => {
      const reminderCount = Number(r.reminder_count) || 0
      const recovered = Boolean(r.recovered)
      remindersSent += reminderCount
      if (recovered) recoveredCount += 1

      return {
        cart_id: r.cart_id,
        email: r.email ?? null,
        reminder_count: reminderCount,
        last_reminder_at: r.last_reminder_at ?? null,
        recovered,
        created_at: r.created_at ?? null,
      }
    })

    const remindedCount = rows.length
    const recoveryRate =
      remindedCount > 0
        ? Math.round((recoveredCount / remindedCount) * 10000) / 100
        : 0

    nocache(res)
    res.status(200).json({
      rows,
      count: remindedCount,
      totals: {
        reminded_carts: remindedCount,
        reminders_sent: remindersSent,
        recovered_carts: recoveredCount,
        recovery_rate: recoveryRate, // percentage, e.g. 23.5 means 23.5%
      },
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
