import {
  SEGMENT_TO_RESOURCE,
  PERMISSION_KEYS,
  type PermissionAction,
  type ResourceDef,
} from "../../modules/rbac/permissions"

/**
 * Central Route → Permission mapping (single source of truth).
 *
 * Given an HTTP method and an `/admin/*` path, resolves what the RBAC
 * middleware must do.
 *
 * Policy:
 *  - **Mapped resources** (every real business/data resource — see the resource
 *    registry) are strictly enforced: the caller must hold the matching
 *    `resource:action` permission, else 403 (deny-by-default per resource).
 *  - **Unmapped segments** are infrastructure/metadata endpoints (providers,
 *    plugins, workflows, locales, …) or future modules: reads (GET/HEAD) are
 *    allowed so the dashboard stays functional, but writes are denied
 *    (deny-by-default) — a new module cannot be mutated until mapped here.
 *  - A small allow-list covers self-service and shell-bootstrap endpoints.
 *
 * Resolution outcomes:
 *  - `allow`    → always permitted for an authenticated admin (shell-critical /
 *                 self-service endpoints; see {@link ALWAYS_ALLOW}).
 *  - `delegate` → permission is enforced inside the route handler itself
 *                 (our `/admin/rbac/*` routes).
 *  - `require`  → caller must hold `permission`.
 *  - `deny`     → no mapping; reject (deny-by-default).
 */

export type PermissionDecision =
  | { type: "allow"; reason: string }
  | { type: "delegate"; reason: string }
  | { type: "require"; permission: string }
  | { type: "deny"; reason: string }

/**
 * `/admin` segments whose **read** (GET) endpoints are always allowed because
 * the dashboard shell fetches them on boot to render (store/currency formatting,
 * region context, the notifications bell). These are infrastructure/config, not
 * business data; their write operations remain permission-gated normally. This
 * lets the shell load for any authenticated admin so a no-role user can be
 * cleanly redirected to the no-access page instead of seeing a raw 403 error.
 */
const SHELL_BOOTSTRAP_SEGMENTS = [
  "stores",
  "regions",
  "currencies",
  "sales-channels",
]

/**
 * Always-allowed routes (method + path prefix), with the reason each is exempt.
 * These are the minimum endpoints the Medusa dashboard shell needs for ANY
 * authenticated admin, plus per-user self-service state. They never expose
 * business data of other entities.
 */
const ALWAYS_ALLOW: { test: (method: string, path: string) => boolean; reason: string }[] = [
  {
    // The acting admin's own identity/profile. Required for the shell to boot
    // and for users to manage their own account regardless of role.
    test: (_m, p) => p === "/admin/users/me" || p.startsWith("/admin/users/me/"),
    reason: "self identity/profile (shell bootstrap)",
  },
  {
    // The UI reads its own effective permissions to drive nav hiding and the
    // no-access redirect. Must be readable even by users with no roles.
    test: (_m, p) => p === "/admin/access/me",
    reason: "self permission context (UI gating)",
  },
  {
    // Per-user saved table views / column layout — personal UI state, not
    // business data.
    test: (_m, p) => p === "/admin/views" || p.startsWith("/admin/views/"),
    reason: "per-user UI view state",
  },
  {
    // Read-only shell bootstrap config (store/region/currency/sales-channel/
    // notification). Lets the dashboard shell render for any authenticated admin.
    test: (m, p) =>
      m === "GET" &&
      SHELL_BOOTSTRAP_SEGMENTS.some(
        (seg) => p === `/admin/${seg}` || p.startsWith(`/admin/${seg}/`)
      ),
    reason: "dashboard shell bootstrap (read-only config)",
  },
  {
    // API root / health.
    test: (_m, p) => p === "/admin" || p === "/admin/" || p === "/admin/index",
    reason: "admin API root",
  },
]

/**
 * Route groups whose authorization is enforced inside the handler (not by the
 * central mapper). Our own `/admin/access/*` routes call `requirePermission`
 * with the appropriate `roles:*` / `users:*` keys. (Named `/admin/access` to
 * avoid colliding with Medusa 2.16's built-in `/admin/rbac` API.)
 */
