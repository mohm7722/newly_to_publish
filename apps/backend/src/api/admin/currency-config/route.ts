/**
 * Admin currency-config routes.
 *
 * File-based handlers for `/admin/currency-config`. Reads and writes the FX
 * currency configuration (`enabled` currency list + `default` currency) backed
 * by `store.metadata.currency_fx` via the FX config accessors.
 *
 * Requirements:
 * - 2.3 / 2.4: currency configuration is sourced from the canonical FX config.
 * - 8.1: file-based admin route handlers for FX/currency administration.
 * - 8.3: writes are finance-role gated.
 * - 8.6: authentication is handled by the framework's authenticated-admin
 *   middleware for all `/admin/*` routes; only the finance-role gate is added.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"

import { loadFxConfig, saveFxConfig, SUPPORTED_CURRENCIES } from "../../../lib/fx"
import { getAdminIdentity } from "../../utils/rbac"

/** Request body schema for updating the currency configuration. */
const currencyConfigSchema = z.object({
  enabled: z.array(z.string()),
  default: z.string(),
})

/**
 * GET /admin/currency-config
 *
 * Returns the current `enabled` currency list and `default` currency.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cfg = await loadFxConfig(req.scope)
    return res.status(200).json({ enabled: cfg.enabled, default: cfg.default })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}

/**
 * POST /admin/currency-config (finance-gated)
 *
 * Validates and persists the `enabled`/`default` currency configuration.
 * Rejects when `enabled` is empty, any code is unsupported, or `default` is not
 * within `enabled`.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Authorization is enforced centrally (currency_config:write) by the RBAC
    // middleware.
    const parsed = currencyConfigSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid currency config input" })
    }

    const { enabled, default: def } = parsed.data
    const allowed = new Set<string>(SUPPORTED_CURRENCIES as readonly string[])

    if (enabled.length === 0) {
      return res.status(400).json({ message: "Invalid currency config: enabled must not be empty" })
    }
    if (!enabled.every((c) => allowed.has(c))) {
      return res.status(400).json({ message: "Invalid currency config: unsupported currency code" })
    }
    if (!enabled.includes(def)) {
      return res.status(400).json({ message: "Invalid currency config: default must be within enabled" })
    }

    const saved = await saveFxConfig(req.scope, { enabled, default: def }, getAdminIdentity(req))
    return res.status(200).json({ enabled: saved.enabled, default: saved.default })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
