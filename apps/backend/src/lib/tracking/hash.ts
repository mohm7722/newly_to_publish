import { createHash } from "crypto"

/**
 * PII normalization + SHA-256 hashing for server-side ad tracking.
 *
 * Both Meta's Conversions API and Google's user-provided data (Enhanced
 * Conversions / GA4 Measurement Protocol) require customer identifiers to be
 * normalized (trimmed, lowercased, digits-only for phones) and hashed with
 * SHA-256 before transmission. Hashing happens here so raw PII never leaves the
 * server in clear text.
 */

/** Lowercase hex SHA-256 of `value`. */
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex")
}

/** Normalize an email: trim + lowercase. Returns undefined when blank. */
export function normalizeEmail(email?: string | null): string | undefined {
  if (!email) return undefined
  const n = email.trim().toLowerCase()
  return n.length > 0 ? n : undefined
}

/** Normalize a phone to digits only (E.164 without the leading `+`). */
export function normalizePhone(phone?: string | null): string | undefined {
  if (!phone) return undefined
  const digits = phone.replace(/[^0-9]/g, "")
  return digits.length > 0 ? digits : undefined
}

/** Normalize a free-text field (name/city): trim + lowercase. */
export function normalizeText(value?: string | null): string | undefined {
  if (!value) return undefined
  const n = value.trim().toLowerCase()
  return n.length > 0 ? n : undefined
}

/** SHA-256 of a normalized email, or undefined. */
export function hashEmail(email?: string | null): string | undefined {
  const n = normalizeEmail(email)
  return n ? sha256(n) : undefined
}

/** SHA-256 of a normalized phone, or undefined. */
export function hashPhone(phone?: string | null): string | undefined {
  const n = normalizePhone(phone)
  return n ? sha256(n) : undefined
}

/** SHA-256 of a normalized text field (name/city), or undefined. */
export function hashText(value?: string | null): string | undefined {
  const n = normalizeText(value)
  return n ? sha256(n) : undefined
}
