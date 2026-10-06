import { CreditCard } from "@medusajs/icons"
import Bancontact from "@modules/common/icons/bancontact"
import Ideal from "@modules/common/icons/ideal"
import PayPal from "@modules/common/icons/paypal"
import React from "react"

/*
 * Offline payment methods (Requirements 7.7, 7.8).
 *
 * Both Cash-on-Delivery and manual bank transfer complete the order through the
 * core Medusa manual payment provider (`pp_system_default`). Since a single
 * provider backs both options, the storefront tracks which offline option the
 * customer selected with a method discriminator string instead of the provider
 * id. `MANUAL_PROVIDER_ID` is used when initiating the payment session and
 * completing the order; the discriminators below identify the selected offline
 * UI option.
 */
export const MANUAL_PROVIDER_ID = "pp_system_default"
export const COD_PAYMENT_METHOD = "cod"
export const MANUAL_BANK_TRANSFER_METHOD = "manual_bank_transfer"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "بطاقة ائتمان",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "بطاقة ائتمان",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "دفع يدوي",
    icon: <CreditCard />,
  },
  // Offline payment methods (tracked by discriminator, backed by pp_system_default)
  [COD_PAYMENT_METHOD]: {
    title: "الدفع عند الاستلام (COD)",
    icon: <CreditCard />,
  },
  [MANUAL_BANK_TRANSFER_METHOD]: {
    title: "التحويل البنكي اليدوي",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

/*
 * Offline method discriminators (Requirements 7.7, 7.8). These identify the
 * selected offline checkout option; both ultimately complete via the manual
 * provider (`MANUAL_PROVIDER_ID` / `pp_system_default`).
 */
export const isCODPayment = (method?: string) => {
  return method === COD_PAYMENT_METHOD
}

export const isManualBankTransfer = (method?: string) => {
  return method === MANUAL_BANK_TRANSFER_METHOD
}

export const isOfflinePayment = (method?: string) => {
  return isCODPayment(method) || isManualBankTransfer(method)
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
