import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { OrderSettlement } from "./models/order-settlement"
import { convertAmount, isSupported, SUPPORTED_CURRENCIES } from "../../lib/fx"
import type { CurrencyCode } from "../../lib/fx"

/**
 * Minimal shape of a core order's totals consumed by the settlement layer.
 *
 * The Settlement Module never reads or writes the core order itself: callers
 * (the admin/store route handlers) resolve the order through the core Order /
 * Draft-Order service and pass the relevant totals in here. The amounts are
 * expressed in the order's base currency (`SAR`). All fields are optional and
 * default to `0` so partially-populated order objects are handled safely.
 */
export type SettlementOrderInput = {
  id?: string
  display_id?: string | number
  region_id?: string
  currency_code?: string
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  discount_total?: number
  total?: number
  items?: Array<{ unit_price?: number; quantity?: number }>
}

/** Shape accepted by {@link SettlementModuleService.updateSettlementCurrency}. */
export type UpdateSettlementCurrencyInput = {
  currency_code: string
  rate?: number
  reason?: string
}

/** The set of computed, FX-converted amounts persisted per settlement. */
type ComputedAmounts = {
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

/** Round a value to 2 decimal places, avoiding common float representation drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Coerce a possibly-`BigNumber`/string/number value into a finite `number`.
 *
 * `model.bigNumber()` fields may be returned as a number, a numeric string, or
 * a `{ value }`-bearing object depending on the driver; this normalizes them
 * all to a plain finite number (falling back to `0`).
 */
function toNumber(value: unknown): number {
  if (value === null || value === undefined) {
    return 0
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === "string") {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === "object") {
    // Medusa/MikroORM `BigNumber` values (order totals and line-item prices
    // returned by the Query graph) are objects with keys
    // `{ numeric_, raw_, bignumber_ }` and implement `valueOf()`, so `Number()`
    // coerces them to their numeric value. Trying `Number()` first also handles
    // any other numeric-like wrapper; the `{ value }` shape is kept as a
    // fallback for the driver variant that exposes the amount under `value`.
    const coerced = Number(value as unknown as number)
    if (Number.isFinite(coerced)) {
      return coerced
    }
    if ("value" in (value as Record<string, unknown>)) {
      return toNumber((value as { value: unknown }).value)
    }
  }
  return 0
}

/**
 * SettlementModuleService.
 *
 * Wires the {@link OrderSettlement} model into the idiomatic Medusa 2.16
 * `MedusaService` factory (Requirement 1.1). Extending the factory generates
 * the standard data-access primitives for the model (`listOrderSettlements` /
 * `retrieveOrderSettlement` / `createOrderSettlements` /
 * `updateOrderSettlements` / `deleteOrderSettlements`) mapped onto the existing
 * `order_settlement` table (PK `order_id`).
 *
 * On top of those primitives this service exposes the named business operations
 * that achieve behavior parity with the Old Store settlement service:
 * {@link SettlementModuleService.getSettlement},
 * {@link SettlementModuleService.getMany},
 * {@link SettlementModuleService.commitSettlement}, and
 * {@link SettlementModuleService.updateSettlementCurrency}.
 *
 * The module reads core order totals supplied by the caller and writes **only**
 * into `order_settlement`; it never mutates core order totals or the core
 * draft-order data model (Requirement 3.2). Unsupported settlement currencies
 * are rejected **before** any write, leaving prior settlement untouched
 * (Requirement 3.6).
 */
class SettlementModuleService extends MedusaService({ OrderSettlement }) {
  /**
   * Read the settlement row for a single order (Requirement 3.5).
   *
   * Returns the stored row, or `null` when no settlement has been committed for
   * the order.
   */
  async getSettlement(orderId: string) {
    const [row] = await this.listOrderSettlements(
      { order_id: orderId },
      { take: 1 }
    )
    return row ?? null
  }

  /**
   * Read settlement rows for many orders at once.
   *
   * Returns the found `items` together with the `missing` order ids that have no
   * settlement row, mirroring the Old Store `getMany` contract.
   */
  async getMany(
    orderIds: string[]
  ): Promise<{ items: unknown[]; missing: string[] }> {
    if (!orderIds || orderIds.length === 0) {
      return { items: [], missing: [] }
    }

    const items = await this.listOrderSettlements({ order_id: orderIds })
    const found = new Set(items.map((row) => row.order_id))
    const missing = orderIds.filter((id) => !found.has(id))

    return { items, missing }
  }

  /**
   * Compute and persist a settlement for an order in the selected currency
   * (Requirements 3.2, 3.3, 3.5, 3.6).
   *
   * The order's base-currency (`SAR`) totals are converted to the selected
   * settlement currency via the FX library (`convertAmount`), then the
   * `currency_code`, applied `rate`, and converted amounts are upserted into
   * `order_settlement`. SAR amounts keep 2-decimal precision; YER amounts use
   * integer (0-decimal) presentation rounding, matching the Old Store and the
   * stored production data.
   *
   * The core order and the core draft-order data model are never mutated — only
   * the `order_settlement` row is created or updated (Requirement 3.2).
   *
   * @param orderId The core order id (settlement primary key).
   * @param order The core order's totals, expressed in the base currency.
   * @param ui The selected settlement currency.
   * @param rates SAR-relative FX rates (`rates.SAR` is implicitly 1).
   * @throws {MedusaError} `INVALID_DATA` when `ui` is outside
   *   {SAR, YER_NEW, YER_OLD} or when its rate is missing/invalid — rejected
   *   **before** any write so a previously persisted settlement is left
   *   unchanged (Requirement 3.6).
   */
  async commitSettlement(
    orderId: string,
    order: SettlementOrderInput,
    ui: string,
    rates: Record<string, number>
  ) {
    // FX rates are SAR-relative. Never reinterpret totals from another core
    // currency as SAR, as that would silently create an invalid settlement.
    const baseCurrency = String(order.currency_code ?? "SAR").toUpperCase()
    if (baseCurrency !== "SAR") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Settlement requires a SAR core order; received ${baseCurrency}`
      )
    }

    // Reject unsupported settlement currency BEFORE any write (Requirement 3.6).
    this.assertSupportedCurrency(ui)
    const currency = ui as CurrencyCode

    // Resolve the SAR-relative rate up front; an unsupported/invalid rate
    // throws here, before any write, preserving immutability (Requirement 3.6).
    const rate = this.resolveRate(currency, rates)

    const baseSubtotal = this.resolveSubtotal(order)
    const amounts = this.computeAmounts(
      {
        subtotal: baseSubtotal,
        shipping: toNumber(order.shipping_total),
        tax: toNumber(order.tax_total),
        discount: toNumber(order.discount_total),
        total: toNumber(order.total),
      },
      currency,
      rates
    )

    const snapshot_json = {
      ui: currency,
      base: "SAR",
      rates,
      order_display_id: order.display_id,
      item_count: Array.isArray(order.items) ? order.items.length : 0,
      region_id: order.region_id,
      at: new Date().toISOString(),
    }

    return await this.upsertSettlement(orderId, {
      currency_code: currency,
      base_currency_code: "SAR",
      rate,
      ...amounts,
      snapshot_json,
    })
  }

  /**
   * Recompute an existing settlement into a new currency / rate while
   * preserving the order's base-currency (`SAR`) amounts (Requirements 3.3,
   * 3.5, 3.6).
   *
   * The previously persisted amounts are converted back to their SAR base
   * (dividing by the previously applied rate), then re-converted to the new
   * currency at the supplied rate. The unsupported-currency check runs **before**
   * any write, so an invalid currency leaves the existing settlement currency
   * and amount unchanged (Requirement 3.6).
   *
   * @throws {MedusaError} `NOT_FOUND` when no settlement exists for the order.
   * @throws {MedusaError} `INVALID_DATA` when the target currency is unsupported
   *   or the supplied rate is missing/invalid for a non-SAR currency.
   */
  async updateSettlementCurrency(
    orderId: string,
    data: UpdateSettlementCurrencyInput
  ) {
    const existing = await this.getSettlement(orderId)
    if (!existing) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No settlement found for order ${orderId}`
      )
    }

    // Reject unsupported settlement currency BEFORE any write (Requirement 3.6).
    this.assertSupportedCurrency(data.currency_code)
    const currency = data.currency_code as CurrencyCode

    // Determine the new applied rate. SAR is always 1; other currencies require
    // a positive finite rate supplied by the caller.
    const newRate =
      currency === "SAR" ? 1 : toNumber(data.rate)
    if (currency !== "SAR" && (!Number.isFinite(newRate) || newRate <= 0)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `A positive conversion rate is required to settle in ${currency}`
      )
    }

    // Convert the previously persisted amounts back to their SAR base using the
    // previously applied rate, preserving the SAR base across re-settlement.
    const prevRate = toNumber(existing.rate) || 1
    const toSar = (amount: unknown): number => toNumber(amount) / prevRate

    const baseAmounts: ComputedAmounts = {
      subtotal: toSar(existing.subtotal),
      shipping: toSar(existing.shipping),
      tax: toSar(existing.tax),
      discount: toSar(existing.discount),
      total: toSar(existing.total),
    }

    const amounts = this.applyRate(baseAmounts, currency, newRate)

    const prevSnapshot =
      existing.snapshot_json && typeof existing.snapshot_json === "object"
        ? (existing.snapshot_json as Record<string, unknown>)
        : {}

    const snapshot_json = {
      ...prevSnapshot,
      ui: currency,
      base: "SAR",
      rate: newRate,
      reason: data.reason,
      at: new Date().toISOString(),
    }

    return await this.upsertSettlement(orderId, {
      currency_code: currency,
      base_currency_code: "SAR",
      rate: newRate,
      ...amounts,
      snapshot_json,
    })
  }

  /**
   * Assert that `code` is a supported settlement currency
   * {SAR, YER_NEW, YER_OLD} (Requirement 3.6).
   *
   * @throws {MedusaError} `INVALID_DATA` with a descriptive message naming the
   *   unsupported currency.
   */
  private assertSupportedCurrency(code: unknown): void {
    if (typeof code !== "string" || !isSupported(code)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unsupported settlement currency: ${String(code)}. Supported currencies are ${SUPPORTED_CURRENCIES.join(", ")}.`
      )
    }
  }

  /**
   * Resolve the SAR-relative rate for a supported currency, validating that a
   * usable rate exists for non-SAR currencies before any write.
   *
   * @throws {MedusaError} `INVALID_DATA` when the rate for a non-SAR currency is
   *   missing or non-positive.
   */
  private resolveRate(
    currency: CurrencyCode,
    rates: Record<string, number>
  ): number {
    if (currency === "SAR") {
      return 1
    }
    const rate = rates?.[currency]
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `No valid FX rate configured for settlement currency ${currency}`
      )
    }
    return rate
  }

  /**
   * Derive the order subtotal in the base currency.
   *
   * Prefers summing line items (`unit_price * quantity`) when present — matching
   * the Old Store `computeFromOrder` behavior — otherwise falls back to
   * `order.subtotal`.
   */
  private resolveSubtotal(order: SettlementOrderInput): number {
    if (Array.isArray(order.items) && order.items.length > 0) {
      return order.items.reduce((sum, item) => {
        const price = toNumber(item.unit_price)
        const quantity = toNumber(item.quantity) || 1
        return sum + price * quantity
      }, 0)
    }
    return toNumber(order.subtotal)
  }

  /**
   * Convert a set of base-currency (`SAR`) amounts to the selected currency via
   * the FX library (Requirement 3.3).
   *
   * Each amount is converted with `convertAmount` (which rounds to 2 dp);
   * zero/non-positive amounts short-circuit to `0` since `convertAmount`
   * rejects amounts below 0.01. YER currencies then receive integer
   * presentation rounding; SAR keeps the 2-decimal result.
   */
  private computeAmounts(
    base: ComputedAmounts,
    currency: CurrencyCode,
    rates: Record<string, number>
  ): ComputedAmounts {
    const convertOne = (amount: number): number => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return 0
      }
      const converted = convertAmount(amount, "SAR", currency, rates, {
        enabled: true,
      })
      return currency === "SAR" ? converted : Math.round(converted)
    }

    return {
      subtotal: convertOne(base.subtotal),
      shipping: convertOne(base.shipping),
      tax: convertOne(base.tax),
      discount: convertOne(base.discount),
      total: convertOne(base.total),
    }
  }

  /**
   * Apply a known SAR-relative rate to base-currency amounts (used by the
   * rate-driven recompute path). SAR keeps 2-decimal precision; YER amounts use
   * integer presentation rounding.
   */
  private applyRate(
    base: ComputedAmounts,
    currency: CurrencyCode,
    rate: number
  ): ComputedAmounts {
    const applyOne = (amount: number): number => {
      if (!Number.isFinite(amount) || amount <= 0) {
        return 0
      }
      const converted = amount * rate
      return currency === "SAR" ? round2(converted) : Math.round(converted)
    }

    return {
      subtotal: applyOne(base.subtotal),
      shipping: applyOne(base.shipping),
      tax: applyOne(base.tax),
      discount: applyOne(base.discount),
      total: applyOne(base.total),
    }
  }

  /**
   * Create or update the `order_settlement` row for an order (upsert by
   * `order_id`). Only the `order_settlement` table is written (Requirement 3.2).
   */
  private async upsertSettlement(
    orderId: string,
    data: {
      currency_code: string
      base_currency_code: string
      rate: number
      subtotal: number
      shipping: number
      tax: number
      discount: number
      total: number
      snapshot_json: Record<string, unknown>
    }
  ) {
    const existing = await this.getSettlement(orderId)

    const payload = {
      order_id: orderId,
      currency_code: data.currency_code,
      base_currency_code: data.base_currency_code,
      rate: data.rate,
      subtotal: data.subtotal,
      shipping: data.shipping,
      tax: data.tax,
      discount: data.discount,
      total: data.total,
      // `snapshot_json` is a jsonb column; the generated type narrows json to
      // `Record<string, unknown>`.
      snapshot_json: data.snapshot_json as unknown as Record<string, unknown>,
    }

    if (existing) {
      const updated = await this.updateOrderSettlements(payload)
      return Array.isArray(updated) ? updated[0] : updated
    }

    const created = await this.createOrderSettlements(payload)
    return Array.isArray(created) ? created[0] : created
  }
}

export default SettlementModuleService
