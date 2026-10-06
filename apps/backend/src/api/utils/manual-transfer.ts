import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"

export const TRANSFER_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const
export type TransferCurrency = (typeof TRANSFER_CURRENCIES)[number]

export function isTransferCurrency(value: unknown): value is TransferCurrency {
  return typeof value === "string" && (TRANSFER_CURRENCIES as readonly string[]).includes(value)
}

export function actorId(req: MedusaRequest): string | null {
  return ((req as unknown as { auth_context?: { actor_id?: string } }).auth_context?.actor_id) ?? null
}

export function requireCustomer(req: MedusaRequest, res: MedusaResponse): string | null {
  const id = actorId(req)
  if (!id) res.status(401).json({ message: "يجب تسجيل الدخول" })
  return id
}

export async function ownedCart(req: MedusaRequest, cartId: string, customerId: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "customer.id", "total", "metadata"],
    filters: { id: cartId },
  })
  const cart = data?.[0] as any
  const ownerId = cart?.customer_id ?? cart?.customer?.id
  if (!cart || ownerId !== customerId) return null
  return cart
}

export async function ownedOrder(req: MedusaRequest, orderId: string, customerId: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "customer.id", "payment_collections.id"],
    filters: { id: orderId },
  })
  const order = data?.[0] as any
  const ownerId = order?.customer_id ?? order?.customer?.id
  if (!order || ownerId !== customerId) return null
  return order
}
export function publicSubmission(submission: any, includeInternal = false) {
  const result: Record<string, unknown> = {
    id: submission.id,
    cart_id: submission.cart_id,
    order_id: submission.order_id,
    status: submission.status,
    bank_account_id: submission.bank_account_id,
    bank_name: submission.bank_name,
    account_number: submission.account_number,
    currency_code: submission.currency_code,
    expected_amount: Number(submission.expected_amount),
    base_amount: Number(submission.base_amount),
    fx_rate: Number(submission.fx_rate),
    proof_original_name: submission.proof_original_name,
    proof_mime_type: submission.proof_mime_type,
    proof_size: Number(submission.proof_size),
    proof_sha256: submission.proof_sha256,
    submitted_at: submission.submitted_at,
    reviewed_at: submission.reviewed_at,
    rejection_reason: submission.rejection_reason,
  }
  if (includeInternal) {
    result.customer_id = submission.customer_id
    result.reviewed_by = submission.reviewed_by
  }
  return result
}

export function handleManualTransferError(error: unknown, res: MedusaResponse): void {
  if (error instanceof MedusaError) {
    const status = error.type === MedusaError.Types.NOT_FOUND ? 404 : 400
    res.status(status).json({ message: error.message })
    return
  }
  res.status(500).json({
    message: "تعذر تنفيذ عملية التحويل البنكي",
  })
}
