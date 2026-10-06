"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/**
 * Offline payment data helpers (Requirements 7.7, 7.8).
 *
 * These read the publishable-key-gated store routes exposed by the backend
 * Payments module:
 *  - `GET /store/payments/bank-accounts` returns only **active** bank accounts,
 *    projected to the customer-facing fields used for checkout display.
 *  - `GET /store/payments/cod-settings` returns the COD settings together with
 *    an `available` boolean for the (optional) cart shipping city.
 *
 * The Medusa JS SDK client (`sdk.client`) automatically injects the
 * `x-publishable-api-key` header configured in `@lib/config`, so no manual key
 * handling is required here. Responses are read with `no-store` because the
 * backend serves them with no-cache headers (availability and active-flag
 * state are dynamic).
 */

/** Customer-facing bank account shape returned by the store route. */
export type StoreBankAccount = {
  id: string
  bank_name: string
  account_number: string
  currency_code: string
  instructions: string | null
}

export type ManualTransferStatus = "submitted" | "rejected" | "approved"

export type ManualTransferSubmission = {
  id: string
  cart_id: string | null
  order_id: string | null
  status: ManualTransferStatus
  bank_account_id: string
  bank_name: string
  account_number: string
  currency_code: string
  expected_amount: number
  base_amount: number
  fx_rate: number
  proof_original_name: string
  proof_mime_type: string
  proof_size: number
  proof_sha256: string
  submitted_at: string
  reviewed_at: string | null
  rejection_reason: string | null
}

/** COD settings shape returned by the store route. */
export type StoreCodSettings = {
  id?: string
  enabled: boolean
  instructions: string | null
  selected_city_ids: string[] | null
}

/** Combined COD settings + availability payload returned by the store route. */
export type StoreCodSettingsResponse = {
  cod_settings: StoreCodSettings
  available: boolean
}

const DEFAULT_COD_RESPONSE: StoreCodSettingsResponse = {
  cod_settings: {
    enabled: false,
    instructions: null,
    selected_city_ids: null,
  },
  available: false,
}

/**
 * List the active bank accounts available for manual bank transfer checkout.
 *
 * @returns The active bank accounts, or an empty array on failure.
 */
export const listBankAccounts = async (
  currencyCode: string
): Promise<StoreBankAccount[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{ bank_accounts: StoreBankAccount[] }>(
      `/store/payments/bank-accounts`,
      {
        method: "GET",
        query: { currency_code: currencyCode },
        headers,
        cache: "no-store",
      }
    )
    .then(({ bank_accounts }) => bank_accounts ?? [])
    .catch(() => [])
}

/**
 * Read the COD settings together with availability for the cart shipping city.
 *
 * @param cityId Optional shipping city id used to resolve COD availability.
 *   When omitted, a configured city restriction yields `available: false`.
 * @returns The COD settings and availability, or disabled defaults on failure.
 */
export const getCodSettings = async (
  cityId?: string
): Promise<StoreCodSettingsResponse> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<StoreCodSettingsResponse>(`/store/payments/cod-settings`, {
      method: "GET",
      query: cityId ? { city_id: cityId } : undefined,
      headers,
      cache: "no-store",
    })
    .then((resp) => resp ?? DEFAULT_COD_RESPONSE)
    .catch(() => DEFAULT_COD_RESPONSE)
}

function backendUrl(): string {
  return (
    process.env.MEDUSA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
    "http://localhost:9000"
  ).replace(/\/$/, "")
}

async function rawProofUpload(
  path: string,
  file: File
): Promise<ManualTransferSubmission | null> {
  const auth = await getAuthHeaders()
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
  const response = await fetch(`${backendUrl()}${path}`, {
    method: "POST",
    headers: {
      ...auth,
      ...(publishableKey ? { "x-publishable-api-key": publishableKey } : {}),
      "content-type": file.type || "application/octet-stream",
      "content-length": String(file.size),
      "x-file-name": encodeURIComponent(file.name),
    },
    body: Buffer.from(await file.arrayBuffer()),
    cache: "no-store",
  })
  const payload = (await response.json().catch(() => ({}))) as {
    message?: string
    manual_transfer?: ManualTransferSubmission
  }
  if (!response.ok) throw new Error(payload.message || "تعذر رفع إشعار الإيداع")
  return payload.manual_transfer ?? null
}

export async function getCartManualTransfer(cartId: string) {
  const headers = await getAuthHeaders()
  return sdk.client.fetch<{ manual_transfer: ManualTransferSubmission | null }>(
    `/store/carts/${cartId}/manual-transfer`,
    { method: "GET", headers, cache: "no-store" }
  ).then((result) => result.manual_transfer).catch(() => null)
}

export async function clearCartManualTransfer(cartId: string): Promise<void> {
  const headers = await getAuthHeaders()
  await sdk.client.fetch(`/store/carts/${cartId}/manual-transfer`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  })
}

export async function uploadCartManualTransferProof(formData: FormData) {
  const cartId = String(formData.get("cart_id") || "")
  const bankAccountId = String(formData.get("bank_account_id") || "")
  const currencyCode = String(formData.get("currency_code") || "")
  const file = formData.get("proof")
  if (!cartId || !bankAccountId || !currencyCode || !(file instanceof File)) {
    throw new Error("بيانات التحويل أو ملف الإشعار غير مكتملة")
  }
  return rawProofUpload(
    `/store/carts/${encodeURIComponent(cartId)}/manual-transfer/proof?bank_account_id=${encodeURIComponent(bankAccountId)}&currency_code=${encodeURIComponent(currencyCode)}`,
    file
  )
}

export async function getOrderManualTransfer(orderId: string) {
  const headers = await getAuthHeaders()
  return sdk.client.fetch<{ manual_transfer: ManualTransferSubmission | null }>(
    `/store/orders/${orderId}/manual-transfer`,
    { method: "GET", headers, cache: "no-store" }
  ).then((result) => result.manual_transfer).catch(() => null)
}

export async function reuploadOrderManualTransferProof(formData: FormData) {
  const orderId = String(formData.get("order_id") || "")
  const file = formData.get("proof")
  if (!orderId || !(file instanceof File)) {
    throw new Error("ملف إشعار الإيداع مطلوب")
  }
  await rawProofUpload(
    `/store/orders/${encodeURIComponent(orderId)}/manual-transfer/proof`,
    file
  )
}
