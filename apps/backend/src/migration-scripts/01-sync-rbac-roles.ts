import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../modules/rbac"
import type RbacModuleService from "../modules/rbac/service"
import { DEFAULT_ROLES } from "../modules/rbac/default-roles"

/**
 * RBAC role-sync migration script.
 *
 * Reconciles the managed system (default ERP) roles to their current
 * definitions in `default-roles.ts`. This runs after `00-seed-rbac.ts` and is
 * what propagates newly-added catalog permissions (e.g. when the resource
 * registry grows) into the seeded system roles.
 *
 * Migration scripts run once (tracked by Medusa). Whenever the default-role
 * definitions or the permission catalog change in a way that should reach
 * existing installs, add a new, higher-numbered sync script. Custom roles
 * created by admins are never touched.
 *
 * Failures are logged and swallowed so this never blocks the migration batch.
 */
export default async function sync_rbac_roles({
  container,
}: {
  container: MedusaContainer
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const rbac = container.resolve<RbacModuleService>(RBAC_MODULE)
    for (const def of DEFAULT_ROLES) {
      await rbac.reconcileDefaultRole(def)
    }
    logger.info(
      `[rbac] reconciled ${DEFAULT_ROLES.length} system role(s) to current defaults`
    )
  } catch (err) {
    logger.error(
      `[rbac] role-sync script failed (continuing): ${
        (err as Error)?.message ?? err
      }`
    )
  }
}
