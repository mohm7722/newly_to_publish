import { useQuery } from "@tanstack/react-query"
import { adminFetch } from "../admin-fetch"

/** Shape returned by `GET /admin/invoices/:orderId`. */
export type InvoiceData = {
  invoice: {
    number: string
    issued_at: string
    order_id: string
    order_display_id: number
  }
  settings: {
    store_name: string
    logo_url: string | null
    address: string
    phone: string
    email: string
    website: string
    tax_number: string
    footer_note: string
  }
  order: {
    display_id: number
    created_at: string
    currency_code: string
    email: string | null
    customer: { first_name?: string; last_name?: string; phone?: string } | null
    shipping_address: {
      first_name?: string
      last_name?: string
      phone?: string
      address_1?: string
      address_2?: string
      city?: string
      province?: string
      postal_code?: string
    } | null
    items: {
      title: string
      variant_title: string | null
      quantity: number
      unit_price: number
      total: number
    }[]
    totals: {
      subtotal: number
      shipping_total: number
      tax_total: number
      discount_total: number
      total: number
    }
    notes: string | null
  }
  payment: {
    provider_id: string | null
    method_label: string
    status: string | null
    is_bank_transfer: boolean
  }
  bank_accounts: {
    bank_name: string
    account_number: string
    currency_code: string
    instructions: string | null
  }[]
  settlement: {
    currency_code: string
    base_currency_code: string
    total: number
    rate: number
  } | null
}

/** Fetch the assembled invoice data for an order. */
export function useInvoiceData(orderId?: string) {
  return useQuery({
    queryKey: ["admin", "invoices", orderId],
    queryFn: () => adminFetch<InvoiceData>(`/admin/invoices/${orderId}`),
    enabled: Boolean(orderId),
    retry: false,
  })
}
