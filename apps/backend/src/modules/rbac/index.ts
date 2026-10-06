import { Module } from "@medusajs/framework/utils"
import RbacModuleService from "./service"
import { Role } from "./models/role"
import { UserRole } from "./models/user-role"

/**
 * RBAC_Module — admin users, roles, and permissions.
 *
 * Idiomatic Medusa 2.16 module (`model.define` + `MedusaService`) providing a
 * fully dynamic role/permission system for admin users:
 *  - {@link Role}: named bundles of permission keys (from the static catalog in
 *    `permissions.ts`), created/edited/deleted at runtime.
 *  - {@link UserRole}: maps admin users to roles (many-to-many).
 *
 * Both backing tables (`rbac_role`, `rbac_user_role`) are **new** and additive;
 * they do not touch any schema-guard-protected legacy table.
 *
 * Default ERP roles and anti-lockout assignment are provisioned by the
 * migration script `src/migration-scripts/00-seed-rbac.ts`, which runs with the
 * full application container (a module loader cannot resolve the User module).
 */
export const RBAC_MODULE = "rbac"

export { Role, UserRole }
export { default as RbacModuleService } from "./service"

export default Module(RBAC_MODULE, {
  service: RbacModuleService,
})
