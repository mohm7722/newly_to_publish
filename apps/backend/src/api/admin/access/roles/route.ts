import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { RBAC_MODULE } from "../../../../modules/rbac"
import type RbacModuleService from "../../../../modules/rbac/service"

/**
 * Admin role routes.
 *
 *  - `GET  /admin/rbac/roles` → list all roles (gated by `roles:read`).
 *  - `POST /admin/rbac/roles` → create a custom role (gated by `roles:write`).
 */

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
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
    const roles = await rbac.listRoles()
    nocache(res)
    res.status(200).json({ roles })
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
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid role payload", issues: parsed.error.issues })
    return
  }
  try {
    const rbac = req.scope.resolve<RbacModuleService>(RBAC_MODULE)
    const role = await rbac.createRole({
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      permissions: parsed.data.permissions ?? [],
    })
    nocache(res)
    res.status(201).json({ role })
  } catch (error) {
    handleServiceError(error, res)
  }
}
