import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { nocache } from "../../../../utils/nocache"
import { requirePermission } from "../../../../utils/rbac"
import { handleServiceError } from "../../../../utils/errors"
import { RBAC_MODULE } from "../../../../../modules/rbac"
import type RbacModuleService from "../../../../../modules/rbac/service"

/**
 * Admin single-role routes.
 *
 *  - `GET    /admin/rbac/roles/:id` → retrieve a role (gated by `roles:read`).
 *  - `POST   /admin/rbac/roles/:id` → update name/description/permissions
 *    (gated by `roles:write`; super role is immutable, slug/flags are fixed).
 *  - `DELETE /admin/rbac/roles/:id` → delete a custom role (gated by
 *    `roles:write`; system roles cannot be deleted).
 */

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullish(),
  permissions: z.array(z.string()).optional(),
})

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "roles:read")) {
    return
  }
  try {
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)
    const role = await rbac.retrieveRole(req.params.id)
    nocache(res)
    res.status(200).json({ role })
  } catch (error) {
    handleServiceError(error, res)
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "roles:write")) {
    return
  }
  const parsed = updateSchema.safeParse(req.body)
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid role payload", issues: parsed.error.issues })
    return
  }
  try {
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)
    const role = await rbac.updateRole(req.params.id, {
      name: parsed.data.name,
      description: parsed.data.description,
      permissions: parsed.data.permissions,
    })
    nocache(res)
    res.status(200).json({ role })
  } catch (error) {
    handleServiceError(error, res)
  }
}

export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "roles:write")) {
    return
  }
  try {
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)
    await rbac.deleteRole(req.params.id)
    nocache(res)
    res.status(200).json({ id: req.params.id, deleted: true })
  } catch (error) {
    handleServiceError(error, res)
  }
}
