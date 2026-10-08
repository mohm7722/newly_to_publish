import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../modules/rbac"
import type RbacModuleService from "../modules/rbac/service"
import { DEFAULT_ROLES } from "../modules/rbac/default-roles"

/**
 * Reconcile system roles after adding the `reviews` resource permissions
 * (`reviews:read` / `reviews:update` / `reviews:delete`).
 *
 * Migration scripts run once (tracked by Medusa), so adding the permissions to
 * `default-roles.ts` alone would not reach already-seeded installs — this
 * higher-numbered sync script propagates them to the managed system roles.
 * Custom roles created by admins are never touched.
 */
export default async function syncReviewPermissions({
  container,
}: {
  container: MedusaContainer
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const rbac = container.resolve<RbacModuleService>(RBAC_MODULE)
    for (const role of DEFAULT_ROLES) {
      await rbac.reconcileDefaultRole(role)
    }
    logger.info(
      `[rbac] synchronized reviews permissions for ${DEFAULT_ROLES.length} system role(s)`
    )
  } catch (err) {
    logger.error(
      `[rbac] reviews role-sync script failed (continuing): ${
        (err as Error)?.message ?? err
      }`
    )
  }
}
