import {
  defineMiddlewares,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../modules/rbac"
import type RbacModuleService from "../modules/rbac/service"
import type { RequestPermissionContext } from "./utils/rbac"
import { resolveRoutePermission } from "./utils/route-permissions"
import { MANUAL_TRANSFER_MODULE } from "../modules/manual-transfer"
import type ManualTransferModuleService from "../modules/manual-transfer/service"

/**
 * Authenticated-checkout enforcement (applied to `POST /store/carts/:id/complete`).
 *
 * The storefront requires customers to sign in before checking out, but the
 * default `/store/carts/:id/complete` route accepts guest carts. This
 * middleware closes that gap on the server: it loads the cart being completed
 * and rejects the request with `401` unless the cart is owned by a *registered*
 * customer (`customer_id` set and `customer.has_account === true`). Guest carts
 * — whether they have no customer at all or only a transient guest customer
 * (`has_account: false`) — are refused, so no order can be created without an
 * account regardless of how the request reaches the API.
 *
 * Fails closed: any error resolving the cart/customer results in a `401` rather
 * than silently allowing a guest completion.
 */
async function requireRegisteredCustomerForCheckout(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  const deny = (): void => {
    res.status(401).json({
      message: "يجب تسجيل الدخول أو إنشاء حساب لإكمال الطلب",
    })
  }

  // Extract the cart id from the request path (`/store/carts/:id/complete`).
  const path =
    (req as unknown as { originalUrl?: string }).originalUrl ||
    (req as unknown as { path?: string }).path ||
    req.url
  const cartId = path.match(/\/store\/carts\/([^/?]+)\/complete/)?.[1]

  if (!cartId) {
    deny()
    return
  }

  try {
    const cartService = req.scope.resolve(Modules.CART)
    const cart = await cartService.retrieveCart(cartId, {
      select: ["id", "customer_id"],
    })

    if (!cart?.customer_id) {
      deny()
      return
    }

    const customerService = req.scope.resolve(Modules.CUSTOMER)
    const customer = await customerService.retrieveCustomer(cart.customer_id, {
      select: ["id", "has_account"],
    })

    if (!customer?.has_account) {
      deny()
      return
    }

    return next()
  } catch (err) {
    const logger = req.scope.resolve("logger") as {
      error: (msg: string) => void
    }
    logger.error(
      `[auth-checkout] failed to verify cart ownership: ${
        (err as Error)?.message ?? err
      }`
    )
    // Fail closed.
    deny()
    return
  }
}

/**
 * RBAC enforcement middleware (applied to all `/admin/*` routes).
 *
 * Runs after the framework's authenticated-admin middleware. For every
 * authenticated admin request it:
 *   1. resolves the acting user's id from the auth context (JWT/session);
 *   2. loads the user's effective permissions (roles → permission keys, plus
 *      baseline shell reads) and email from the RBAC module;
 *   3. blocks disabled users with `403`;
 *   4. attaches the resolved {@link RequestPermissionContext} to the request;
 *   5. enforces authorization using the central route→permission map
 *      (`utils/route-permissions.ts`) — **deny-by-default**: any route not
 *      explicitly allow-listed, delegated, or matched to a permission the user
 *      holds is rejected with `403`.
 *
 * Unauthenticated requests (no `auth_context`) are passed through so the
 * framework's own auth layer can reject them. Failures resolving RBAC data
 * fail closed (the request proceeds with an empty permission set, so only
 * allow-listed routes succeed).
 */
async function rbacEnforce(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  const authContext = (
    req as unknown as { auth_context?: { actor_id?: string } }
  ).auth_context

  const userId = authContext?.actor_id

  // Not an authenticated admin request — let the framework's auth handle it.
  if (!userId) {
    return next()
  }

  let context: RequestPermissionContext = {
    userId,
    email: null,
    roles: [],
    permissions: [],
    isSuper: false,
    isDisabled: false,
  }

  try {
    const userService = req.scope.resolve(Modules.USER)
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)

    try {
      const user = await userService.retrieveUser(userId)
      context.email = (user?.email as string) ?? null
      const metadata = (user?.metadata ?? {}) as Record<string, unknown>
      context.isDisabled = metadata.disabled === true
    } catch {
      // User not resolvable (e.g. API-token actor) — treat as no email.
    }

    if (context.isDisabled) {
      res
        .status(403)
        .json({ message: "هذا الحساب معطّل. تواصل مع مدير النظام." })
      return
    }

    const resolved = await rbac.resolvePermissions(userId)
    context = {
      ...context,
      roles: resolved.roles,
      permissions: resolved.permissions,
      isSuper: resolved.isSuper,
    }
  } catch (err) {
    const logger = req.scope.resolve("logger") as {
      error: (msg: string) => void
    }
    logger.error(
      `[rbac] failed to resolve permission context: ${
        (err as Error)?.message ?? err
      }`
    )
    // Fail closed: proceed with the empty context built above.
  }

  ;(req as unknown as { permission_context: RequestPermissionContext }).permission_context =
    context

  // ── Authorization (deny-by-default) ──────────────────────────────────────
  const path = (req as unknown as { originalUrl?: string; path?: string })
    .originalUrl ||
    (req as unknown as { path?: string }).path ||
    req.url

  const decision = resolveRoutePermission(req.method, path)

  switch (decision.type) {
    case "allow":
    case "delegate":
      return next()
    case "require":
      if (context.isSuper || context.permissions.includes(decision.permission)) {
        return next()
      }
      res.status(403).json({
        message: "ليس لديك صلاحية للوصول إلى هذا المورد",
        required_permission: decision.permission,
      })
      return
    case "deny":
    default:
      res.status(403).json({
        message: "ليس لديك صلاحية للوصول إلى هذا المورد",
      })
      return
  }
}

