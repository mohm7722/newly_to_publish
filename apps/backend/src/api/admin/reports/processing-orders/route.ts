import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/processing-orders
 *
 * Returns the orders that are currently "in processing" (قيد التجهيز), with
 * professional filters. Gated by `orders.processing.view` (delegated namespace).
 *
 * Definition of "processing":
 *   - not canceled (`status != canceled`)
 *   - payment captured/authorized OR cash-on-delivery
 *   - `fulfillment_status ∈ { not_fulfilled, partially_fulfilled }`
 *     (fully `fulfilled` orders are excluded)
 *
 * Supported filters (query params): `date_from`, `date_to` (ISO dates), `city`,
 * `province`, `payment_status`, `payment_method` (`cod` | `bank_transfer`),
 * `sales_channel_id`, `customer` (matches email/name), `q` (order number).
 */

const PROCESSING_FULFILLMENT = ["not_fulfilled", "partially_fulfilled"]
const PAID_STATUSES = new Set([
  "authorized",
  "partially_authorized",
  "captured",
  "partially_captured",
])

function isCod(providerId?: string): boolean {
  if (!providerId) return false
  const id = providerId.toLowerCase()
  return id.includes("cod") || id.includes("cash")
}

function isBankTransfer(providerId?: string): boolean {
  if (!providerId) return false
  const id = providerId.toLowerCase()
  if (isCod(id)) return false
  return (
    id.includes("transfer") ||
    id.includes("bank") ||
    id.includes("manual") ||
    id.includes("system")
  )
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "orders.processing.view")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    // Base filters applied in the query. NOTE: `status` and `fulfillment_status`
    // are computed order properties and cannot be filtered via query.graph, so
    // they are filtered in JS below.
    const filters: Record<string, unknown> = {}

    if (q.date_from || q.date_to) {
      const created: Record<string, unknown> = {}
      if (q.date_from) created.$gte = new Date(q.date_from)
      if (q.date_to) {
        // inclusive end-of-day
        const end = new Date(q.date_to)
        end.setHours(23, 59, 59, 999)
        created.$lte = end
      }
      filters.created_at = created
    }
    if (q.sales_channel_id) {
      filters.sales_channel_id = q.sales_channel_id
    }
    if (q.q) {
      const num = Number(String(q.q).replace(/[^0-9]/g, ""))
      if (Number.isFinite(num) && num > 0) {
        filters.display_id = num
      }
    }

    const { data: orders } = await query.graph({
      entity: "order",
      filters,
      fields: [
        "id",
        "display_id",
        "email",
        "status",
        "fulfillment_status",
        "payment_status",
        "currency_code",
        "created_at",
        "total",
        "shipping_address.city",
        "shipping_address.province",
        "customer.id",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "sales_channel.id",
        "sales_channel.name",
        "payment_collections.status",
        "payment_collections.payments.provider_id",
        "items.*",
      ],
      pagination: { take: 1000, skip: 0, order: { created_at: "DESC" } },
    })

    const cityFilter = q.city?.trim().toLowerCase()
    const provinceFilter = q.province?.trim().toLowerCase()
    const paymentStatusFilter = q.payment_status?.trim()
    const paymentMethodFilter = q.payment_method?.trim() // cod | bank_transfer
    const customerFilter = q.customer?.trim().toLowerCase()

    const rows = (orders ?? [])
      .filter((o: any) => o.status !== "canceled")
      .filter((o: any) => PROCESSING_FULFILLMENT.includes(o.fulfillment_status))
      .map((o: any) => {
        const provider = o.payment_collections?.[0]?.payments?.[0]?.provider_id
        const cod = isCod(provider)
        const method = cod
          ? "cod"
          : isBankTransfer(provider)
            ? "bank_transfer"
            : "other"
        const fullName = [o.customer?.first_name, o.customer?.last_name]
          .filter(Boolean)
          .join(" ")
        return {
          id: o.id,
          display_id: o.display_id,
          created_at: o.created_at,
          customer_name: fullName || "—",
          email: o.email ?? o.customer?.email ?? null,
          city: o.shipping_address?.city ?? null,
          province: o.shipping_address?.province ?? null,
          total: toNum(o.total),
          currency_code: o.currency_code,
          payment_status: o.payment_status,
          payment_method: method,
          payment_provider_id: provider ?? null,
          fulfillment_status: o.fulfillment_status,
          sales_channel: o.sales_channel?.name ?? null,
          _cod: cod,
        }
      })
      // processing payment condition: paid/authorized OR COD
      .filter((r: any) => r._cod || PAID_STATUSES.has(r.payment_status))
      // optional JS filters
      .filter((r: any) =>
        cityFilter ? (r.city ?? "").toLowerCase().includes(cityFilter) : true
      )
      .filter((r: any) =>
        provinceFilter
          ? (r.province ?? "").toLowerCase().includes(provinceFilter)
          : true
      )
      .filter((r: any) =>
        paymentStatusFilter ? r.payment_status === paymentStatusFilter : true
      )
      .filter((r: any) =>
        paymentMethodFilter ? r.payment_method === paymentMethodFilter : true
      )
      .filter((r: any) =>
        customerFilter
          ? `${r.customer_name} ${r.email ?? ""}`
              .toLowerCase()
              .includes(customerFilter)
          : true
      )
      .map(({ _cod, ...rest }: any) => rest)

    nocache(res)
    res.status(200).json({ orders: rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
