/**
 * GA4 Measurement Protocol (server-side) dispatch.
 *
 * Sends a server `purchase` event to Google Analytics 4. `transaction_id` is
 * the order id, matching the browser gtag/GTM purchase so GA4 deduplicates.
 * Hashed user-provided data is attached for Enhanced Conversions (which flow to
 * Google Ads when the GA4 property is linked).
 *
 * Note: when the browser GA client id is not forwarded to the server, a
 * deterministic fallback `client_id` derived from the order id is used so the
 * event is still accepted; session stitching is best handled by the
 * browser-side event, while this server event guarantees the conversion is
 * recorded even if the browser event is blocked.
 */

import type { Ga4Config } from "./config"
import { hashEmail, hashPhone } from "./hash"
import type { DispatchResult, PurchaseEvent } from "./types"

export async function sendGa4Purchase(
  ev: PurchaseEvent,
  cfg: Ga4Config
): Promise<DispatchResult> {
  const clientId = ev.clientId || `${Date.now()}.${ev.orderId}`

  const userData: Record<string, unknown> = {}
  const em = hashEmail(ev.email)
  if (em) userData.sha256_email_address = em
  const ph = hashPhone(ev.phone)
  if (ph) userData.sha256_phone_number = ph

  const body = {
    client_id: clientId,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: ev.orderId,
          currency: ev.currency,
          value: ev.value,
          items: ev.items.map((i) => ({
            item_id: i.id,
            item_name: i.name,
            quantity: i.quantity,
            price: i.price,
          })),
        },
      },
    ],
    ...(Object.keys(userData).length > 0 ? { user_data: userData } : {}),
  }

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(
    cfg.measurementId
  )}&api_secret=${encodeURIComponent(cfg.apiSecret)}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    // GA4 MP returns 204 No Content on success.
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { provider: "ga4", ok: false, status: res.status, error: text.slice(0, 500) }
    }
    return { provider: "ga4", ok: true, status: res.status }
  } catch (error) {
    return { provider: "ga4", ok: false, error: (error as Error)?.message }
  }
}
