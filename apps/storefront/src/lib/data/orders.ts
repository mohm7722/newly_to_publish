"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { getAuthHeaders } from "./cookies"
import { HttpTypes } from "@medusajs/types"

type SdkError = {
  status?: number
  statusCode?: number
  statusText?: string
  message?: string
  response?: { status?: number }
}

function isUnauthorizedError(error: unknown): boolean {
  const err = error as SdkError
  return (
    err.status === 401 ||
    err.statusCode === 401 ||
    err.response?.status === 401 ||
    err.statusText?.toLowerCase() === "unauthorized" ||
    err.message?.toLowerCase() === "unauthorized"
  )
}

export const retrieveOrder = async (id: string) => {
  const authHeaders = await getAuthHeaders()

  if (!("authorization" in authHeaders)) {
    return null
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderResponse>(`/store/orders/${id}`, {
      method: "GET",
      query: {
        fields:
          "*payment_collections.payments,*items,*items.metadata,*items.variant,*items.product",
      },
      headers: authHeaders,
      cache: "no-store",
    })
    .then(({ order }) => order)
    .catch((err) => (isUnauthorizedError(err) ? null : medusaError(err)))
}

export const listOrders = async (
  limit: number = 10,
  offset: number = 0,
  filters?: Record<string, unknown>
): Promise<HttpTypes.StoreOrder[] | null> => {
  const authHeaders = await getAuthHeaders()

  if (!("authorization" in authHeaders)) {
    return null
  }

  return sdk.client
    .fetch<HttpTypes.StoreOrderListResponse>(`/store/orders`, {
      method: "GET",
      query: {
        limit,
        offset,
        order: "-created_at",
        fields: "*items,+items.metadata,*items.variant,*items.product",
        ...filters,
      },
      headers: authHeaders,
      cache: "no-store",
    })
    .then(({ orders }) => orders)
    .catch((err) => (isUnauthorizedError(err) ? null : medusaError(err)))
}

export const createTransferRequest = async (
  state: {
    success: boolean
    error: string | null
    order: HttpTypes.StoreOrder | null
  },
  formData: FormData
): Promise<{
  success: boolean
  error: string | null
  order: HttpTypes.StoreOrder | null
}> => {
  const id = formData.get("order_id") as string

  if (!id) {
    return { success: false, error: "رقم الطلب مطلوب", order: null }
  }

  const headers = await getAuthHeaders()

  return await sdk.store.order
    .requestTransfer(
      id,
      {},
      {
        fields: "id, email",
      },
      headers
    )
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const acceptTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .acceptTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}

export const declineTransferRequest = async (id: string, token: string) => {
  const headers = await getAuthHeaders()

  return await sdk.store.order
    .declineTransfer(id, { token }, {}, headers)
    .then(({ order }) => ({ success: true, error: null, order }))
    .catch((err) => ({ success: false, error: err.message, order: null }))
}