const DELEGATED_PREFIXES: { prefix: string; reason: string }[] = [
  {
    prefix: "/admin/access",
    reason: "access-management routes self-enforce roles:*/users:* in their handlers",
  },
  {
    prefix: "/admin/invoices",
    reason: "invoice routes self-enforce orders.invoice.print in their handler",
  },
  {
    prefix: "/admin/invoice-settings",
    reason: "invoice-settings routes self-enforce invoice_settings.read/write",
  },
  {
    prefix: "/admin/reports",
    reason: "report routes self-enforce their feature permission in the handler",
  },
]

/** Strip query/fragment and collapse to a clean `/admin/...` pathname. */
function cleanPath(rawPath: string): string {
  const q = rawPath.indexOf("?")
  const noQuery = q >= 0 ? rawPath.slice(0, q) : rawPath
  const h = noQuery.indexOf("#")
  return h >= 0 ? noQuery.slice(0, h) : noQuery
}

/**
 * Choose the action verb for a request against a resource, honoring the
 * resource's action model:
 *  - simple resources (`read`/`write`): GET → read, anything else → write.
 *  - CRUD resources: GET → read, DELETE → delete, PUT/PATCH → update,
 *    POST → create on the collection root, update on an item/sub-route.
 */
function actionForMethod(
  method: string,
  hasSubPath: boolean,
  resource: ResourceDef
): PermissionAction | null {
  const supports = (a: PermissionAction) => resource.actions.includes(a)
  const isSimple = supports("write")

  if (method === "GET" || method === "HEAD") {
    return supports("read") ? "read" : null
  }

  if (isSimple) {
    return supports("write") ? "write" : null
  }

  switch (method) {
    case "DELETE":
      return supports("delete") ? "delete" : supports("update") ? "update" : null
    case "PUT":
    case "PATCH":
      return supports("update") ? "update" : null
    case "POST":
      if (hasSubPath) {
        return supports("update") ? "update" : null
      }
      return supports("create") ? "create" : null
    default:
      return null
  }
}

/**
 * Resolve the authorization decision for a given admin request.
 */
export function resolveRoutePermission(
  method: string,
  rawPath: string
): PermissionDecision {
  const m = method.toUpperCase()
  const path = cleanPath(rawPath)

  // CORS preflight is always allowed.
  if (m === "OPTIONS") {
    return { type: "allow", reason: "CORS preflight" }
  }

  for (const entry of ALWAYS_ALLOW) {
    if (entry.test(m, path)) {
      return { type: "allow", reason: entry.reason }
    }
  }

  // Manual-transfer order sub-routes enforce feature-level finance permissions
  // in their handlers rather than inheriting the generic orders:update mapping.
  if (/^\/admin\/orders\/[^/]+\/manual-transfer(?:\/|$)/.test(path)) {
    return {
      type: "delegate",
      reason: "manual-transfer routes self-enforce manual_transfers.read/review",
    }
  }

  for (const d of DELEGATED_PREFIXES) {
    if (path === d.prefix || path.startsWith(d.prefix + "/")) {
      return { type: "delegate", reason: d.reason }
    }
  }

  // Parse `/admin/<segment>/<rest...>`.
  const parts = path.split("/").filter(Boolean) // ["admin", "<segment>", ...]
  if (parts.length < 2 || parts[0] !== "admin") {
    return { type: "deny", reason: "unrecognized admin path" }
  }

  const segment = parts[1]
  const hasSubPath = parts.length > 2

  const resource = SEGMENT_TO_RESOURCE.get(segment)
  if (!resource) {
    // Unmapped segment. All real business/data resources are mapped, so an
    // unmapped segment is an infrastructure/metadata endpoint (providers,
    // plugins, workflows, locales, …) or a future module. Reads are allowed so
    // the dashboard stays functional; writes are denied (deny-by-default), so a
    // new module cannot be mutated until its permissions are defined here.
    if (m === "GET" || m === "HEAD") {
      return { type: "allow", reason: `unmapped infrastructure read ("${segment}")` }
    }
    return {
      type: "deny",
      reason: `unmapped write segment "${segment}" (deny-by-default)`,
    }
  }

  const action = actionForMethod(m, hasSubPath, resource)
  if (!action) {
    return {
      type: "deny",
      reason: `method ${m} not permitted on resource "${resource.resource}"`,
    }
  }

  const key = `${resource.resource}:${action}`
  if (!PERMISSION_KEYS.has(key)) {
    return { type: "deny", reason: `unknown permission "${key}"` }
  }

  return { type: "require", permission: key }
}
