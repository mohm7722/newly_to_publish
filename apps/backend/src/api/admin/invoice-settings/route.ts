import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { nocache } from "../../utils/nocache"
import { requirePermission } from "../../utils/rbac"
import { handleServiceError } from "../../utils/errors"
import { InvoiceSettingsService } from "../../../lib/invoice-settings"

/**
 * Admin invoice-settings routes.
 *
 *  - `GET /admin/invoice-settings` → read settings (gated `invoice_settings.read`).
 *  - `PUT /admin/invoice-settings` → update settings (gated `invoice_settings.write`).
 *
 * Storage is isolated behind {@link InvoiceSettingsService} (currently
 * `store.metadata`). Enforcement is delegated to this handler (the namespace is
 * delegated in the central route map).
 */

const updateSchema = z.object({
  store_name_override: z.string().optional(),
  logo_url: z.string().nullish(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  website: z.string().optional(),
  tax_number: z.string().optional(),
  footer_note: z.string().optional(),
})

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "invoice_settings.read")) {
    return
  }
  try {
    const service = new InvoiceSettingsService(req.scope)
    const settings = await service.get()
    nocache(res)
    res.status(200).json({ invoice_settings: settings })
  } catch (error) {
    handleServiceError(error, res)
  }
}

export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "invoice_settings.write")) {
    return
  }
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid invoice settings", issues: parsed.error.issues })
    return
  }
  try {
    const service = new InvoiceSettingsService(req.scope)
    const settings = await service.save(parsed.data)
    nocache(res)
    res.status(200).json({ invoice_settings: settings })
  } catch (error) {
    handleServiceError(error, res)
  }
}
