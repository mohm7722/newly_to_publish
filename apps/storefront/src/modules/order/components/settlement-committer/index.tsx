"use client"

import { useEffect, useRef } from "react"

import { sdk } from "@lib/config"
import { commitOrderSettlement } from "@lib/data/settlement"

/**
 * Post-order FX snapshot committer (Requirement 7.9, Task 12.7).
 *
 * Rendered on the order-confirmed page. After an order is placed, this client
 * component records the FX conversion snapshot for the order by POSTing to the
 * backend store route `POST /store/orders/:id/settlement/commit`. The payload
 * captures the customer's selected display currency, the applied SAR-relative
 * conversion rate, and a commit timestamp.
 *
 * Currency resolution: when the FX context (`@lib/fx/context`, task 12.2) is
 * available it should be the source of truth via `useFx`; until it exists this
 * component degrades gracefully by reading the `fx_currency` cookie client-side
 * (it does not create the FX context itself). The applied rate is read from
 * `GET /store/fx/rates`.
 *
 * Safety: the commit runs at most once per order per browser session (guarded
 * by `sessionStorage` plus an in-render ref so React Strict Mode's double mount
 * does not double-post). All failures are swallowed and logged so the
 * confirmation page always renders.
 */

const SUPPORTED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const
type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]

// Storefront display default when the customer has made no prior selection
// (Requirement 7.3).
const DEFAULT_CURRENCY: CurrencyCode = "YER_NEW"

type FxRatesResponse = {
  base?: string
  rates?: Record<string, number>
  enabled?: string[]
}

function isSupported(value: string | null | undefined): value is CurrencyCode {
  return (
    !!value && (SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  )
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null
  }
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name + "=([^;]*)")
  )
  return match ? decodeURIComponent(match[1]) : null
}

function getSelectedCurrency(): CurrencyCode {
  const fromCookie = readCookie("fx_currency")
  return isSupported(fromCookie) ? fromCookie : DEFAULT_CURRENCY
}

async function resolveAppliedRate(
  currency: CurrencyCode
): Promise<number | null> {
  // SAR is the base currency, so its rate is implicitly 1.
  if (currency === "SAR") {
    return 1
  }

  try {
    const data = await sdk.client.fetch<FxRatesResponse>(`/store/fx/rates`, {
      method: "GET",
      cache: "no-store",
    })
    const rate = data?.rates?.[currency]
    return typeof rate === "number" ? rate : null
  } catch {
    return null
  }
}

const SettlementCommitter = ({ orderId }: { orderId: string }) => {
  // Guards against React Strict Mode's double effect invocation within a single
  // page load.
  const hasRun = useRef(false)

  useEffect(() => {
    if (!orderId || hasRun.current) {
      return
    }
    hasRun.current = true

    // Idempotency across re-mounts/reloads in the same tab: only commit once
    // per order per session.
    const sessionKey = `fx-settlement-committed:${orderId}`
    try {
      if (
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(sessionKey)
      ) {
        return
      }
    } catch {
      // sessionStorage may be unavailable (private mode); fall through and let
      // the server-side upsert remain idempotent.
    }

    const commit = async () => {
      const currency = getSelectedCurrency()
      const rate = await resolveAppliedRate(currency)

      try {
        await commitOrderSettlement(orderId, {
          ui: currency,
          rate,
          snapshot_at: new Date().toISOString(),
        })

        try {
          window.sessionStorage.setItem(sessionKey, "1")
        } catch {
          // Ignore storage failures; the commit itself succeeded.
        }
      } catch (error) {
        // Never break the confirmation page render on a failed commit.
        console.error("[settlement-committer] commit failed", error)
      }
    }

    void commit()
  }, [orderId])

  return null
}

export default SettlementCommitter
