import { Module } from "@medusajs/framework/utils"
import ShippingCityModuleService from "./service"
import { ShippingCity } from "./models/shipping-city"

/**
 * Shipping_City_Module
 *
 * Idiomatic Medusa 2.16 module (`model.define` + `MedusaService`) for managing
 * shipping cities and their per-city delivery prices. The module is mapped onto
 * the existing production `shipping_cities` table without destructive schema
 * changes; the only schema change is the additive, nullable `deleted_at` column
 * authored in `migrations/` (Requirements 1.1, 1.2, 1.3, 5.1).
 *
 * The validated business operations on the service are implemented in task 4.2.
 */
export const SHIPPING_CITY_MODULE = "shipping_city"

export { ShippingCity }
export { default as ShippingCityModuleService } from "./service"

export default Module(SHIPPING_CITY_MODULE, {
  service: ShippingCityModuleService,
})
