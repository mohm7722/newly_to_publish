import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../modules/rbac"
import type RbacModuleService from "../modules/rbac/service"
import { DEFAULT_ROLES } from "../modules/rbac/default-roles"

/**
 * RBAC seed migration script.
 *
 * Runs with the full application container (unlike a module loader, which is
 * scoped to its own module and cannot resolve the User module). Named `00-…` so
 * it sorts ahead of the other project migration scripts.
 *
 * Idempotent:
 *   1. Ensures every default ERP role exists, creating only the missing ones
 *      (by slug). Existing roles are never overwritten, so admin edits to a
 *      role's permissions are preserved.
 *   2. Anti-lockout: if there are admin users but no role assignments yet,
 *      grants the super-admin role to every existing admin user so the system
 *      is never left without an authorized administrator.
 *
 * Failures are logged and swallowed so this script never blocks the migration
 * batch.
 */
export default async function seed_rbac({
  container,
}: {
  container: MedusaContainer
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const rbac = container.resolve<RbacModuleService>(RBAC_MODULE)

    // 1. Ensure default roles exist.
    for (const def of DEFAULT_ROLES) {
      const existing = await rbac.getRoleBySlug(def.slug)
      if (!existing) {
        await rbac.createRole({
          name: def.name,
          slug: def.slug,
          description: def.description,
          permissions: [...def.permissions],
          is_super: def.is_super,
          is_system: def.is_system,
        })
        logger.info(`[rbac] seeded default role "${def.slug}"`)
      }
    }

    // 2. Anti-lockout: assign super-admin to existing users if nobody has a role.
    const anyAssignment = await rbac.listRbacUserRoles({}, { take: 1 })
    if (anyAssignment.length === 0) {
      const superRole = await rbac.getRoleBySlug("super_admin")
      if (superRole) {
        const userService = container.resolve(Modules.USER)
        const users = await userService.listUsers({}, { take: 1000 })
        for (const user of users) {
          await rbac.assignRole(user.id, superRole.id)
        }
        if (users.length > 0) {
          logger.info(
            `[rbac] anti-lockout: granted super-admin to ${users.length} existing user(s)`
          )
        }
      }
    }

    logger.info("[rbac] seeding complete")
  } catch (err) {
    logger.error(
      `[rbac] seed script failed (continuing): ${
        (err as Error)?.message ?? err
      }`
    )
  }
}
