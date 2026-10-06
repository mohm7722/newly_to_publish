/**
 * Minimal admin API fetch helper for admin-extension pages
 * (Requirements 6.5, 6.6, 6.7).
 *
 * The admin dashboard is served from the same origin as the Medusa backend, so
 * relative `/admin/*` paths resolve to the backend API. Requests include
 * credentials so the framework's authenticated-admin session is forwarded
 * (Requirement 8.6).
 *
 * On a non-2xx response this throws an {@link AdminFetchError} carrying the
 * server-provided message; callers surface that message without mutating the
 * values they already display (Requirement 6.7).
 */

/** Error thrown for any non-2xx admin API response. */
export class AdminFetchError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "AdminFetchError"
    this.status = status
  }
}

/** Supported HTTP methods for the admin management pages. */
type AdminFetchMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

type AdminFetchOptions = {
  method?: AdminFetchMethod
  body?: unknown
}

/**
 * Extract the best available error message from a parsed error body, falling
 * back to a generic status-based message.
 */
function extractErrorMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    if (typeof record.message === "string" && record.message.length > 0) {
      return record.message
    }
    if (typeof record.error === "string" && record.error.length > 0) {
      return record.error
    }
  }
  return `Request failed with status ${status}`
}

/**
 * Perform an authenticated admin API request and return the parsed JSON body
 * (or `undefined` for `204 No Content`).
 *
 * @throws {AdminFetchError} when the response status is not in the 2xx range.
 */
export async function adminFetch<T = unknown>(
  path: string,
  options: AdminFetchOptions = {}
): Promise<T> {
  const { method = "GET", body } = options

  const response = await fetch(path, {
    method,
    credentials: "include",
    headers:
      body !== undefined
        ? { "Content-Type": "application/json" }
        : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // 204 No Content (e.g. bank-account DELETE) has no body to parse.
  if (response.status === 204) {
    return undefined as T
  }

  let payload: unknown = undefined
  const text = await response.text()
  if (text.length > 0) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    throw new AdminFetchError(
      extractErrorMessage(payload, response.status),
      response.status
    )
  }

  return payload as T
}
