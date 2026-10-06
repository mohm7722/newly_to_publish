import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { RBAC_MODULE } from "../../../../modules/rbac"
import type RbacModuleService from "../../../../modules/rbac/service"

/**
 * GET /admin/rbac/users
 *
 * Lists admin users together with their assigned roles and disabled state.
 * Gated by `users:read`. Role lookups are batched (all assignments + all roles
 * loaded once, then mapped) to avoid per-user queries.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "users:read")) {
    return
  }
  try {
    const userService = req.scope.resolve(Modules.USER)
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)

    const users = await userService.listUsers({}, { take: 1000 })
    const assignments = await rbac.listRbacUserRoles({})
    const roles = await rbac.listRoles()

    const roleById = new Map(roles.map((r) => [r.id, r]))
    const rolesByUser = new Map<string, string[]>()
    for (const a of assignments) {
      const list = rolesByUser.get(a.user_id) ?? []
      list.push(a.role_id)
      rolesByUser.set(a.user_id, list)
    }

    const result = users.map((u) => {
      const roleIds = rolesByUser.get(u.id) ?? []
      const metadata = (u.metadata ?? {}) as Record<string, unknown>
      return {
        id: u.id,
        email: u.email,
        first_name: u.first_name ?? null,
        last_name: u.last_name ?? null,
        disabled: metadata.disabled === true,
        roles: roleIds
          .map((id) => roleById.get(id))
          .filter((r): r is NonNullable<typeof r> => Boolean(r))
          .map((r) => ({ id: r.id, name: r.name, slug: r.slug })),
      }
    })

    nocache(res)
    res.status(200).json({ users: result })
  } catch (error) {
    handleServiceError(error, res)
  }
}
