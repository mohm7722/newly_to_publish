import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { nocache } from "../../../../../utils/nocache"
import { getPermissionContext, requirePermission } from "../../../../../utils/rbac"
import { handleServiceError } from "../../../../../utils/errors"
import { RBAC_MODULE } from "../../../../../../modules/rbac"
import type RbacModuleService from "../../../../../../modules/rbac/service"

/**
 * Admin user-role assignment routes.
 *
 *  - `GET  /admin/access/users/:id/roles` → list the roles assigned to a user
 *    (gated by `users:read`).
 *  - `POST /admin/access/users/:id/roles` → replace the user's role set with the
 *    supplied `role_ids` (gated by `users:update`).
 *
 * Privilege-escalation guard: only a super admin may grant a super role, or
 * change the roles of a user who already holds one. Any other `users:update`
 * holder (e.g. the general manager) can manage every non-super assignment.
 */

const setRolesSchema = z.object({
  role_ids: z.array(z.string()),
})

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "users:read")) {
    return
  }
  try {
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)
    const roles = await rbac.listRolesForUser(req.params.id)
    nocache(res)
    res.status(200).json({
      user_id: req.params.id,
      roles: roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "users:update")) {
    return
  }
  const parsed = setRolesSchema.safeParse(req.body)
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }
  try {
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)

    if (!getPermissionContext(req)?.isSuper) {
      const [allRoles, currentRoles] = await Promise.all([
        rbac.listRoles(),
        rbac.listRolesForUser(req.params.id),
      ])
      const superRoleIds = new Set(
        allRoles.filter((r) => r.is_super).map((r) => r.id)
      )
      const grantsSuper = parsed.data.role_ids.some((id) => superRoleIds.has(id))
      const targetIsSuper = currentRoles.some((r) => r.is_super)
      if (grantsSuper || targetIsSuper) {
        res.status(403).json({
          message: "إسناد دور مدير النظام أو تعديل أدوار حساباته متاح لمدير النظام فقط",
        })
        return
      }
    }

    await rbac.setUserRoles(req.params.id, parsed.data.role_ids)
    const roles = await rbac.listRolesForUser(req.params.id)
    nocache(res)
    res.status(200).json({
      user_id: req.params.id,
      roles: roles.map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
