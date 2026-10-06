import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import {
  toNum,
  buildCreatedAtFilter,
  classifyPaymentMethod,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
} from "../../../../lib/reports/shared"
import {
  toSar,
  bucketKey,
  addTo,
  normCurrency,
  round2,
  GRANULARITIES,
  type Granularity,
} from "../../../../lib/analytics/shared"
import { loadFxConfig, isFxEnabled } from "../../../../lib/fx"
import { ABANDONED_CART_MODULE } from "../../../../modules/abandoned-cart"
import type AbandonedCartModuleService from "../../../../modules/abandoned-cart/service"

/**
 * GET /admin/analytics/dashboard
 *
 * Single read-only aggregation powering the admin analytics dashboard. It never
 * writes anything — it reads orders (and a few auxiliary entities) through the
 * Query graph and computes KPIs, trend series, and breakdowns in-memory, so it
 * respects the schema-preservation guarantees of the store.
 *
 * Because this store sells in multiple currencies (SAR / YER_NEW / YER_OLD),
 * monetary values are reported **both** broken down per currency (never summing
 * different currencies together) **and** normalized to the SAR base using the
 * store FX rates, so the dashboard can show a single comparable headline figure.
 * Currencies without a usable FX rate are excluded from the SAR total and
 * reported in `kpis.revenue_sar_excluded_currencies` for transparency.
 *
 * Query params:
 *   - `date_from`, `date_to`  ISO dates (inclusive end-of-day on `date_to`).
 *   - `granularity`           `day` (default) | `week` | `month` for the trend.
 *   - `top`                   number of top products to return (1–50, default 10).
 *
 * Gated by `analytics:read` (also enforced centrally by the RBAC middleware).
 */

