import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  requestActorId,
  resolveCartAccess,
  resolveOrderAccess,
  type CartAccess,
} from "./cart-access"

export const TRANSFER_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const
export type TransferCurrency = (typeof TRANSFER_CURRENCIES)[number]

export function isTransferCurrency(value: unknown): value is TransferCurrency {
  return typeof value === "string" && (TRANSFER_CURRENCIES as readonly string[]).includes(value)
}

export function actorId(req: MedusaRequest): string | null {
  return requestActorId(req)
}

/**
 * Load a cart the caller is allowed to act on, guest carts included.
 *
 * Replaces the previous `ownedCart` helper, which required an authenticated
 * customer whose id matched `cart.customer_id` and therefore made the manual
 * bank-transfer flow unreachable for guest checkout. Authorization is now
 * delegated to {@link resolveCartAccess}: registered customers' carts still
 * require a matching actor, while guest carts are authorized by possession of
 * the cart id.
 *
 * @returns `{ cart, access }`, or `null` when the cart does not exist or the
 *   caller is not allowed to act on it.
 */
export async function accessibleCart(req: MedusaRequest, cartId: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id", "customer.id", "total", "metadata"],
    filters: { id: cartId },
  })
  const cart = data?.[0] as any
  if (!cart) return null

  const access = await resolveCartAccess(
    req.scope,
    { id: cart.id, customer_id: cart.customer_id ?? cart.customer?.id ?? null },
    requestActorId(req)
  )
  if (!access.authorized) return null
  return { cart, access }
}

/**
 * Load an order the caller is allowed to read, guest orders included.
 *
 * Mirrors {@link accessibleCart}. Guest orders are authorized by possession of
 * the order id — the same model Medusa itself applies to
 * `GET /store/orders/:id`, which ships without an authentication middleware.
 */
export async function accessibleOrder(req: MedusaRequest, orderId: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "customer.id", "payment_collections.id"],
    filters: { id: orderId },
  })
  const order = data?.[0] as any
  if (!order) return null

  const access = await resolveOrderAccess(
    req.scope,
    { id: order.id, customer_id: order.customer_id ?? order.customer?.id ?? null },
    requestActorId(req)
  )
  if (!access.authorized) return null
  return { order, access }
}

/**
 * The owner token a stored submission must be checked against.
 *
 * For a registered customer this is their customer id, so a submission created
 * by another account never matches. For a guest the route has already
 * authorized the caller through possession of the cart/order id, and the guest
 * owner token is derived from the cart the submission belongs to — so the
 * submission's own stored owner is the correct expectation.
 */
export function expectedSubmissionOwner(
  submission: { customer_id?: string | null },
  access: CartAccess
): string {
  return access.isGuest ? String(submission.customer_id ?? "") : access.ownerId
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
