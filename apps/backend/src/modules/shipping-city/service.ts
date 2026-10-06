import { MedusaError } from "@medusajs/framework/utils"
import { MedusaService } from "@medusajs/framework/utils"
import { ShippingCity } from "./models/shipping-city"

/**
 * Field bounds enforced at the service boundary (Requirement 5.1).
 *
 *  - `city` name: text, 1 to 255 characters (non-blank).
 *  - `delivery_price`: a monetary amount from 0 to 999,999,999.99.
 */
const CITY_MIN_LENGTH = 1
const CITY_MAX_LENGTH = 255
const PRICE_MIN = 0
const PRICE_MAX = 999_999_999.99

/** Shape accepted by {@link ShippingCityModuleService.upsertCity}. */
export type UpsertCityInput = {
  city: string
  delivery_price: number
  is_active?: boolean
}

/** Shape accepted by {@link ShippingCityModuleService.updateCity}. */
export type UpdateCityInput = Partial<{
  city: string
  delivery_price: number
  is_active: boolean
}>

/**
 * Generate a legacy-format shipping city id (`shpcity_<ts>_<rand>`).
 *
 * New rows are created with an explicitly supplied id matching the Old Store
 * format so the framework never generates a replacement primary key value and
 * never needs to alter the existing `varchar` PK column type (Requirement
 * 1.3). The format mirrors the Old Store generator
 * (`shpcity_${Date.now()}_${Math.random().toString(36)...}`).
 */
function generateShippingCityId(): string {
  return `shpcity_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/** Round a monetary value to 2 decimal places, avoiding float drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Validate a city name (Requirements 5.1, 5.4).
 *
 * @throws {MedusaError} `INVALID_DATA` when the name is missing, not a string,
 *   blank, or outside the inclusive 1–255 character range.
 */
function validateCityName(city: unknown): string {
  if (typeof city !== "string") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "city is required and must be a string"
    )
  }

  if (city.trim().length < CITY_MIN_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "city must be at least 1 character"
    )
  }

  if (city.length > CITY_MAX_LENGTH) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `city must be at most ${CITY_MAX_LENGTH} characters`
    )
  }

  return city
}

/**
 * Validate a delivery price (Requirements 5.1, 5.4).
 *
 * Returns the value rounded to 2 decimal places for storage as a
 * `numeric(10,2)` monetary amount.
 *
 * @throws {MedusaError} `INVALID_DATA` when the price is non-numeric, negative,
 *   or greater than 999,999,999.99.
 */
function validateDeliveryPrice(price: unknown): number {
  if (typeof price !== "number" || !Number.isFinite(price)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "delivery_price is required and must be a finite number"
    )
  }

  if (price < PRICE_MIN) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `delivery_price must be >= ${PRICE_MIN}`
    )
  }

  if (price > PRICE_MAX) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `delivery_price must be <= ${PRICE_MAX}`
    )
  }

  return round2(price)
}

/**
 * ShippingCityModuleService.
 *
 * Wires the {@link ShippingCity} model into the idiomatic Medusa 2.16
 * `MedusaService` factory (Requirement 1.1). Extending the factory generates
 * the standard data-access methods for the model
 * (`listShippingCities` / `retrieveShippingCity` / `createShippingCities` /
 * `updateShippingCities` / `deleteShippingCities`) mapped onto the existing
 * `shipping_cities` table.
 *
 * On top of those generated primitives this service exposes the named,
 * validated business operations that achieve behavior parity with the Old
 * Store `ShippingCityService`: `listAll`, `upsertCity`, `updateCity`,
 * `toggleCity`, `deleteCity`, and `getCityById`. Validation of the city name
 * length (1–255), the delivery price range (0–999,999,999.99), and the
 * uniqueness of the city name is enforced at this boundary so invalid or
 * duplicate input is rejected without mutating any existing record
 * (Requirements 5.1, 5.2, 5.4).
 */
function toShippingCityDto(city: unknown): Record<string, unknown> {
  const entity = city as Record<string, unknown>
  const dto = { ...entity }
  const raw = entity.raw_delivery_price as { value?: unknown } | undefined
  const price = Number(entity.delivery_price ?? raw?.value)

  delete dto.raw_delivery_price
  dto.delivery_price = Number.isFinite(price) ? price : 0

  return dto
}

class ShippingCityModuleService extends MedusaService({ ShippingCity }) {
  /** Return every city as a public DTO without BigNumber internals. */
  async listAll() {
    const cities = await this.listShippingCities(
      {},
      { order: { city: "ASC" } }
    )
    return cities.map(toShippingCityDto)
  }

  /** Retrieve one city as a public DTO without BigNumber internals. */
  async getCityById(id: string) {
    return toShippingCityDto(await this.retrieveShippingCity(id))
  }

  /** Create a city, or update the existing record keyed by city name. */
  async upsertCity({ city, delivery_price, is_active }: UpsertCityInput) {
    const validCity = validateCityName(city)
    const validPrice = validateDeliveryPrice(delivery_price)

    const [existing] = await this.listShippingCities(
      { city: validCity },
      { take: 1 }
    )

    if (existing) {
      const update: Record<string, unknown> = {
        id: existing.id,
        delivery_price: validPrice,
      }
      if (typeof is_active === "boolean") {
        update.is_active = is_active
      }
      return toShippingCityDto(await this.updateShippingCities(update))
    }

    return toShippingCityDto(
      await this.createShippingCities({
        id: generateShippingCityId(),
        city: validCity,
        delivery_price: validPrice,
        is_active: typeof is_active === "boolean" ? is_active : true,
      })
    )
  }

  /** Partially update a city after validating all supplied fields. */
  async updateCity(id: string, data: UpdateCityInput) {
    const existing = await this.retrieveShippingCity(id)
    const update: Record<string, unknown> = { id }

    if (data.city !== undefined) {
      const validCity = validateCityName(data.city)
      if (validCity !== existing.city) {
        const matches = await this.listShippingCities({ city: validCity })
        if (matches.some((match) => match.id !== id)) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `A shipping city with the name "${validCity}" already exists`
          )
        }
      }
      update.city = validCity
    }

    if (data.delivery_price !== undefined) {
      update.delivery_price = validateDeliveryPrice(data.delivery_price)
    }

    if (data.is_active !== undefined) {
      update.is_active = data.is_active
    }

    return toShippingCityDto(await this.updateShippingCities(update))
  }

  /** Toggle the active flag of a city identified by name. */
  async toggleCity(cityName: string, isActive: boolean) {
    const [existing] = await this.listShippingCities(
      { city: cityName },
      { take: 1 }
    )

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `City ${cityName} not found`
      )
    }

    return toShippingCityDto(
      await this.updateShippingCities({
        id: existing.id,
        is_active: isActive,
      })
    )
  }

  /** Delete a city identified by name. */
  async deleteCity(cityName: string): Promise<void> {
    const [existing] = await this.listShippingCities(
      { city: cityName },
      { take: 1 }
    )

    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `City ${cityName} not found`
      )
    }

    await this.deleteShippingCities(existing.id)
  }
}

export default ShippingCityModuleService
