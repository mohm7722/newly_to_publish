import { model } from "@medusajs/framework/utils"

/**
 * UserRole assignment (RBAC module).
 *
 * A self-contained pivot mapping an admin user (by the framework `user.id`) to
 * a {@link Role}. We manage this association inside the module — rather than via
 * a framework module link — so the table name and migration stay deterministic
 * and hand-authored, consistent with the rest of this project.
 *
 * `user_id` is the opaque framework user id; it is stored as plain text (no FK
 * to the framework `user` table) so the RBAC module remains decoupled. A user
 * may hold multiple roles; the effective permission set is the union of all
 * assigned roles. The `(user_id, role_id)` pair is unique to prevent duplicate
 * assignments.
 *
 * This is a **new** table (`rbac_user_role`); it does not touch any
 * schema-guard-protected legacy table.
 */
export const UserRole = model
  .define(
    { name: "user_role", tableName: "rbac_user_role" },
    {
      id: model.id({ prefix: "urole" }).primaryKey(),
      user_id: model.text(),
      role_id: model.text(),
    }
  )
  .indexes([
    { on: ["user_id", "role_id"], unique: true },
    { on: ["user_id"] },
    { on: ["role_id"] },
  ])

export default UserRole
