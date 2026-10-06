import type { MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

/**
 * Map a thrown error to an HTTP response with a consistent shape.
 *
 *  - `MedusaError(NOT_FOUND)`   → 404
 *  - `MedusaError(INVALID_DATA)`→ 400
 *  - `MedusaError(NOT_ALLOWED)` → 403
 *  - anything else              → 500
 */
export function handleServiceError(
  error: unknown,
  res: MedusaResponse
): void {
  if (error instanceof MedusaError) {
    if (error.type === MedusaError.Types.NOT_FOUND) {
      res.status(404).json({ message: error.message })
      return
    }
    if (error.type === MedusaError.Types.INVALID_DATA) {
      res.status(400).json({ message: error.message })
      return
    }
    if (error.type === MedusaError.Types.NOT_ALLOWED) {
      res.status(403).json({ message: error.message })
      return
    }
  }
  res.status(500).json({
    message: (error as Error)?.message ?? "Internal server error",
  })
}
