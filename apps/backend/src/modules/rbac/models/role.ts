import { model } from "@medusajs/framework/utils"

/**
 * Role data model (RBAC module).
 *
 * A role bundles a set of permission keys (from the static catalog in
 * `permissions.ts`) under a human-friendly name. Roles are fully dynamic:
 * admins create, edit, and delete them at runtime, and assign them to admin
 * users via the {@link UserRole} pivot.
 *
 * This is a **new** table (`rbac_role`) introduced by this module; it does not
 * touch any of the schema-guard-protected legacy tables.
 *
 * Columns
 * -------
 * - `id`          → text PK (`role_<uuid>`), supplied on create.
 * - `name`        → display name (Arabic), 1–255 chars.
 * - `slug`        → stable machine identifier, unique, lowercase snake_case.
 * - `description` → optional Arabic description.
 * - `permissions` → jsonb array of permission keys granted by this role.
 * - `is_super`    → when true the role bypasses per-permission checks (full
 *                   access) and is locked from edits/deletion.
 * - `is_system`   → when true the role is a seeded default and cannot be
 *                   deleted (but its permissions remain editable unless super).
 */
export const Role = model
  .define(
    { name: "role", tableName: "rbac_role" },
    {
      id: model.id({ prefix: "role" }).primaryKey(),
      name: model.text(),
      slug: model.text(),
      description: model.text().nullable(),
      permissions: model.json(),
      is_super: model.boolean().default(false),
      is_system: model.boolean().default(false),
    }
  )
  .indexes([{ on: ["slug"], unique: true }])

export default Role
