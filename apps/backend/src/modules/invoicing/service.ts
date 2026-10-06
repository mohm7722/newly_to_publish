import { MedusaService } from "@medusajs/framework/utils"
import { Invoice } from "./models/invoice"

/** Snapshot data captured when an invoice is first issued. */
export type IssueInvoiceInput = {
  order_id: string
  document_type?: string
  invoice_number: string
  issued_by?: string | null
  currency_code: string
  total: number
  settlement_currency?: string | null
  settlement_total?: number | null
  fx_rate?: number | null
}

/**
 * InvoicingModuleService.
 *
 * Persists issued invoices in `invoicing_invoice`. Generated primitives:
 * `listInvoices` / `retrieveInvoice` / `createInvoices` / `updateInvoices` /
 * `deleteInvoices`. The actual number allocation is done by the caller via the
 * generic document-numbering library and passed in here, keeping numbering
 * (atomic sequences) cleanly separated from persistence.
 */
class InvoicingModuleService extends MedusaService({ Invoice }) {
  /** Find an existing invoice for an order + document type, or null. */
  async getByOrder(
    orderId: string,
    documentType = "order_invoice"
  ) {
    const [row] = await this.listInvoices(
      { order_id: orderId, document_type: documentType },
      { take: 1 }
    )
    return row ?? null
  }

  /** Persist a newly issued invoice snapshot. */
  async record(data: IssueInvoiceInput) {
    return await this.createInvoices({
      invoice_number: data.invoice_number,
      document_type: data.document_type ?? "order_invoice",
      order_id: data.order_id,
      issued_by: data.issued_by ?? null,
      currency_code: data.currency_code,
      total: data.total,
      settlement_currency: data.settlement_currency ?? null,
      settlement_total: data.settlement_total ?? null,
      fx_rate: data.fx_rate ?? null,
    })
  }
}

export default InvoicingModuleService
