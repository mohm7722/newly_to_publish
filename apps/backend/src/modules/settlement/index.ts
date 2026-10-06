import { Module } from "@medusajs/framework/utils"
import SettlementModuleService from "./service"
import { OrderSettlement } from "./models/order-settlement"

/**
 * Settlement Module (order_settlement)
 *
 * Idiomatic Medusa 2.16 module (`model.define` + `MedusaService`) that layers
 * Yemeni-currency settlement onto the core `@medusajs/draft-order` system. It
 * replaces the Old Store's raw-`pg` settlement service (Requirement 9.3) with a
 * framework module mapped onto the existing production `order_settlement` table
 * (PK `order_id`) without destructive schema changes; the only schema change is
 * the additive, nullable `deleted_at` column authored in `migrations/`
 * (Requirements 1.1, 1.2, 3.2).
 *
 * The module reads core order totals (supplied by the caller from the core
 * Order / Draft-Order service) and writes **only** into `order_settlement`,
 * never mutating the core order totals or the core draft-order data model
 * (Requirement 3.2). The validated business operations — `getSettlement`,
 * `getMany`, `commitSettlement`, and `updateSettlementCurrency` — are
 * implemented in `service.ts` (Requirements 3.3, 3.5, 3.6).
 */
export const SETTLEMENT_MODULE = "settlement"

export { OrderSettlement }
export { default as SettlementModuleService } from "./service"

export default Module(SETTLEMENT_MODULE, {
  service: SettlementModuleService,
})
