"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

type CommitSettlementInput = {
  ui: "SAR" | "YER_NEW" | "YER_OLD"
  rate: number | null
  snapshot_at: string
}

type CommitSettlementResponse = {
  ok: true
  order_id: string
  currency_code: string
  total: number
}

export async function commitOrderSettlement(
  orderId: string,
  input: CommitSettlementInput
): Promise<CommitSettlementResponse> {
  if (!orderId) {
    throw new Error("Order id is required")
  }

  // Guest checkout is supported, so an order is not required to belong to a
  // signed-in customer. Forward the bearer token when there is one (a
  // registered customer's order is authorized by it on the backend) and omit it
  // otherwise — a guest order is authorized by possession of the order id, the
  // same model Medusa applies to `GET /store/orders/:id`.
  //
  // This used to throw `Customer authentication is required` for every guest,
  // which surfaced on the order-confirmed page as a failed server action: Next
  // masks server action errors in production builds, so the browser only showed
  // "An error occurred in the Server Components render…" with a digest.
  const headers = await getAuthHeaders()

  return sdk.client.fetch<CommitSettlementResponse>(
    `/store/orders/${encodeURIComponent(orderId)}/settlement/commit`,
    {
      method: "POST",
      body: input,
      headers,
      cache: "no-store",
    }
  )
}