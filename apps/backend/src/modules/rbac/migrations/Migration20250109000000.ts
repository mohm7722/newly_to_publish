import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * RBAC_Module — additive, idempotent migration.
 *
 * Hand-authored (NOT auto-generated) migration that creates the two **new**
 * tables backing the RBAC module: `rbac_role` and `rbac_user_role`. Both are
 * brand-new tables, so this migration is purely additive and touches none of
 * the schema-guard-protected legacy tables.
 *
 * Safety properties:
 *   - Additive-only: `CREATE TABLE IF NOT EXISTS` + `CREATE INDEX IF NOT EXISTS`.
 *   - Idempotent / safe to re-run: every statement is guarded by `IF NOT EXISTS`.
 *   - Unique indexes use `WHERE deleted_at IS NULL` to match `MedusaService`
 *     soft-delete semantics (a soft-deleted row must not block re-creation).
 */
export class Migration20250109000000 extends Migration {
  async up(): Promise<void> {
    // rbac_role
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "rbac_role" (
        "id" text NOT NULL,
        "name" text NOT NULL,
        "slug" text NOT NULL,
        "description" text NULL,
        "permissions" jsonb NOT NULL DEFAULT '[]',
        "is_super" boolean NOT NULL DEFAULT false,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "rbac_role_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_role_slug_unique" ON "rbac_role" ("slug") WHERE "deleted_at" IS NULL;`
    )

    // rbac_user_role
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "rbac_user_role" (
        "id" text NOT NULL,
        "user_id" text NOT NULL,
        "role_id" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "rbac_user_role_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_rbac_user_role_pair_unique" ON "rbac_user_role" ("user_id", "role_id") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_rbac_user_role_user_id" ON "rbac_user_role" ("user_id") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_rbac_user_role_role_id" ON "rbac_user_role" ("role_id") WHERE "deleted_at" IS NULL;`
    )
  }

  async down(): Promise<void> {
    // Reversal drops the RBAC tables. These are this module's own new tables
    // (not preserved legacy tables), so dropping them on an explicit rollback
    // is acceptable.
    this.addSql(`DROP TABLE IF EXISTS "rbac_user_role";`)
    this.addSql(`DROP TABLE IF EXISTS "rbac_role";`)
  }
}
