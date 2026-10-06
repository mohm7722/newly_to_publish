import type { MedusaResponse } from "@medusajs/framework/http"

/**
 * Disable HTTP caching for an admin/store JSON response.
 *
 * Mirrors the Old Store `nocache` helper: sets `Cache-Control`, `Pragma`, and
 * `Expires` headers so the admin dashboard always reads fresh data after a
 * mutation. Returns the response for optional chaining.
 */
export function nocache(res: MedusaResponse): MedusaResponse {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  res.setHeader("Surrogate-Control", "no-store")
  return res
}
