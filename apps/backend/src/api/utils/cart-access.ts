import { Modules } from "@medusajs/framework/utils"
import type { MedusaRequest } from "@medusajs/framework/http"

/**
 * Guest-aware cart/order ownership resolution.
 *
 * The store supports **guest checkout**: a shopper can place an order without
 * creating an account. That makes "who owns this cart?" a three-way question
 * rather than a boolean:
 *
 *  1. The cart has no `customer_id` at all — a pure guest cart (the shopper has
 *     not even supplied an email, which is optional for guests).
 *  2. The cart has a `customer_id` pointing at a Medusa **guest** customer
 *     (`has_account === false`). Medusa creates one automatically the moment an
 *     email is written onto a cart, so a guest cart acquires a customer id as a
 *     side effect of entering an (optional) email. It still is not an account.
 *  3. The cart has a `customer_id` pointing at a **registered** customer
 *     (`has_account === true`). Only that customer may touch the cart.
 *
 * Cases 1 and 2 are authorized by possession of the cart id, which is exactly
 * the security model Medusa's own `/store/carts/:id` routes use (the id is an
 * unguessable identifier held in an http-only cookie). Case 3 keeps requiring a
 * matching authenticated actor, so signing in still protects a cart.
 *
 * `ownerId` gives callers a stable owner token to persist alongside cart-scoped
 * records (manual bank-transfer submissions). For guest carts it is derived
 * from the cart id rather than from `customer_id`, so it does not change when
 * the shopper later types an email and Medusa attaches a guest customer.
 */

/** Prefix marking an owner token that belongs to a guest (account-less) cart. */
export const GUEST_OWNER_PREFIX = "guest:"

export type AccessScope = { resolve: <T = unknown>(key: string) => T }

export type CartAccess = {
  /** Whether the caller may read and mutate this cart. */
  authorized: boolean
  /** Whether the cart belongs to a guest (no registered account). */
  isGuest: boolean
  /** Stable owner token for cart-scoped records. */
  ownerId: string
}

/** Build the owner token used for guest (account-less) carts. */
export function guestOwnerId(cartId: string): string {
  return `${GUEST_OWNER_PREFIX}${cartId}`
}

/** Read the authenticated actor id from the request, if any. */
export function requestActorId(req: MedusaRequest): string | null {
  return (
    (req as unknown as { auth_context?: { actor_id?: string } }).auth_context
      ?.actor_id ?? null
  )
}

/**
 * Resolve whether `customerId` belongs to a registered account holder.
 *
 * Fails **open towards guest** only when the customer record cannot be read at
 * all; an unreadable customer cannot be proven to be a registered account, and
 * treating it as registered would lock the cart out of every code path.
 */
async function hasRegisteredAccount(
  scope: AccessScope,
  customerId: string
): Promise<boolean> {
  try {
    const customerService = scope.resolve<any>(Modules.CUSTOMER)
    const customer = await customerService.retrieveCustomer(customerId, {
      select: ["id", "has_account"],
    })
    return customer?.has_account === true
  } catch {
    return false
  }
}

/**
 * Decide whether the caller may act on a cart, and under which owner token.
 *
 * @param scope Medusa container scope used to resolve the customer module.
 * @param cart The cart being accessed; only `id` and `customer_id` are read.
 * @param actorId The authenticated actor id, or `null` for anonymous callers.
 */
export async function resolveCartAccess(
  scope: AccessScope,
  cart: { id: string; customer_id?: string | null },
  actorId: string | null
): Promise<CartAccess> {
  const customerId = cart.customer_id ?? null

  if (!customerId) {
    return { authorized: true, isGuest: true, ownerId: guestOwnerId(cart.id) }
  }

  if (!(await hasRegisteredAccount(scope, customerId))) {
    // Medusa guest customer attached by the optional email — still a guest.
    return { authorized: true, isGuest: true, ownerId: guestOwnerId(cart.id) }
  }

  return {
    authorized: Boolean(actorId) && actorId === customerId,
    isGuest: false,
    ownerId: customerId,
  }
}

/**
 * Same decision as {@link resolveCartAccess}, for an order instead of a cart.
 * Used for post-checkout reads (bank-transfer status on the confirmation page).
 */
export async function resolveOrderAccess(
  scope: AccessScope,
  order: { id: string; customer_id?: string | null },
  actorId: string | null
): Promise<CartAccess> {
  return resolveCartAccess(scope, order, actorId)
}