async function requireManualTransferProofForCheckout(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  try {
    const cartId = req.params.id
    const cartService = req.scope.resolve(Modules.CART) as any
    const cart = await cartService.retrieveCart(cartId, {
      select: ["id", "customer_id", "metadata"],
    })
    const metadata = (cart?.metadata ?? {}) as Record<string, unknown>
    if (metadata.payment_method !== "manual_bank_transfer") return next()

    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByCart(cartId)
    const valid =
      submission?.status === "submitted" &&
      submission.customer_id === cart.customer_id &&
      submission.currency_code === metadata.manual_transfer_currency &&
      submission.bank_account_id === metadata.manual_transfer_bank_account_id &&
      Boolean(submission.proof_storage_key)

    if (!valid) {
      res.status(422).json({
        message: "يجب اختيار حساب بنكي ورفع إشعار إيداع صالح قبل تأكيد الطلب",
      })
      return
    }
    return next()
  } catch {
    res.status(422).json({ message: "تعذر التحقق من إشعار الإيداع" })
  }
}

async function requireApprovedManualTransferForFulfillment(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  try {
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByOrder(req.params.id)
    if (!submission || submission.status === "approved") return next()
    res.status(409).json({
      message: "لا يمكن تنفيذ الطلب قبل قبول التحويل البنكي",
      manual_transfer_status: submission.status,
    })
  } catch {
    res.status(500).json({ message: "تعذر التحقق من حالة التحويل البنكي" })
  }
}

type ProductPriceInput = {
  id?: string
  currency_code?: string
  amount?: number
}

type ProductVariantInput = {
  id?: string
  prices?: ProductPriceInput[]
}

function hasEffectivePrice(
  submitted: ProductPriceInput[] | undefined,
  persistedIds: Set<string>
): boolean {
  if (submitted === undefined) {
    return persistedIds.size > 0
  }

  return submitted.some((price) => {
    const amountIsValid =
      price.amount === undefined ||
      (Number.isFinite(price.amount) && price.amount >= 0)
    const currencyIsValid =
      price.currency_code === undefined || price.currency_code.trim().length > 0

    if (price.id && persistedIds.has(price.id)) {
      return amountIsValid && currencyIsValid
    }

    return (
      (price.currency_code?.trim().length ?? 0) > 0 &&
      typeof price.amount === "number" &&
      Number.isFinite(price.amount) &&
      price.amount >= 0
    )
  })
}

/** Prevent a product from entering the published state without priced variants. */
async function requirePricesForPublishedProduct(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
): Promise<void> {
  const body = (req.body ?? {}) as {
    status?: string
    variants?: ProductVariantInput[]
  }

  if (body.status !== "published") {
    return next()
  }

  const submittedVariants = Array.isArray(body.variants) ? body.variants : []
  let allVariantsHavePrices = false

  if (!req.params.id) {
    allVariantsHavePrices =
      submittedVariants.length > 0 &&
      submittedVariants.every((variant) =>
        hasEffectivePrice(variant.prices, new Set())
      )
  } else {
    const query = req.scope.resolve("query") as {
      graph: (input: Record<string, unknown>) => Promise<{ data: any[] }>
    }
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "variants.id", "variants.prices.id"],
      filters: { id: req.params.id },
    })
    const persistedVariants = (data[0]?.variants ?? []) as Array<{
      id: string
      prices?: Array<{ id: string }>
    }>
    const persistedById = new Map(
      persistedVariants.map((variant) => [variant.id, variant])
    )
    const submittedById = new Map(
      submittedVariants
        .filter((variant) => variant.id)
        .map((variant) => [variant.id as string, variant])
    )
    const addedVariants = submittedVariants.filter(
      (variant) => !variant.id || !persistedById.has(variant.id)
    )

    allVariantsHavePrices =
      persistedVariants.length + addedVariants.length > 0 &&
      persistedVariants.every((variant) => {
        const update = submittedById.get(variant.id)
        const persistedPriceIds = new Set(
          (variant.prices ?? []).map((price) => price.id)
        )
        return hasEffectivePrice(update?.prices, persistedPriceIds)
      }) &&
      addedVariants.every((variant) =>
        hasEffectivePrice(variant.prices, new Set())
      )
  }

  if (!allVariantsHavePrices) {
    res.status(400).json({
      message: "لا يمكن نشر المنتج: يجب أن يحتوي كل متغير على سعر صالح واحد على الأقل.",
    })
    return
  }

  return next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [rbacEnforce],
    },
    {
      matcher: "/admin/products",
      method: ["POST"],
      middlewares: [requirePricesForPublishedProduct],
    },
    {
      matcher: "/admin/products/:id",
      method: ["POST"],
      middlewares: [requirePricesForPublishedProduct],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: ["POST"],
      middlewares: [
        requireRegisteredCustomerForCheckout,
        requireManualTransferProofForCheckout,
      ],
    },
    {
      matcher: "/admin/orders/:id/fulfillments",
      method: ["POST"],
      middlewares: [requireApprovedManualTransferForFulfillment],
    },
  ],
})
