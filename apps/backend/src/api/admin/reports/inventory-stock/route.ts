import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, strParam } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/inventory-stock
 *
 * Stock levels per inventory item per stock location: stocked, reserved, and
 * available (stocked − reserved) quantities.
 *
 * Filters: `location_id`, `q` (SKU/title contains). Gated by `inventory:read`.
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

    const search = strParam(q.q)?.toLowerCase()

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
        }
      })
      .filter((r) =>
        search
          ? `${r.sku} ${r.title}`.toLowerCase().includes(search)
          : true
      )
      .sort((a, b) => a.available - b.available)

    const totals = rows.reduce(
      (acc, r) => {
        acc.stocked += r.stocked
        acc.reserved += r.reserved
        acc.available += r.available
        return acc
      },
      { stocked: 0, reserved: 0, available: 0 }
    )

    nocache(res)
    res.status(200).json({ rows, count: rows.length, totals })
  } catch (error) {
    handleServiceError(error, res)
  }
}
