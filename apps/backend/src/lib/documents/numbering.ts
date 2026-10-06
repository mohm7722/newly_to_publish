import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"

/**
 * Generic, atomic document numbering.
 *
 * Each document *type* gets its own Postgres sequence, so numbers are unique,
 * gap-tolerant, and concurrency-safe (atomic `nextval`). This is independent of
 * the order numbering, so invoices/returns/receipts each carry their own
 * accounting number series and the system extends to new document types by
 * adding an entry to {@link DOCUMENT_PREFIXES}.
 *
 * Number format: `<PREFIX>-<YEAR>-<NNNNNN>` (e.g. `INV-2026-000042`).
 */

/** Known document types and their human-facing number prefixes. */
export const DOCUMENT_PREFIXES: Record<string, string> = {
  order_invoice: "INV",
  return_invoice: "RET",
  receipt_in: "RCV", // سند قبض
  receipt_out: "PAY", // سند صرف
}

/** Sanitize a document type into a safe SQL sequence identifier. */
function sequenceName(type: string): string {
  const safe = type.replace(/[^a-z0-9_]/gi, "_").toLowerCase()
  return `doc_seq_${safe}`
}

/**
 * Allocate the next number for a document type, formatted with its prefix and
 * the current year. Creates the sequence on first use (idempotent), so new
 * document types work without a dedicated migration.
 *
 * @param container Request or application container (provides PG connection).
 * @param type Document type key (see {@link DOCUMENT_PREFIXES}).
 */
export async function nextDocumentNumber(
  container: MedusaContainer,
  type: string
): Promise<string> {
  const knex = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as {
    raw: (sql: string, bindings?: unknown[]) => Promise<{ rows: { n: string }[] }>
  }

  const seq = sequenceName(type)
  // Idempotent: safe to run every call; no-op once the sequence exists.
  await knex.raw(`CREATE SEQUENCE IF NOT EXISTS "${seq}"`)
  const res = await knex.raw(`SELECT nextval('"${seq}"') AS n`)
  const n = Number(res.rows?.[0]?.n ?? 0)

  const prefix = DOCUMENT_PREFIXES[type] ?? "DOC"
  const year = new Date().getFullYear()
  return `${prefix}-${year}-${String(n).padStart(6, "0")}`
}
