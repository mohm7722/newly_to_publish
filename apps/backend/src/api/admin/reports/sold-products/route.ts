import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import {
  toNum,
  buildCreatedAtFilter,
  strParam,
} from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/sold-products
 *
 * Aggregates sold line items across orders. Supports a `group_by` dimension:
 *   - `product`  (default) — per product/variant
 *   - `category` — per product category
 *   - `currency` — per order currency
 *   - `region`   — per sales region
 *   - `city` / `province` — per shipping address city/province
 *
 * For each group it returns the total quantity sold, the number of distinct
 * orders, and the monetary value broken down per currency (so amounts in
 * different currencies are never silently summed together).
 *
 * Filters (query params): `date_from`, `date_to`, `currency_code`, `region_id`,
 * `city`, `province`, `category_id`. Gated by `orders:read`.
 */

const GROUPS = ["product", "category", "currency", "region", "city", "province"] as const
type Group = (typeof GROUPS)[number]

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "orders:read")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    const groupBy: Group = (GROUPS as readonly string[]).includes(q.group_by ?? "")
      ? (q.group_by as Group)
      : "product"

    const filters: Record<string, unknown> = {}
    const created = buildCreatedAtFilter(q.date_from, q.date_to)
    if (created) filters.created_at = created
    if (strParam(q.currency_code)) filters.currency_code = strParam(q.currency_code)
    if (strParam(q.region_id)) filters.region_id = strParam(q.region_id)

    const { data: orders } = await query.graph({
      entity: "order",
      filters,
      fields: [
        "id",
        "currency_code",
        // Selecting the order total activates Medusa's totals hydration for
        // the complete line items requested below.
        "total",
        "region_id",
        "region.name",
        "shipping_address.city",
        "shipping_address.province",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    const cityFilter = strParam(q.city)?.toLowerCase()
    const provinceFilter = strParam(q.province)?.toLowerCase()
    const categoryFilter = strParam(q.category_id)

    // Build a product → categories map only when needed (category grouping or filter).
    let productCategory = new Map<string, { id: string; name: string }>()
    if (groupBy === "category" || categoryFilter) {
      const productIds = new Set<string>()
      for (const o of orders ?? []) {
        for (const it of (o as any).items ?? []) {
          if (it.product_id) productIds.add(it.product_id)
        }
      }
      if (productIds.size > 0) {
        const { data: products } = await query.graph({
          entity: "product",
          filters: { id: Array.from(productIds) },
          fields: ["id", "categories.id", "categories.name"],
        })
        for (const p of products ?? []) {
          const cat = (p as any).categories?.[0]
          if (cat?.id) {
            productCategory.set((p as any).id, { id: cat.id, name: cat.name ?? cat.id })
          }
        }
      }
    }

    type Bucket = {
      group_key: string
      group_label: string
      quantity: number
      orders: Set<string>
      value_by_currency: Map<string, number>
    }
    const buckets = new Map<string, Bucket>()

    const bucketFor = (key: string, label: string): Bucket => {
      let b = buckets.get(key)
      if (!b) {
        b = {
          group_key: key,
          group_label: label,
          quantity: 0,
          orders: new Set(),
          value_by_currency: new Map(),
        }
        buckets.set(key, b)
      }
      return b
    }

    for (const o of orders ?? []) {
      const order = o as any
      const currency = (order.currency_code ?? "").toUpperCase()
      const city = order.shipping_address?.city ?? null
      const province = order.shipping_address?.province ?? null

      if (cityFilter && (city ?? "").toLowerCase() !== cityFilter) continue
      if (provinceFilter && (province ?? "").toLowerCase() !== provinceFilter) continue

      for (const it of order.items ?? []) {
        const cat = it.product_id ? productCategory.get(it.product_id) : undefined
        if (categoryFilter && cat?.id !== categoryFilter) continue

        let key: string
        let label: string
        switch (groupBy) {
          case "currency":
            key = currency || "—"
            label = currency || "—"
            break
          case "region":
            key = order.region_id ?? "—"
            label = order.region?.name ?? "بدون منطقة"
            break
          case "city":
            key = (city ?? "—").toLowerCase()
            label = city ?? "بدون مدينة"
            break
          case "province":
            key = (province ?? "—").toLowerCase()
            label = province ?? "بدون محافظة"
            break
          case "category":
            key = cat?.id ?? "uncat"
            label = cat?.name ?? "غير مصنّف"
            break
          case "product":
          default: {
            key = it.product_id || it.title || "—"
            const name = it.product_title || it.title || "—"
            label = it.variant_title ? `${name} — ${it.variant_title}` : name
            break
          }
        }

        const b = bucketFor(key, label)
        b.quantity += toNum(it.quantity)
        b.orders.add(order.id)
        if (currency) {
          b.value_by_currency.set(
            currency,
            (b.value_by_currency.get(currency) ?? 0) + toNum(it.total)
          )
        }
      }
    }

    const rows = Array.from(buckets.values())
      .map((b) => ({
        group_key: b.group_key,
        group_label: b.group_label,
        quantity: b.quantity,
        orders: b.orders.size,
        value_by_currency: Object.fromEntries(b.value_by_currency),
      }))
      .sort((a, b) => b.quantity - a.quantity)

    const totalQuantity = rows.reduce((s, r) => s + r.quantity, 0)
    const totalsByCurrency = new Map<string, number>()
    for (const b of buckets.values()) {
      for (const [cur, amt] of b.value_by_currency) {
        totalsByCurrency.set(cur, (totalsByCurrency.get(cur) ?? 0) + amt)
      }
    }

    nocache(res)
    res.status(200).json({
      group_by: groupBy,
      rows,
      count: rows.length,
      totals: {
        quantity: totalQuantity,
        value_by_currency: Object.fromEntries(totalsByCurrency),
      },
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
