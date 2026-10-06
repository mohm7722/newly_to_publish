/**
 * Meta Conversions API (server-side) dispatch.
 *
 * Sends a server `Purchase` event to Meta's Graph API. The `event_id` matches
 * the browser Pixel's `eventID` for the same order, so Meta deduplicates the
 * browser and server events. Customer identifiers are SHA-256 hashed before
 * transmission (see `./hash`).
 */

import type { MetaConfig } from "./config"
import { hashEmail, hashPhone, hashText } from "./hash"
import type { DispatchResult, PurchaseEvent } from "./types"

export async function sendMetaPurchase(
  ev: PurchaseEvent,
  cfg: MetaConfig
): Promise<DispatchResult> {

  const userData: Record<string, unknown> = {}
  const em = hashEmail(ev.email)
  if (em) userData.em = [em]
  const ph = hashPhone(ev.phone)
  if (ph) userData.ph = [ph]
  const fn = hashText(ev.firstName)
  if (fn) userData.fn = [fn]
  const ln = hashText(ev.lastName)
  if (ln) userData.ln = [ln]
  const ct = hashText(ev.city)
  if (ct) userData.ct = [ct]
  if (ev.fbp) userData.fbp = ev.fbp
  if (ev.fbc) userData.fbc = ev.fbc
  if (ev.clientIpAddress) userData.client_ip_address = ev.clientIpAddress
  if (ev.clientUserAgent) userData.client_user_agent = ev.clientUserAgent

  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: ev.eventId,
        action_source: "website",
        ...(ev.eventSourceUrl ? { event_source_url: ev.eventSourceUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: ev.currency,
          value: ev.value,
          order_id: ev.orderId,
          num_items: ev.items.reduce((s, i) => s + (i.quantity ?? 0), 0),
          content_type: "product",
          content_ids: ev.items.map((i) => i.id),
          contents: ev.items.map((i) => ({
            id: i.id,
            quantity: i.quantity ?? 1,
            item_price: i.price,
          })),
        },
      },
    ],
    ...(cfg.testEventCode ? { test_event_code: cfg.testEventCode } : {}),
  }

  const url = `https://graph.facebook.com/${cfg.apiVersion}/${cfg.pixelId}/events?access_token=${encodeURIComponent(
    cfg.accessToken
  )}`

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      return { provider: "meta", ok: false, status: res.status, error: text.slice(0, 500) }
    }
    return { provider: "meta", ok: true, status: res.status }
  } catch (error) {
    return { provider: "meta", ok: false, error: (error as Error)?.message }
  }
}
