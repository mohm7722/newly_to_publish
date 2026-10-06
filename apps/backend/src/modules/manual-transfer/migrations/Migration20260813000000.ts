import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/** Additive-only schema for private bank-transfer proof review. */
export class Migration20260813000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`CREATE TABLE IF NOT EXISTS "manual_transfer_submissions" (
      "id" text PRIMARY KEY,
      "cart_id" text NULL,
      "order_id" text NULL,
      "customer_id" text NOT NULL,
      "status" text NOT NULL DEFAULT 'submitted',
      "bank_account_id" text NOT NULL,
      "bank_name" text NOT NULL,
      "account_number" text NOT NULL,
      "currency_code" text NOT NULL,
      "expected_amount" numeric NOT NULL,
      "base_amount" numeric NOT NULL,
      "fx_rate" numeric NOT NULL,
      "proof_storage_key" text NOT NULL,
      "proof_original_name" text NOT NULL,
      "proof_mime_type" text NOT NULL,
      "proof_size" integer NOT NULL,
      "proof_sha256" text NOT NULL,
      "submitted_at" timestamptz NOT NULL,
      "reviewed_at" timestamptz NULL,
      "reviewed_by" text NULL,
      "rejection_reason" text NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL
    );`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_manual_transfer_cart" ON "manual_transfer_submissions" ("cart_id") WHERE "deleted_at" IS NULL AND "cart_id" IS NOT NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_manual_transfer_order" ON "manual_transfer_submissions" ("order_id") WHERE "deleted_at" IS NULL AND "order_id" IS NOT NULL;`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manual_transfer_customer" ON "manual_transfer_submissions" ("customer_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manual_transfer_status" ON "manual_transfer_submissions" ("status");`)
    this.addSql(`CREATE TABLE IF NOT EXISTS "manual_transfer_events" (
      "id" text PRIMARY KEY,
      "submission_id" text NOT NULL,
      "event_type" text NOT NULL,
      "actor_type" text NOT NULL,
      "actor_id" text NULL,
      "note" text NULL,
      "metadata" jsonb NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL
    );`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manual_transfer_event_submission" ON "manual_transfer_events" ("submission_id");`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manual_transfer_event_type" ON "manual_transfer_events" ("event_type");`)
  }

  async down(): Promise<void> {
    // Intentionally no-op: production rollback must never discard proof audit data.
  }
}
