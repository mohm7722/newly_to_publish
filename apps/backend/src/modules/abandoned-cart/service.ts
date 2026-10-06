import { MedusaService } from "@medusajs/framework/utils"
import { AbandonedCartReminder } from "./models/abandoned-cart-reminder"

/**
 * AbandonedCartModuleService.
 *
 * Wires the {@link AbandonedCartReminder} model into the idiomatic Medusa 2.16
 * `MedusaService` factory. Extending the factory generates the standard
 * data-access primitives (`listAbandonedCartReminders`,
 * `createAbandonedCartReminders`, `updateAbandonedCartReminders`, ...). On top
 * of those, this service exposes the small business helpers the reminder job
 * and workflow rely on.
 */
class AbandonedCartModuleService extends MedusaService({
  AbandonedCartReminder,
}) {
  /** Return the reminder row for a cart, or `null` when none exists yet. */
  async getByCartId(cartId: string) {
    const [row] = await this.listAbandonedCartReminders(
      { cart_id: cartId },
      { take: 1 }
    )
    return row ?? null
  }

  /**
   * Record that a reminder was sent for a cart: create the row on first send,
   * otherwise increment the counter and refresh `last_reminder_at`.
   */
  async recordReminder(cartId: string, email?: string | null) {
    const existing = await this.getByCartId(cartId)

    if (existing) {
      const updated = await this.updateAbandonedCartReminders({
        id: existing.id,
        reminder_count: (Number(existing.reminder_count) || 0) + 1,
        last_reminder_at: new Date(),
        email: email ?? existing.email,
      })
      return Array.isArray(updated) ? updated[0] : updated
    }

    const created = await this.createAbandonedCartReminders({
      cart_id: cartId,
      email: email ?? null,
      reminder_count: 1,
      last_reminder_at: new Date(),
    })
    return Array.isArray(created) ? created[0] : created
  }

  /** Mark a cart as recovered (it completed into an order). */
  async markRecovered(cartId: string) {
    const existing = await this.getByCartId(cartId)
    if (!existing) {
      return null
    }
    const updated = await this.updateAbandonedCartReminders({
      id: existing.id,
      recovered: true,
    })
    return Array.isArray(updated) ? updated[0] : updated
  }

  /**
   * Set the `dismissed` flag for a cart, creating the tracking row if it does
   * not exist yet (an admin can dismiss a cart before any reminder was sent).
   */
  async setDismissed(cartId: string, dismissed: boolean) {
    const existing = await this.getByCartId(cartId)

    if (existing) {
      const updated = await this.updateAbandonedCartReminders({
        id: existing.id,
        dismissed,
      })
      return Array.isArray(updated) ? updated[0] : updated
    }

    const created = await this.createAbandonedCartReminders({
      cart_id: cartId,
      reminder_count: 0,
      dismissed,
    })
    return Array.isArray(created) ? created[0] : created
  }
}

export default AbandonedCartModuleService