/** Hard cap on rows read from the Query graph, matching the reporting routes. */
const MAX_ROWS = 5000

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "analytics:read")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    const granularity: Granularity = (GRANULARITIES as readonly string[]).includes(
      q.granularity ?? ""
    )
      ? (q.granularity as Granularity)
      : "day"

    const topRaw = Number(q.top)
    const top =
      Number.isFinite(topRaw) && topRaw >= 1 ? Math.min(Math.floor(topRaw), 50) : 10

    const createdAt = buildCreatedAtFilter(q.date_from, q.date_to)
    const orderFilters: Record<string, unknown> = {}
    if (createdAt) orderFilters.created_at = createdAt

    // FX rates for SAR normalization (store metadata; empty when unset).
    const [fxConfig, fxEnabled] = await Promise.all([
      loadFxConfig(req.scope).catch(() => ({ rates: {} as Record<string, number> })),
      isFxEnabled(req.scope).catch(() => false),
    ])
    const rates = fxConfig.rates ?? {}

    const { data: orders } = await query.graph({
      entity: "order",
      filters: orderFilters,
      fields: [
        "id",
        "status",
        "currency_code",
        "total",
        "created_at",
        "customer_id",
        "shipping_address.city",
        "payment_collections.payments.provider_id",
        // Medusa's official orders-list workflow always loads complete items
        // before computing order and line-item totals.
        "items.*",
      ],
      pagination: { take: MAX_ROWS, skip: 0, order: { created_at: "DESC" } },
    })

    const orderList = (orders ?? []) as any[]
    const truncated = orderList.length >= MAX_ROWS

    // ── Accumulators ──────────────────────────────────────────────────────────
    const ordersByStatus = new Map<string, number>()
    const revenueByCurrency = new Map<string, number>()
    const ordersByCurrency = new Map<string, number>()
    let revenueSar = 0
    const excludedCurrencies = new Set<string>()
    const currenciesSeen = new Set<string>()

    const trend = new Map<
      string,
      { orders: number; revenue_by_currency: Map<string, number>; revenue_sar: number }
    >()
    const paymentMix = new Map<
      PaymentMethod,
      { orders: number; value_by_currency: Map<string, number>; value_sar: number }
    >()
    const byCity = new Map<
      string,
      { orders: number; value_by_currency: Map<string, number>; value_sar: number }
    >()
    const products = new Map<
      string,
      { label: string; quantity: number; value_by_currency: Map<string, number>; value_sar: number }
    >()

    const customerIds = new Set<string>()

    for (const order of orderList) {
      const status = String(order.status ?? "unknown")
      ordersByStatus.set(status, (ordersByStatus.get(status) ?? 0) + 1)

      // Canceled orders count toward status distribution only, not revenue.
      const isCanceled = status === "canceled"

      const currency = normCurrency(order.currency_code)
      if (currency) currenciesSeen.add(currency)

      const total = toNum(order.total)
      const sar = toSar(total, currency, rates)
      if (currency && sar === null && !isCanceled) {
        excludedCurrencies.add(currency)
      }

      if (order.customer_id) customerIds.add(String(order.customer_id))

      if (!isCanceled) {
        if (currency) {
          addTo(revenueByCurrency, currency, total)
          ordersByCurrency.set(currency, (ordersByCurrency.get(currency) ?? 0) + 1)
        }
        if (sar !== null) revenueSar += sar

        // Trend bucket.
        if (order.created_at) {
          const key = bucketKey(new Date(order.created_at), granularity)
          let t = trend.get(key)
          if (!t) {
            t = { orders: 0, revenue_by_currency: new Map(), revenue_sar: 0 }
            trend.set(key, t)
          }
          t.orders += 1
          if (currency) addTo(t.revenue_by_currency, currency, total)
          if (sar !== null) t.revenue_sar += sar
        }

        // Payment method mix.
        const provider =
          order.payment_collections?.[0]?.payments?.[0]?.provider_id ?? null
        const method = classifyPaymentMethod(provider)
        let pm = paymentMix.get(method)
        if (!pm) {
          pm = { orders: 0, value_by_currency: new Map(), value_sar: 0 }
          paymentMix.set(method, pm)
        }
        pm.orders += 1
        if (currency) addTo(pm.value_by_currency, currency, total)
        if (sar !== null) pm.value_sar += sar

        // Sales by shipping city.
        const cityLabel = order.shipping_address?.city?.trim() || "بدون مدينة"
        const cityKey = cityLabel.toLowerCase()
        let city = byCity.get(cityKey)
        if (!city) {
          city = { orders: 0, value_by_currency: new Map(), value_sar: 0 }
          byCity.set(cityKey, city)
          ;(city as any).label = cityLabel
        }
        city.orders += 1
        if (currency) addTo(city.value_by_currency, currency, total)
        if (sar !== null) city.value_sar += sar

        // Top products (by line-item quantity/value).
        for (const it of order.items ?? []) {
          const pid = it.product_id || it.title || "—"
          const name = it.product_title || it.title || "—"
          const label = it.variant_title ? `${name} — ${it.variant_title}` : name
          let p = products.get(pid)
          if (!p) {
            p = { label, quantity: 0, value_by_currency: new Map(), value_sar: 0 }
            products.set(pid, p)
          }
          const qty = toNum(it.quantity)
          const lineTotal = toNum(it.total)
          p.quantity += qty
          if (currency) addTo(p.value_by_currency, currency, lineTotal)
          const lineSar = toSar(lineTotal, currency, rates)
          if (lineSar !== null) p.value_sar += lineSar
        }
      }
    }

    // ── New vs returning customers ──────────────────────────────────────────
    // A "returning" customer purchased before the selected window; a "new"
    // customer's first purchase falls within it. Without a `date_from` bound
    // there is no "before", so all buyers are treated as new.
    let returningCustomers = 0
    if (customerIds.size > 0 && q.date_from) {
      try {
        const { data: prior } = await query.graph({
          entity: "order",
          filters: {
            customer_id: Array.from(customerIds),
            created_at: { $lt: new Date(q.date_from) },
          },
          fields: ["customer_id"],
          pagination: { take: MAX_ROWS, skip: 0 },
        })
        const priorSet = new Set(
          (prior ?? []).map((o: any) => String(o.customer_id)).filter(Boolean)
        )
        returningCustomers = Array.from(customerIds).filter((id) =>
          priorSet.has(id)
        ).length
      } catch {
        // Non-fatal: leave returning at 0 if the lookup fails.
      }
    }
    const newCustomers = customerIds.size - returningCustomers

    // ── Abandoned carts (optional, graceful) ────────────────────────────────
    let abandonedCarts = 0
    let abandonedRecovered = 0
    let abandonedRecoveryRate = 0
    try {
      const service = req.scope.resolve<AbandonedCartModuleService>(
        ABANDONED_CART_MODULE
      )
      const acFilters: Record<string, unknown> = {}
      if (createdAt) acFilters.created_at = createdAt
      const records = (await service.listAbandonedCartReminders(acFilters, {
        take: MAX_ROWS,
      })) as Array<Record<string, any>>
      abandonedCarts = records.length
      abandonedRecovered = records.filter((r) => Boolean(r.recovered)).length
      abandonedRecoveryRate =
        abandonedCarts > 0
          ? Math.round((abandonedRecovered / abandonedCarts) * 10000) / 100
          : 0
    } catch {
      // Abandoned-cart module unavailable — leave the KPI at 0.
    }

    // ── Low-stock count (optional, graceful) ────────────────────────────────
    let lowStockCount = 0
    const lowStockThreshold = 5
    try {
      const { data: levels } = await query.graph({
        entity: "inventory_level",
        fields: ["id", "stocked_quantity", "reserved_quantity"],
        pagination: { take: MAX_ROWS, skip: 0 },
      })
      lowStockCount = (levels ?? []).filter((lvl: any) => {
        const available = toNum(lvl.stocked_quantity) - toNum(lvl.reserved_quantity)
        return available <= lowStockThreshold
      }).length
    } catch {
      // Inventory module unavailable — leave the KPI at 0.
    }

    // ── Serialize ───────────────────────────────────────────────────────────
    const ordersTotal = orderList.length

    const aovByCurrency: Record<string, number> = {}
    for (const [cur, rev] of revenueByCurrency) {
      const count = ordersByCurrency.get(cur) ?? 0
      aovByCurrency[cur] = count > 0 ? round2(rev / count) : 0
    }

    const trendRows = Array.from(trend.entries())
      .map(([bucket, t]) => ({
        bucket,
        orders: t.orders,
        revenue_by_currency: Object.fromEntries(t.revenue_by_currency),
        revenue_sar: round2(t.revenue_sar),
      }))
      .sort((a, b) => (a.bucket < b.bucket ? -1 : 1))

    const paymentMixRows = Array.from(paymentMix.entries())
      .map(([method, pm]) => ({
        method,
        method_label: PAYMENT_METHOD_LABEL[method],
        orders: pm.orders,
        share:
          ordersTotal > 0 ? Math.round((pm.orders / ordersTotal) * 1000) / 10 : 0,
        value_by_currency: Object.fromEntries(pm.value_by_currency),
        value_sar: round2(pm.value_sar),
      }))
      .sort((a, b) => b.orders - a.orders)

    const byCityRows = Array.from(byCity.values())
      .map((c: any) => ({
        city: c.label as string,
        orders: c.orders as number,
        value_by_currency: Object.fromEntries(c.value_by_currency),
        value_sar: round2(c.value_sar),
      }))
      .sort((a, b) => b.value_sar - a.value_sar || b.orders - a.orders)

    const topProducts = Array.from(products.values())
      .map((p) => ({
        label: p.label,
        quantity: p.quantity,
        value_by_currency: Object.fromEntries(p.value_by_currency),
        value_sar: round2(p.value_sar),
      }))
      .sort((a, b) => b.quantity - a.quantity || b.value_sar - a.value_sar)
      .slice(0, top)

    nocache(res)
    res.status(200).json({
      range: { date_from: q.date_from ?? null, date_to: q.date_to ?? null },
      granularity,
      truncated,
      currencies: Array.from(currenciesSeen).sort(),
      fx: { enabled: fxEnabled, base: "SAR", rates },
      kpis: {
        orders_total: ordersTotal,
        orders_by_status: Object.fromEntries(ordersByStatus),
        revenue_by_currency: Object.fromEntries(revenueByCurrency),
        revenue_sar: round2(revenueSar),
        revenue_sar_excluded_currencies: Array.from(excludedCurrencies).sort(),
        aov_by_currency: aovByCurrency,
        customers_total: customerIds.size,
        customers_new: newCustomers,
        customers_returning: returningCustomers,
        abandoned_carts: abandonedCarts,
        abandoned_recovered: abandonedRecovered,
        abandoned_recovery_rate: abandonedRecoveryRate,
        low_stock_count: lowStockCount,
        low_stock_threshold: lowStockThreshold,
      },
      sales_trend: trendRows,
      payment_mix: paymentMixRows,
      by_city: byCityRows,
      top_products: topProducts,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
