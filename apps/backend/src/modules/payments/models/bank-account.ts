import { model } from "@medusajs/framework/utils"

/**
 * BankAccount data model (Payments_Module).
 *
 * Maps the idiomatic Medusa 2.16 `model.define` model onto the **existing**
 * production `bank_accounts` table without introducing any new business column
 * or renaming an existing one (Requirements 1.1, 1.2).
 *
 * Table mapping
 * -------------
 * The model name is the singular `bank_account`, but the backing table is the
 * existing plural `bank_accounts`. The `{ name, tableName }` form of
 * `model.define` pins the table name so the framework reads/writes the legacy
 * table instead of deriving a fresh `bank_account` table. (`MedusaService`
 * does NOT auto-pluralize the table name from the model name — without the
 * explicit `tableName` the framework would target `bank_account`, not
 * `bank_accounts` — so pinning it here is REQUIRED.)
 *
 * Column mapping (exact, 1:1 with the existing table)
 * ---------------------------------------------------
 * - `id`             → `id` uuid PK. Treated as an **opaque string**: ids are
 *                      supplied on create via `randomUUID()` and existing rows
 *                      keep their stored value. The framework never generates a
 *                      replacement PK for existing rows (Requirement 1.3).
 * - `bank_name`      → `bank_name` varchar(255).
 * - `account_number` → `account_number` varchar(100), with a UNIQUE index
 *                      matching the existing table constraint (Requirements
 *                      4.2, 4.3).
 * - `currency_code`  → `currency_code` varchar(20). Stored **exactly** as
 *                      entered with no normalization (no trim/uppercase),
 *                      supporting FX codes such as `YER_NEW`, `YER_OLD`, `SAR`
 *                      (Requirement 4.1).
 * - `instructions`   → `instructions` text, nullable.
 * - `is_active`      → `is_active` boolean, default true.
 *
 * The framework-managed `created_at` / `updated_at` columns already exist on the
 * table; the single additive, nullable `deleted_at` column required by
 * `MedusaService` soft-delete semantics is added by the module migration
 * (additive-only, see `migrations/`).
 */
export const BankAccount = model
  .define(
    { name: "bank_account", tableName: "bank_accounts" },
    {
      id: model.id().primaryKey(),
      bank_name: model.text(),
      account_number: model.text(),
      currency_code: model.text(),
      instructions: model.text().nullable(),
      is_active: model.boolean().default(true),
    }
  )
  .indexes([
    { on: ["account_number"], unique: true },
    { on: ["currency_code"] },
    { on: ["is_active"] },
  ])

export default BankAccount
