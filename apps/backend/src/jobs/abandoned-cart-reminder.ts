import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ABANDONED_CART_MODULE } from "../modules/abandoned-cart"
import type AbandonedCartModuleService from "../modules/abandoned-cart/service"
import { sendAbandonedCartReminderWorkflow } from "../workflows/abandoned-cart/send-abandoned-cart-reminder"

/**
 * Scheduled job: abandoned-cart reminder detection.
 *
 * Runs on the `config.schedule` cron and:
 *   1. Finds carts that carry an email, still have items, have NOT completed
 *      into an order, and have been idle (no updates) for longer than
 *      `ABANDONED_CART_IDLE_MINUTES`.
 *   2. Applies the reminder policy — at most `ABANDONED_CART_MAX_REMINDERS`
 *      reminders per cart, spaced at least
 *      `ABANDONED_CART_REMINDER_INTERVAL_MINUTES` apart.
 *   3. Triggers `sendAbandonedCartReminderWorkflow` for each eligible cart.
 *
 * All thresholds are env-configurable so behaviour can be tuned without a code
 * change.
 */
export default async function abandonedCartReminderJob(
  container: MedusaContainer
) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const abandonedCartService = container.resolve<AbandonedCartModuleService>(
    ABANDONED_CART_MODULE
  )

  const idleMinutes = Number(process.env.ABANDONED_CART_IDLE_MINUTES || 60)
  const maxReminders = Number(process.env.ABANDONED_CART_MAX_REMINDERS || 1)
  const intervalMinutes = Number(
    process.env.ABANDONED_CART_REMINDER_INTERVAL_MINUTES || 1440
  )
  // Upper bound on cart age: never re-target carts older than this many hours,
  // so a backlog of very old carts is not blasted with reminders at once.
  const maxAgeHours = Number(process.env.ABANDONED_CART_MAX_AGE_HOURS || 168)

  const now = Date.now()
  const idleBefore = new Date(now - idleMinutes * 60 * 1000)
  const oldestAllowed = new Date(now - maxAgeHours * 60 * 60 * 1000)

  // Candidate carts: has email, not completed, idle past the threshold, and
  // updated recently enough to be worth recovering (not older than maxAgeHours).
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "email", "updated_at", "completed_at", "items.id"],
    filters: {
      email: { $ne: null },
      completed_at: null,
      updated_at: { $lt: idleBefore, $gt: oldestAllowed },
    },
    pagination: { take: 200, skip: 0 },
  })

  if (!carts?.length) {
    logger.info("[abandoned-cart] no idle carts found this run")
    return
  }

  let triggered = 0

  for (const cart of carts) {
    // Must still have items and an email.
    if (!cart.email || !Array.isArray(cart.items) || cart.items.length === 0) {
      continue
    }

    const record = await abandonedCartService.getByCartId(cart.id)

    if (record) {
      // Skip carts an admin has explicitly dismissed.
      if (record.dismissed) {
        continue
      }
      // Respect the max-reminders cap.
      if ((Number(record.reminder_count) || 0) >= maxReminders) {
        continue
      }
      // Respect the cooldown between consecutive reminders.
      if (record.last_reminder_at) {
        const lastAt = new Date(record.last_reminder_at).getTime()
        if (now - lastAt < intervalMinutes * 60 * 1000) {
          continue
        }
      }
    }

    try {
      await sendAbandonedCartReminderWorkflow(container).run({
        input: { cart_id: cart.id },
      })
      triggered++
    } catch (error) {
      logger.error(
        `[abandoned-cart] failed to send reminder for cart ${cart.id}: ${
          (error as Error)?.message ?? error
        }`
      )
    }
  }

  logger.info(
    `[abandoned-cart] processed ${carts.length} idle cart(s), triggered ${triggered} reminder(s)`
  )
}

export const config = {
  name: "abandoned-cart-reminder",
  // Default: every 15 minutes. Override with ABANDONED_CART_CRON.
  schedule: process.env.ABANDONED_CART_CRON || "*/15 * * * *",
}
