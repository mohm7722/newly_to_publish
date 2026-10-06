import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { nocache } from "../../../utils/nocache"
import { getPermissionContext } from "../../../utils/rbac"

/**
 * GET /admin/rbac/me
 *
 * Returns the acting admin's effective permission context (roles, permission
 * keys, super flag). Any authenticated admin may read their own context; it is
 * used by the admin UI to show/hide actions. When the middleware could not
 * resolve a context (e.g. an API-token actor), an empty, non-super context is
 * returned.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const ctx = getPermissionContext(req)
  nocache(res)
  res.status(200).json({
    user_id: ctx?.userId ?? null,
    email: ctx?.email ?? null,
    roles: ctx?.roles ?? [],
    permissions: ctx?.permissions ?? [],
    is_super: ctx?.isSuper ?? false,
  })
}
