import { Module } from "@medusajs/framework/utils"
import PaymentsModuleService from "./service"
import { BankAccount } from "./models/bank-account"
import { CODSettings } from "./models/cod-settings"

/**
 * Payments_Module (bank accounts + COD settings)
 *
 * Idiomatic Medusa 2.16 module (`model.define` + `MedusaService`) for managing
 * bank-transfer accounts and the singleton Cash-on-Delivery configuration. The
 * module is mapped onto the existing production `bank_accounts` and
 * `cod_settings` tables without destructive schema changes; the only schema
 * change is the additive, nullable `deleted_at` column authored in
 * `migrations/` (Requirements 1.1, 1.2, 1.3, 4.1).
 *
 * The validated business operations on the service — bank-account CRUD with
 * `account_number` uniqueness (Requirements 4.1, 4.2, 4.3) and COD settings with
 * the city-availability predicate (Requirements 4.4, 4.7, 4.8) — are implemented
 * in `service.ts`.
 */
export const PAYMENTS_MODULE = "payments"

export { BankAccount }
export { CODSettings }
export { default as PaymentsModuleService } from "./service"

export default Module(PAYMENTS_MODULE, {
  service: PaymentsModuleService,
})
