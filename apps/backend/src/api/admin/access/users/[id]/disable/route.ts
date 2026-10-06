import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"
import { nocache } from "../../../../../utils/nocache"
import {
  requirePermission,
  getPermissionContext,
} from "../../../../../utils/rbac"
import { handleServiceError } from "../../../../../utils/errors"
import { RBAC_MODULE } from "../../../../../../modules/rbac"
import type RbacModuleService from "../../../../../../modules/rbac/service"

/**
 * POST /admin/access/users/:id/disable
 *
 * Enables or disables an admin user by setting `user.metadata.disabled`. A
 * disabled user is blocked from every `/admin/*` route by the RBAC middleware.
 * Gated by `users:update`. A user cannot disable their own account
 * (anti-lockout), and only a super admin may disable or re-enable a user who
 * holds a super role (privilege-escalation guard).
 *
 * Body: `{ "disabled": boolean }`.
 */
const schema = z.object({
  disabled: z.boolean(),
})

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "users:update")) {
    return
  }

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid payload", issues: parsed.error.issues })
    return
  }

  const targetId = req.params.id
  const acting = getPermissionContext(req)
  if (parsed.data.disabled && acting?.userId === targetId) {
    res.status(400).json({ message: "لا يمكنك تعطيل حسابك الخاص" })
    return
  }

  try {
    if (!acting?.isSuper) {
      const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)
      const targetRoles = await rbac.listRolesForUser(targetId)
      if (targetRoles.some((r) => r.is_super)) {
        res.status(403).json({
          message: "تعطيل حسابات مدير النظام أو تفعيلها متاح لمدير النظام فقط",
        })
        return
      }
    }

    const userService = req.scope.resolve(Modules.USER)
    const user = await userService.retrieveUser(targetId)
    const metadata = (user.metadata ?? {}) as Record<string, unknown>

    await userService.updateUsers({
      id: targetId,
      metadata: { ...metadata, disabled: parsed.data.disabled },
    })

    nocache(res)
    res.status(200).json({ id: targetId, disabled: parsed.data.disabled })
  } catch (error) {
    handleServiceError(error, res)
  }
}
