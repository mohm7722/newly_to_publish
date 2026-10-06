import { createHmac } from "crypto"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { ABANDONED_CART_MODULE } from "../../modules/abandoned-cart"
import type AbandonedCartModuleService from "../../modules/abandoned-cart/service"

export type SendAbandonedCartReminderInput = {
  cart_id: string
}

/**
 * Resume-link builder. The reminder email links back to the storefront route
 * that restores the cart cookie and drops the customer straight back into their
 * cart (`/{region}/cart/resume?cart_id=...`).
 */
function buildResumeUrl(cartId: string): string {
  const baseUrl = process.env.STOREFRONT_URL || "http://localhost:8000"
  const region = process.env.STOREFRONT_DEFAULT_REGION || "us"
  const secret = process.env.CART_RESUME_SECRET || process.env.COOKIE_SECRET
  if (!secret) {
    throw new Error("CART_RESUME_SECRET is required for cart resume links")
  }

  const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7
  const signature = createHmac("sha256", secret)
    .update(`${cartId}.${expires}`)
    .digest("hex")
  return `${baseUrl}/${region}/cart/resume?cart_id=${encodeURIComponent(
    cartId
  )}&expires=${expires}&signature=${signature}`
}

/**
 * Single step: re-validate the cart is still abandoned, send the reminder
 * notification, and record it. Re-validating here (in addition to the job's
 * pre-filter) keeps the workflow safe to invoke directly.
 */
const sendAbandonedCartReminderStep = createStep(
  "send-abandoned-cart-reminder-step",
  async ({ cart_id }: SendAbandonedCartReminderInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    const abandonedCartService = container.resolve<AbandonedCartModuleService>(
      ABANDONED_CART_MODULE
    )

    const {
      data: [cart],
    } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "completed_at",
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.thumbnail",
      ],
      filters: { id: cart_id },
    })

    // Skip carts that are no longer eligible (completed, no email, or empty).
    if (
      !cart ||
      cart.completed_at ||
      !cart.email ||
      !Array.isArray(cart.items) ||
      cart.items.length === 0
    ) {
      logger.info(
        `[abandoned-cart] skip reminder for cart ${cart_id} (not eligible)`
      )
      return new StepResponse({ sent: false, cart_id })
    }

    const resumeUrl = buildResumeUrl(cart.id)
    const existing = await abandonedCartService.getByCartId(cart.id)
    const nextCount = (Number(existing?.reminder_count) || 0) + 1

    await notificationModuleService.createNotifications({
      to: cart.email,
      channel: "email",
      template: process.env.ABANDONED_CART_EMAIL_TEMPLATE || "abandoned-cart",
      // Deduplicate: one notification per (cart, reminder attempt).
      idempotency_key: `abandoned-cart-${cart.id}-${nextCount}`,
      data: {
        cart_id: cart.id,
        resume_url: resumeUrl,
        currency_code: cart.currency_code,
        items: cart.items
          .filter((item): item is NonNullable<typeof item> => item != null)
          .map((item) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            thumbnail: item.thumbnail,
          })),
      },
    })

    await abandonedCartService.recordReminder(cart.id, cart.email)

    logger.info(
      `[abandoned-cart] reminder #${nextCount} sent for cart ${cart.id} to ${cart.email}`
    )

    return new StepResponse({ sent: true, cart_id: cart.id, email: cart.email })
  }
)

/**
 * Workflow: send a single abandoned-cart reminder for one cart.
 *
 * Invoked once per eligible cart by the `abandoned-cart-reminder` scheduled job.
 * Runs inside the workflow engine so it benefits from execution logging and
 * retry semantics.
 */
export const sendAbandonedCartReminderWorkflow = createWorkflow(
  "send-abandoned-cart-reminder",
  (input: SendAbandonedCartReminderInput) => {
    const result = sendAbandonedCartReminderStep(input)
    return new WorkflowResponse(result)
  }
)

export default sendAbandonedCartReminderWorkflow
