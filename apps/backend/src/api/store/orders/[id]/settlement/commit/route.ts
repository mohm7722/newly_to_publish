import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../../../../modules/settlement"
import { isSupported, loadFxConfig, type CurrencyCode } from "../../../../../../lib/fx"
import { nocache } from "../../../../../utils/nocache"

/**
 * Store order settlement-commit route (Requirements 7.9, 8.2, 8.3).
 *
 * `POST /store/orders/:id/settlement/commit` computes and persists the
 * FX-converted settlement total for an order. The selected settlement currency
 * is resolved (in priority order) from the request body (`ui`), the
 * `fx_currency` cookie, then the order's `metadata.fx.ui`, defaulting to `SAR`.
 *
 * The order's base-currency (`SAR`) totals are read through the core Order
 * module and converted via the FX rates stored in `store.metadata.currency_fx`;
 * the Settlement module then upserts the `order_settlement` row. Only the
 * `order_settlement` table is written — core order totals and the draft-order
 * data model are never mutated. `/store/*` is gated by the framework's
 * publishable-key + CORS middleware. The response mirrors the Old Store shape
 * for behavior parity (Requirement 8.4):
 * `{ ok: true, order_id, currency_code, total }`.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const orderId = req.params.id
  if (!orderId) {
    res.status(400).json({ ok: false, message: "order id required" })
    return
  }

  try {
    // Resolve the selected settlement currency: body > cookie > order metadata,
    // defaulting to SAR. Each candidate is validated against the supported set.
    const bodyUi = (req.body as { ui?: string } | undefined)?.ui
    const cookieUi = (req as unknown as { cookies?: Record<string, string> })
      .cookies?.fx_currency

    let ui: CurrencyCode = "SAR"
    if (bodyUi && isSupported(bodyUi)) {
      ui = bodyUi
    } else if (cookieUi && isSupported(cookieUi)) {
      ui = cookieUi
    }

    // Resolve the order's base-currency totals through the Query graph.
    //
    // Order totals (`subtotal`, `shipping_total`, `tax_total`, `discount_total`,
    // `total`) are COMPUTED properties in Medusa v2 — they are not stored columns
    // and are NOT populated by `orderModuleService.retrieveOrder({ select })`
    // (that path returns them undefined, which previously persisted a settlement
    // of all-zero amounts). The Query graph computes and returns these totals,
    // which is the same pattern the reporting/invoice routes use. Line items are
    // requested via `items.*` so `commitSettlement` can also derive the subtotal
    // from `unit_price × quantity` when needed.
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    let order: Record<string, unknown> | null = null
    try {
      const { data } = await query.graph({
        entity: "order",
        filters: { id: orderId },
        fields: [
          "id",
          "display_id",
          "region_id",
          "customer_id",
          "currency_code",
          "subtotal",
          "shipping_total",
          "tax_total",
          "discount_total",
          "total",
          "metadata",
          "items.*",
        ],
      })
      order = (data?.[0] as Record<string, unknown> | undefined) ?? null
    } catch {
      order = null
    }

    if (!order) {
      res.status(404).json({ ok: false, message: "order not found" })
      return
    }

    const actorId = (
      req as unknown as { auth_context?: { actor_id?: string } }
    ).auth_context?.actor_id
    if (!actorId || order.customer_id !== actorId) {
      res.status(403).json({ ok: false, message: "order access denied" })
      return
    }

    // When no explicit selection was supplied, fall back to the order's own FX
    // snapshot (`metadata.fx.ui`) if one was recorded at placement time.
    if (!bodyUi && !cookieUi) {
      const orderUi = (
        (order.metadata as Record<string, any> | undefined)?.fx as
          | Record<string, unknown>
          | undefined
      )?.ui
      if (typeof orderUi === "string" && isSupported(orderUi)) {
        ui = orderUi
      }
    }

    // Load FX rates from store metadata. Conversion to a YER currency requires
    // both YER rates to be configured; SAR is implicitly 1.
    const cfg = await loadFxConfig(req.scope)
    const rates: Record<string, number> = { ...cfg.rates, SAR: 1 }

    if (ui !== "SAR" && (!rates.YER_NEW || !rates.YER_OLD)) {
      res.status(400).json({ ok: false, message: "FX not configured" })
      return
    }

    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const settlement = await settlementService.commitSettlement(
      orderId,
      order,
      ui,
      rates
    )

    nocache(res)
    res.status(200).json({
      ok: true,
      order_id: orderId,
      currency_code: ui,
      total: settlement.total,
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: "failed to commit settlement" })
  }
}
