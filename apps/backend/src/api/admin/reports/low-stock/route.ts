import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, strParam } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/low-stock
 *
 * Inventory items whose available quantity (stocked − reserved) is at or below
 * a threshold, for re-ordering.
 *
 * Filters: `threshold` (default 5), `location_id`. Gated by `inventory:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "inventory:read")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    const thresholdRaw = Number(q.threshold)
    const threshold = Number.isFinite(thresholdRaw) && thresholdRaw >= 0 ? thresholdRaw : 5

    const filters: Record<string, unknown> = {}
    if (strParam(q.location_id)) filters.location_id = strParam(q.location_id)

    const { data: levels } = await query.graph({
      entity: "inventory_level",
      filters,
      fields: [
        "id",
        "location_id",
        "stocked_quantity",
        "reserved_quantity",
        "inventory_item.sku",
        "inventory_item.title",
        "stock_location.name",
      ],
      pagination: { take: 5000, skip: 0 },
    })

    const rows = (levels ?? [])
      .map((lvl: any) => {
        const stocked = toNum(lvl.stocked_quantity)
        const reserved = toNum(lvl.reserved_quantity)
        return {
          sku: lvl.inventory_item?.sku ?? "—",
          title: lvl.inventory_item?.title ?? lvl.inventory_item?.sku ?? "—",
          location: lvl.stock_location?.name ?? lvl.location_id ?? "—",
          stocked,
          reserved,
          available: stocked - reserved,
          threshold,
        }
      })
      .filter((r) => r.available <= threshold)
      .sort((a, b) => a.available - b.available)

    nocache(res)
    res.status(200).json({ rows, count: rows.length, threshold })
  } catch (error) {
    handleServiceError(error, res)
  }
}
