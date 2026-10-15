/**
 * Full-name helpers.
 *
 * Checkout and the account address book collect a single "الاسم الكامل" field
 * instead of separate first/last name inputs, because asking an Arabic-speaking
 * shopper to decompose their name is pure friction. Medusa's address model
 * still stores `first_name` / `last_name`, so the single value is split on
 * write and re-joined on read.
 *
 * Splitting rule: the first whitespace-separated token becomes `first_name`,
 * everything after it becomes `last_name`. A single-word name therefore yields
 * an empty `last_name` — which is valid, since nothing in checkout requires a
 * last name.
 */

export type NameParts = {
  first_name: string
  last_name: string
}

/** Split a full name into the `first_name` / `last_name` pair Medusa stores. */
export function splitFullName(fullName: string | null | undefined): NameParts {
  const tokens = String(fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (tokens.length === 0) {
    return { first_name: "", last_name: "" }
  }

  return {
    first_name: tokens[0],
    last_name: tokens.slice(1).join(" "),
  }
}

/** Re-join a stored `first_name` / `last_name` pair into one display name. */
export function joinFullName(
  firstName?: string | null,
  lastName?: string | null
): string {
  return [firstName, lastName]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ")
}
