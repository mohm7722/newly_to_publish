import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { nocache } from "../../utils/nocache"
import { requirePermission } from "../../utils/rbac"
import { handleServiceError } from "../../utils/errors"
import {
  loadTrackingConfig,
  saveTrackingConfig,
  getSecretStatus,
  type TrackingConfig,
} from "../../../lib/tracking/config-store"

/**
 * GET /admin/tracking-config
 *
 * Return the current public tracking configuration (GTM / Meta Pixel / GA4 ids,
 * from the database) together with the presence — not the value — of the secret
 * env credentials. Gated by `tracking:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "tracking:read")) {
    return
  }
  try {
    const config = await loadTrackingConfig(req.scope)
    nocache(res)
    res.status(200).json({ config, secrets: getSecretStatus() })
  } catch (error) {
    handleServiceError(error, res)
  }
}

/** Optional string field validator (length-bounded). */
function optionalString(
  value: unknown,
  field: string,
  max: number
): string | undefined {
  if (value === undefined) return undefined
  if (value === null) return ""
  if (typeof value !== "string") {
    throw new ValidationError(`${field} must be a string`)
  }
  if (value.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`)
  }
  return value.trim()
}

class ValidationError extends Error {}

/**
 * POST /admin/tracking-config
 *
 * Update the public tracking identifiers in the database. Secrets are never
 * accepted or written here (they live in env). Gated by `tracking:write`.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "tracking:write")) {
    return
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const next: Partial<TrackingConfig> = {}

    if (body.enabled !== undefined) {
      if (typeof body.enabled !== "boolean") {
        throw new ValidationError("enabled must be a boolean")
      }
      next.enabled = body.enabled
    }

    const gtm = optionalString(body.gtm_id, "gtm_id", 50)
    if (gtm !== undefined) next.gtm_id = gtm
    const pixel = optionalString(body.meta_pixel_id, "meta_pixel_id", 50)
    if (pixel !== undefined) next.meta_pixel_id = pixel
    const apiVersion = optionalString(body.meta_api_version, "meta_api_version", 10)
    if (apiVersion !== undefined) next.meta_api_version = apiVersion
    const testCode = optionalString(
      body.meta_test_event_code,
      "meta_test_event_code",
      50
    )
    if (testCode !== undefined) next.meta_test_event_code = testCode
    const ga4 = optionalString(body.ga4_measurement_id, "ga4_measurement_id", 50)
    if (ga4 !== undefined) next.ga4_measurement_id = ga4

    const config = await saveTrackingConfig(req.scope, next)
    nocache(res)
    res.status(200).json({ config, secrets: getSecretStatus() })
  } catch (error) {
    if (error instanceof ValidationError) {
      res.status(400).json({ message: error.message })
      return
    }
    handleServiceError(error, res)
  }
}
