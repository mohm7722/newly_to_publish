/**
 * Admin FX rate routes.
 *
 * File-based handlers for `/admin/fx/rates`. Reads the configured per-quote FX
 * rates and writes a single quote rate (with audit logging) backed by
 * `store.metadata.currency_fx`.
 *
 * Requirements:
 * - 2.3 / 2.4: FX rates are sourced from / written to the canonical FX config.
 * - 8.1: file-based admin route handlers for FX administration.
 * - 8.3: rate writes are finance-role gated.
 * - 8.6: authentication is handled by the framework's authenticated-admin
 *   middleware for all `/admin/*` routes; only the finance-role gate is added.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import { loadFxConfig, writeRate, SUPPORTED_CURRENCIES } from "../../../../lib/fx"
import { getAdminIdentity } from "../../../utils/rbac"

/** Request body schema for writing a single quote rate. */
const rateSchema = z.object({
  quote: z.enum(SUPPORTED_CURRENCIES),
  rate: z.number().finite().positive(),
})

/**
 * GET /admin/fx/rates
 *
 * Returns a `Record<string, number>` of all supported pair rates. `SAR` is
 * always present and equal to `1`; each `YER_*` code is included only when a
 * rate is configured in the stored map.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cfg = await loadFxConfig(req.scope)

    const rates: Record<string, number> = { SAR: 1 }
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === "SAR") {
        continue
      }
      if (typeof cfg.rates[code] === "number") {
        rates[code] = cfg.rates[code]
      }
    }

    return res.status(200).json(rates)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}

/**
 * POST /admin/fx/rates (finance-gated)
 *
 * Validates `{ quote, rate }` and persists the rate with an audit-log entry.
 * `quote` must be a supported currency and `rate` must be finite and `> 0`.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Authorization is enforced centrally (fx:write) by the RBAC middleware.
    const parsed = rateSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid fx rate input" })
    }

    const { quote, rate } = parsed.data
    await writeRate(req.scope, quote, rate, getAdminIdentity(req))
    return res.status(200).json({ quote, rate })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
