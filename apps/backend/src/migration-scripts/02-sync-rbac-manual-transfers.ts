import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../modules/rbac"
import type RbacModuleService from "../modules/rbac/service"
import { DEFAULT_ROLES } from "../modules/rbac/default-roles"

/** Reconcile system roles after adding manual-transfer review permissions. */
export default async function syncManualTransferPermissions({
  container,
}: {
  container: MedusaContainer
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const rbac = container.resolve<RbacModuleService>(RBAC_MODULE)

  for (const role of DEFAULT_ROLES) {
    await rbac.reconcileDefaultRole(role)
  }

  logger.info(
    `[rbac] synchronized manual-transfer permissions for ${DEFAULT_ROLES.length} system role(s)`
  )
}
