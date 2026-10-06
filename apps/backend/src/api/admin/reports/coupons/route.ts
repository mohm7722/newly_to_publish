import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, strParam } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/coupons
 *
 * Promotion/coupon catalog with code, status, and discount configuration, plus
 * a best-effort redemption count (orders that used each code). The redemption
 * join is guarded — if the order→promotion link is unavailable it degrades to
 * `null` usage rather than failing.
 *
 * Filters: `status`, `q` (code contains). Gated by `promotions:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "promotions:read")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    const filters: Record<string, unknown> = {}
    if (strParam(q.status)) filters.status = strParam(q.status)

    const { data: promotions } = await query.graph({
      entity: "promotion",
      filters,
      fields: [
        "id",
        "code",
        "status",
        "application_method.type",
        "application_method.value",
        "application_method.currency_code",
      ],
      pagination: { take: 5000, skip: 0 },
    })

    // Best-effort redemption counts per promotion code.
    const usageByCode = new Map<string, number>()
    try {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "promotions.code"],
        pagination: { take: 5000, skip: 0 },
      })
      for (const o of orders ?? []) {
        for (const p of (o as any).promotions ?? []) {
          if (p?.code) usageByCode.set(p.code, (usageByCode.get(p.code) ?? 0) + 1)
        }
      }
    } catch {
      // order→promotion link unavailable; leave usage as null.
    }
    const hasUsage = usageByCode.size > 0

    const search = strParam(q.q)?.toLowerCase()
    const rows = (promotions ?? [])
      .map((p: any) => {
        const method = p.application_method
        return {
          code: p.code ?? "—",
          status: p.status ?? "—",
          type: method?.type ?? "—",
          value: method?.value != null ? toNum(method.value) : null,
          currency_code: method?.currency_code?.toUpperCase() ?? null,
          redemptions: hasUsage ? usageByCode.get(p.code) ?? 0 : null,
        }
      })
      .filter((r) =>
        search ? String(r.code).toLowerCase().includes(search) : true
      )
      .sort((a, b) => (b.redemptions ?? 0) - (a.redemptions ?? 0))

    nocache(res)
    res.status(200).json({ rows, count: rows.length, usage_available: hasUsage })
  } catch (error) {
    handleServiceError(error, res)
  }
}
