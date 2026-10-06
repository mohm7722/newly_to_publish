import { model } from "@medusajs/framework/utils"

/**
 * CODSettings data model (Payments_Module).
 *
 * Maps the idiomatic Medusa 2.16 `model.define` model onto the **existing**
 * production `cod_settings` table without introducing any new business column
 * or renaming an existing one (Requirements 1.1, 1.2). The table holds a single
 * **singleton row** describing the store-wide Cash-on-Delivery configuration.
 *
 * Table mapping
 * -------------
 * The model name is the singular `cod_settings` and the backing table is the
 * existing `cod_settings`. The `{ name, tableName }` form of `model.define`
 * pins the table name so the framework reads/writes the legacy table rather
 * than deriving a fresh table name. (`MedusaService` does NOT auto-pluralize,
 * so the explicit `tableName` guarantees the framework targets the existing
 * `cod_settings` table.)
 *
 * Column mapping (exact, 1:1 with the existing table)
 * ---------------------------------------------------
 * - `id`                → `id` uuid PK. Treated as an **opaque string**: ids are
 *                         supplied on create via `randomUUID()` and the existing
 *                         singleton row keeps its stored value. The framework
 *                         never generates a replacement PK (Requirement 1.3).
 * - `enabled`           → `enabled` boolean, default false.
 * - `instructions`      → `instructions` text, nullable.
 * - `selected_city_ids` → `selected_city_ids` jsonb, nullable. Stores a
 *                         `string[]` of shipping city ids that gate COD
 *                         availability (Requirements 4.4, 4.7, 4.8).
 *
 * The framework-managed `created_at` / `updated_at` columns already exist on the
 * table; the single additive, nullable `deleted_at` column required by
 * `MedusaService` soft-delete semantics is added by the module migration
 * (additive-only, see `migrations/`).
 */
export const CODSettings = model.define(
  { name: "cod_settings", tableName: "cod_settings" },
  {
    id: model.id().primaryKey(),
    enabled: model.boolean().default(false),
    instructions: model.text().nullable(),
    selected_city_ids: model.json().nullable(),
  }
)

export default CODSettings
