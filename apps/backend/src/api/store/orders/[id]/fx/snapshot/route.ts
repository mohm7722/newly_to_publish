import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

import { isSupported, loadFxConfig, type CurrencyCode } from "../../../../../../lib/fx"
import { nocache } from "../../../../../utils/nocache"

/**
 * Store order FX-snapshot route (Requirements 7.9, 8.2, 8.3).
 *
 * `POST /store/orders/:id/fx/snapshot` records the customer's selected display
 * currency, the applied SAR-relative conversion rate, and a timestamp onto the
 * core order's `metadata.fx` namespace. This is the post-order snapshot the
 * storefront writes when an order is placed (Requirement 7.9).
 *
 * Only `order.metadata.fx` is written; the core order totals and the
 * draft-order data model are never mutated. `/store/*` is gated by the
 * framework's publishable-key + CORS middleware, so no custom auth gate is
 * applied here. The response mirrors the Old Store shape
 * (`{ ok: true, order_id, currency }`) for behavior parity (Requirement 8.4),
 * extended with the applied `rate` recorded in the snapshot.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const orderId = req.params.id
  if (!orderId) {
    res.status(400).json({ message: "order id required" })
    return
  }

  const { currency } = (req.body || {}) as { currency?: string }
  if (!currency || !isSupported(currency)) {
    res.status(400).json({ message: "valid currency required" })
    return
  }
  const ui = currency as CurrencyCode

  try {
    const orderModuleService = req.scope.resolve(Modules.ORDER)

    const orders = await orderModuleService.listOrders({ id: [orderId] })
    const order = orders?.[0]
    if (!order) {
      res.status(404).json({ message: "order not found" })
      return
    }

    // Resolve the SAR-relative applied rate for the selected currency. SAR is
    // implicitly 1; an unconfigured YER rate is recorded as `null` rather than
    // failing the snapshot.
    const cfg = await loadFxConfig(req.scope)
    const rate: number | null =
      ui === "SAR"
        ? 1
        : typeof cfg.rates[ui] === "number"
          ? cfg.rates[ui]
          : null

    const existingMetadata = (order.metadata || {}) as Record<string, unknown>
    const existingFx = (existingMetadata.fx || {}) as Record<string, unknown>

    const metadata = {
      ...existingMetadata,
      fx: {
        ...existingFx,
        ui,
        rate,
        snapshot_at: new Date().toISOString(),
      },
    }

    await orderModuleService.updateOrders([{ id: orderId, metadata }])

    nocache(res)
    res.status(200).json({ ok: true, order_id: orderId, currency: ui, rate })
  } catch (error) {
    res.status(500).json({ message: "snapshot failed" })
  }
}
