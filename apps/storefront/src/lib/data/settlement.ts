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

  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) {
    throw new Error("Customer authentication is required")
  }

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