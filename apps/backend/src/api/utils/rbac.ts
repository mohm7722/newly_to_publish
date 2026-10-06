import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/**
 * Permission helpers for admin routes.
 *
 * Authorization model (post-migration):
 *  - Every `/admin/*` route is protected by the framework's authenticated-admin
 *    middleware, so any request reaching a handler belongs to an authenticated
 *    admin user (baseline).
 *  - The RBAC middleware (`src/api/middlewares.ts`) resolves that user's
 *    effective permission context from the database (roles → permission keys),
 *    blocks disabled users, and attaches the context to the request.
 *  - Individual route handlers call {@link requirePermission} / {@link hasPermission}
 *    with the specific permission key they enforce.
 *
 * The legacy, spoofable `x-roles` / `x-role` header has been removed entirely;
 * roles now come exclusively from the authenticated identity (JWT/session) and
 * the database.
 */

/** Effective permission context attached to the request by the RBAC middleware. */
export type RequestPermissionContext = {
  /** Framework user id of the acting admin. */
  userId: string
  /** Best-effort identity (email) for audit attribution. */
  email: string | null
  /** Role slugs assigned to the user. */
  roles: string[]
  /** Union of permission keys across the user's roles. */
  permissions: string[]
  /** Whether the user holds a super role (bypasses per-permission checks). */
  isSuper: boolean
  /** Whether the user account is disabled (blocked before reaching handlers). */
  isDisabled: boolean
}

/** Read the permission context the middleware attached to the request. */
export function getPermissionContext(
  req: MedusaRequest
): RequestPermissionContext | undefined {
  return (req as unknown as { permission_context?: RequestPermissionContext })
    .permission_context
}

/**
 * Whether the acting admin holds the given permission key.
 *
 * Returns true when the user is super, or when the resolved permission set
 * contains `key`. Returns false when no context is present (defensive: the
 * middleware should always attach one for authenticated admin requests).
 */
export function hasPermission(req: MedusaRequest, key: string): boolean {
  const ctx = getPermissionContext(req)
  if (!ctx || ctx.isDisabled) {
    return false
  }
  return ctx.isSuper || ctx.permissions.includes(key)
}

/**
 * Enforce a permission on a route. When the caller lacks `key`, writes a `403`
 * response and returns `false`; otherwise returns `true`.
 *
 * Usage:
 * ```ts
 * if (!requirePermission(req, res, "fx.rates:write")) return
 * ```
 */
export function requirePermission(
  req: MedusaRequest,
  res: MedusaResponse,
  key: string
): boolean {
  if (hasPermission(req, key)) {
    return true
  }
  res.status(403).json({ message: "forbidden", required_permission: key })
  return false
}

/**
 * Resolve a best-effort identity string for the acting admin, used to attribute
 * audit-log entries. Prefers the resolved email, then the user id, then the
 * `x-admin-id` header, finally `"unknown"`.
 */
export function getAdminIdentity(req: MedusaRequest): string {
  const ctx = getPermissionContext(req)
  return (
    ctx?.email ||
    ctx?.userId ||
    (req.headers["x-admin-id"] as string) ||
    "unknown"
  )
}
