import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission, getAdminIdentity } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { nextDocumentNumber } from "../../../../lib/documents/numbering"
import { InvoiceSettingsService } from "../../../../lib/invoice-settings"
import { INVOICING_MODULE } from "../../../../modules/invoicing"
import type InvoicingModuleService from "../../../../modules/invoicing/service"
import { SETTLEMENT_MODULE } from "../../../../modules/settlement"
import type SettlementModuleService from "../../../../modules/settlement/service"
import { PAYMENTS_MODULE } from "../../../../modules/payments"
import type PaymentsModuleService from "../../../../modules/payments/service"
import { toNum } from "../../../../lib/reports/shared"

/**
 * GET /admin/invoices/:orderId
 *
 * Assembles the full data needed to render/print an order invoice and issues a
 * stable, independent invoice number on first access (reused thereafter).
 * Gated by `orders.invoice.print` (delegated namespace).
 *
 * Returns: invoice meta (number/date), store/invoice settings, the order with
 * its items/totals/addresses/customer, payment method+status, bank accounts
 * (when the payment method is a bank transfer), and settlement/FX (when set).
 */

/** Heuristic: does this payment provider represent a bank transfer (vs COD)? */
function isBankTransfer(providerId?: string): boolean {
  if (!providerId) return false
  const id = providerId.toLowerCase()
  if (id.includes("cod") || id.includes("cash")) return false
  return id.includes("transfer") || id.includes("bank") || id.includes("manual") || id.includes("system")
}

/** Human label for a payment provider id. */
function paymentLabel(providerId?: string): string {
  if (!providerId) return "غير محدد"
  const id = providerId.toLowerCase()
  if (id.includes("cod") || id.includes("cash")) return "الدفع عند الاستلام"
  if (isBankTransfer(id)) return "تحويل بنكي"
  return providerId
}

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "orders.invoice.print")) {
    return
  }

  const orderId = req.params.orderId

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      filters: { id: orderId },
      fields: [
        "id",
        "display_id",
        "email",
        "currency_code",
        "created_at",
        "total",
        "item_total",
        "shipping_total",
        "tax_total",
        "discount_total",
        "metadata",
        // Match Medusa's orders-list workflow so computed item/order totals
        // are hydrated from the complete line-item data.
        "items.*",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.phone",
        "shipping_address.address_1",
        "shipping_address.address_2",
        "shipping_address.city",
        "shipping_address.province",
        "shipping_address.postal_code",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "customer.phone",
        "payment_collections.status",
        "payment_collections.payments.provider_id",
        "payment_collections.payments.amount",
      ],
    })

    const order = orders?.[0]
    if (!order) {
      res.status(404).json({ message: "Order not found" })
      return
    }

    // Payment method + status
    const paymentCollection = order.payment_collections?.[0]
    const payment = paymentCollection?.payments?.[0]
    const providerId: string | undefined = payment?.provider_id
    const bankTransfer = isBankTransfer(providerId)

    // Settlement (optional)
    const settlementSvc = req.scope.resolve<SettlementModuleService>(
      SETTLEMENT_MODULE
    )
    const settlement = await settlementSvc.getSettlement(orderId)

    // Issue (or reuse) the invoice number
    const invoicing = req.scope.resolve<InvoicingModuleService>(
      INVOICING_MODULE
    )
    let invoice = await invoicing.getByOrder(orderId, "order_invoice")
    if (!invoice) {
      const number = await nextDocumentNumber(req.scope, "order_invoice")
      invoice = await invoicing.record({
        order_id: orderId,
        invoice_number: number,
        issued_by: getAdminIdentity(req),
        currency_code: order.currency_code,
        total: toNum(order.total),
        settlement_currency: settlement?.currency_code ?? null,
        settlement_total: settlement ? toNum(settlement.total) : null,
        fx_rate: settlement ? toNum(settlement.rate) : null,
      })
    }

    // Bank accounts (only when paying by bank transfer)
    let bankAccounts: unknown[] = []
    if (bankTransfer) {
      const paymentsSvc = req.scope.resolve<PaymentsModuleService>(
        PAYMENTS_MODULE
      )
      bankAccounts = await paymentsSvc.listBankAccounts({ is_active: true })
    }

    // Invoice/store settings
    const settings = await new InvoiceSettingsService(req.scope).get()

    nocache(res)
    res.status(200).json({
      invoice: {
        number: invoice.invoice_number,
        issued_at: invoice.created_at,
        order_id: orderId,
        order_display_id: order.display_id,
      },
      settings,
      order: {
        display_id: order.display_id,
        created_at: order.created_at,
        currency_code: order.currency_code,
        email: order.email ?? order.customer?.email ?? null,
        customer: order.customer ?? null,
        shipping_address: order.shipping_address ?? null,
        items: (order.items ?? []).map((it: any) => ({
          title: it.product_title || it.title,
          variant_title: it.variant_title ?? null,
          quantity: toNum(it.quantity),
          unit_price: toNum(it.unit_price),
          total: toNum(it.total),
        })),
        totals: {
          subtotal: toNum(order.item_total),
          shipping_total: toNum(order.shipping_total),
          tax_total: toNum(order.tax_total),
          discount_total: toNum(order.discount_total),
          total: toNum(order.total),
        },
        notes:
          (order.metadata && (order.metadata as any).note) ||
          (order.metadata && (order.metadata as any).notes) ||
          null,
      },
      payment: {
        provider_id: providerId ?? null,
        method_label: paymentLabel(providerId),
        status: paymentCollection?.status ?? null,
        is_bank_transfer: bankTransfer,
      },
      bank_accounts: bankAccounts,
      settlement: settlement
        ? {
            currency_code: settlement.currency_code,
            base_currency_code: settlement.base_currency_code,
            total: toNum(settlement.total),
            rate: toNum(settlement.rate),
          }
        : null,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
