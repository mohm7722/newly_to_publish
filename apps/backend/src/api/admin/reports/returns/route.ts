import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter, strParam } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/returns
 *
 * Returns (RMA) listing with status, returned item quantity, and the related
 * order, plus a per-status summary.
 *
 * Filters: `date_from`, `date_to`, `status`. Gated by `returns:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "returns:read")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    const filters: Record<string, unknown> = {}
    const created = buildCreatedAtFilter(q.date_from, q.date_to)
    if (created) filters.created_at = created
    if (strParam(q.status)) filters.status = strParam(q.status)

    const { data: returns } = await query.graph({
      entity: "return",
      filters,
      fields: [
        "id",
        "status",
        "order_id",
        "created_at",
        "items.quantity",
        "order.display_id",
        "order.currency_code",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    const statusCounts = new Map<string, number>()
    const rows = (returns ?? []).map((r: any) => {
      const itemsCount = (r.items ?? []).reduce(
        (s: number, it: any) => s + toNum(it.quantity),
        0
      )
      const status = r.status ?? "—"
      statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1)
      return {
        id: r.id,
        display_id: r.order?.display_id ?? null,
        status,
        items_count: itemsCount,
        currency_code: r.order?.currency_code?.toUpperCase() ?? null,
        created_at: r.created_at ?? null,
      }
    })

    nocache(res)
    res.status(200).json({
      rows,
      count: rows.length,
      status_summary: Object.fromEntries(statusCounts),
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
