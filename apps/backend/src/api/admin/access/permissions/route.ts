import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import {
  PERMISSIONS,
  PERMISSION_GROUPS,
} from "../../../../modules/rbac/permissions"

/**
 * GET /admin/rbac/permissions
 *
 * Returns the static permission catalog (grouped) so the admin UI can render
 * the role permission picker. Gated by `roles:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "roles:read")) {
    return
  }
  nocache(res)
  res.status(200).json({
    permissions: PERMISSIONS,
    groups: PERMISSION_GROUPS,
  })
}
