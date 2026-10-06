import { Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework"

/**
 * Business profile / document settings — isolated storage service.
 *
 * Single source of truth for the business identity shown on printed documents
 * (invoices, statements, receipts, …). Encapsulates *where/how* the data is
 * persisted: today in `store.metadata.invoice_settings`; moving it to a
 * dedicated table later only changes this class.
 *
 * Store-name policy: the store name is NOT duplicated. The effective
 * `store_name` defaults to Medusa's core store name; an optional
 * `store_name_override` lets documents show a different trade name. When the
 * override is blank, the core store name is used.
 */
export type InvoiceSettings = {
  /** Effective name used on documents (override || core store name). */
  store_name: string
  /** Optional document-only override (blank = use core store name). */
  store_name_override: string
  /** The core Medusa store name (read-only; shown as the placeholder). */
  default_store_name: string
  /** Public logo URL (uploaded via the admin file upload). */
  logo_url: string | null
  address: string
  phone: string
  email: string
  website: string
  tax_number: string
  /** Footer note: terms or thank-you message. */
  footer_note: string
}

/** Final fallback name when the core store has no name configured. */
const FALLBACK_STORE_NAME = "متجر نيولي"

/** Defaults for the persisted (metadata) fields. */
const FIELD_DEFAULTS = {
  store_name_override: "",
  logo_url: null as string | null,
  address: "",
  phone: "",
  email: "",
  website: "",
  tax_number: "",
  footer_note: "شكراً لتعاملكم معنا.",
}

const METADATA_KEY = "invoice_settings"

/** Editable string fields persisted in metadata. */
const STRING_FIELDS: (keyof typeof FIELD_DEFAULTS)[] = [
  "store_name_override",
  "address",
  "phone",
  "email",
  "website",
  "tax_number",
  "footer_note",
]

/** What the persisted metadata blob looks like (subset of InvoiceSettings). */
type PersistedSettings = typeof FIELD_DEFAULTS

/**
 * Isolated accessor for business-profile / document settings.
 */
export class InvoiceSettingsService {
  constructor(private readonly container: MedusaContainer) {}

  private get storeService() {
    return this.container.resolve(Modules.STORE)
  }

  private async resolveStore() {
    const [store] = await this.storeService.listStores({}, { take: 1 })
    return store ?? null
  }

  /** Compose the effective settings (core store name + persisted fields). */
  async get(): Promise<InvoiceSettings> {
    const store = await this.resolveStore()
    const coreName = (store?.name as string) || FALLBACK_STORE_NAME
    const raw = (store?.metadata?.[METADATA_KEY] ?? {}) as Partial<PersistedSettings>

    const persisted: PersistedSettings = { ...FIELD_DEFAULTS, ...raw }
    const override = (persisted.store_name_override ?? "").trim()

    return {
      ...persisted,
      default_store_name: coreName,
      store_name: override.length > 0 ? override : coreName,
    }
  }

  /**
   * Merge and persist a partial update of the document fields, returning the
   * full effective settings. The effective `store_name` / `default_store_name`
   * are computed, not stored; only `store_name_override` is persisted.
   */
  async save(update: Partial<PersistedSettings>): Promise<InvoiceSettings> {
    const store = await this.resolveStore()
    if (!store) {
      throw new Error("No store found to attach business settings to")
    }

    const raw = (store.metadata?.[METADATA_KEY] ?? {}) as Partial<PersistedSettings>
    const merged: PersistedSettings = { ...FIELD_DEFAULTS, ...raw }

    for (const field of STRING_FIELDS) {
      const value = update[field]
      if (typeof value === "string") {
        merged[field] = value
      }
    }
    if (update.logo_url !== undefined) {
      merged.logo_url =
        typeof update.logo_url === "string" && update.logo_url.length > 0
          ? update.logo_url
          : null
    }

    await this.storeService.updateStores(store.id, {
      metadata: { ...(store.metadata ?? {}), [METADATA_KEY]: merged },
    })

    return this.get()
  }
}

export default InvoiceSettingsService
