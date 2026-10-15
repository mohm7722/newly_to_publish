import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SHIPPING_CITY_MODULE } from "../modules/shipping-city"
import type ShippingCityModuleService from "../modules/shipping-city/service"

/**
 * Yemeni governorates seed migration script.
 *
 * Checkout asks the shopper to pick their governorate from a list, and that
 * list is the `shipping_cities` table (each row carries the delivery price used
 * to compute the shipping fee). This script makes sure every Yemeni
 * governorate exists as a row so the dropdown is a complete governorate list
 * rather than whatever subset happened to be entered by hand.
 *
 * **Non-destructive by design.** It only *inserts missing* governorates. It
 * never touches an existing row — not its `delivery_price`, not its
 * `is_active` flag, not its name — so prices already configured in
 * Admin → Settings → Shipping Cities survive every migration run, and a
 * governorate deliberately deactivated stays deactivated.
 *
 * Newly inserted rows are created **active with `delivery_price = 0`** so they
 * are immediately selectable at checkout. Zero means *free delivery*, which is
 * almost certainly not the intended tariff, so the script logs a prominent
 * warning listing exactly which governorates need a price set in the admin.
 *
 * Failures are logged and swallowed so this script never blocks the migration
 * batch.
 */

/** The 22 governorates of Yemen (Arabic names, as shown to the shopper). */
export const YEMEN_GOVERNORATES = [
  "أمانة العاصمة",
  "صنعاء",
  "عدن",
  "تعز",
  "الحديدة",
  "حضرموت",
  "إب",
  "لحج",
  "أبين",
  "البيضاء",
  "الضالع",
  "الجوف",
  "المحويت",
  "المهرة",
  "مأرب",
  "عمران",
  "حجة",
  "ذمار",
  "ريمة",
  "شبوة",
  "صعدة",
  "سقطرى",
] as const

/** Normalize a city name for comparison (trim + Arabic-aware lowercase). */
const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("ar")

export default async function seed_yemen_governorates({
  container,
}: {
  container: MedusaContainer
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const service =
      container.resolve<ShippingCityModuleService>(SHIPPING_CITY_MODULE)

    const existing = await service.listAll()
    const existingNames = new Set(
      existing.map((city) => normalize((city as { city?: unknown }).city))
    )

    const missing = YEMEN_GOVERNORATES.filter(
      (name) => !existingNames.has(normalize(name))
    )

    if (missing.length === 0) {
      logger.info(
        "[shipping-cities] all Yemeni governorates already present; nothing to seed"
      )
      return
    }

    for (const city of missing) {
      // `upsertCity` is keyed by city name. Only names confirmed missing above
      // reach this call, so no existing row (and no configured price) is
      // overwritten.
      await service.upsertCity({
        city,
        delivery_price: 0,
        is_active: true,
      })
    }

    logger.info(
      `[shipping-cities] seeded ${missing.length} Yemeni governorate(s): ${missing.join(
        ", "
      )}`
    )
    logger.warn(
      `[shipping-cities] ACTION REQUIRED: the following governorates were created with delivery_price = 0 ` +
        `(free delivery). Set their real delivery price in Admin → Settings → Shipping Cities: ${missing.join(
          ", "
        )}`
    )
  } catch (error) {
    logger.error(
      `[shipping-cities] failed to seed Yemeni governorates: ${
        (error as Error)?.message ?? error
      }`
    )
  }
}
