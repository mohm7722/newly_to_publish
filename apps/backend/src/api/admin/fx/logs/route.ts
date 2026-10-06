/**
 * Admin FX rate-change audit log routes.
 *
 * File-based handler for `/admin/fx/logs`. Returns the newest-first FX
 * rate-change audit trail backed by `store.metadata.currency_fx`, with optional
 * filtering by quote and a clamped result limit.
 *
 * Requirements:
 * - 2.3 / 2.4: audit logs are sourced from the canonical FX config.
 * - 8.1: file-based admin route handler for FX administration.
 * - 8.6: authentication is handled by the framework's authenticated-admin
 *   middleware for all `/admin/*` routes (reads are not finance-gated).
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { loadFxConfig } from "../../../../lib/fx"

/** Default and bounds for the result limit. */
const DEFAULT_LIMIT = 50
const MIN_LIMIT = 1
const MAX_LIMIT = 500

/**
 * GET /admin/fx/logs
 *
 * Optional query params:
 * - `quote`: filter to a single quote currency.
 * - `limit`: max entries to return, clamped to `[1, 500]` (default 50).
 *
 * Entries are returned newest-first (descending by `at`).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.query as { quote?: string; limit?: string }
    const quote = typeof query.quote === "string" ? query.quote : undefined

    const parsedLimit = parseInt(String(query.limit ?? ""), 10)
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, parsedLimit))
      : DEFAULT_LIMIT

    const cfg = await loadFxConfig(req.scope)

    const filtered = quote
      ? cfg.logs.filter((entry) => entry.quote === quote)
      : [...cfg.logs]

    filtered.sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0))

    const out = filtered.slice(0, limit)
    return res.status(200).json(out)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
