/**
 * RBAC permission catalog (static, code-defined) — generated from a central
 * resource registry.
 *
 * Each *resource* corresponds to an admin API surface (a top-level
 * `/admin/<segment>` route group, or one of our custom modules). A resource
 * declares the set of *actions* it supports. The cartesian product of
 * `resource × action` yields the assignable permission keys (e.g.
 * `products:read`, `products:create`). This is the single source of truth used
 * by both the permission picker UI and the central route→permission mapper.
 *
 * Two action models are supported:
 *   - CRUD resources:   `read` / `create` / `update` / `delete`
 *   - simple resources: `read` / `write`  (config-style toggles)
 *
 * Adding a new module later means adding one entry to {@link RESOURCES}; its
 * permissions and route enforcement are then derived automatically.
 */

/** Action verbs. */
export type PermissionAction = "read" | "create" | "update" | "delete" | "write"

/** A resource entry in the central registry. */
export type ResourceDef = {
  /** Permission resource key, e.g. `products`. */
  resource: string
  /**
   * First `/admin/<segment>` path segment(s) this resource owns. Nested routes
   * (`/admin/products/:id/variants`) inherit the parent resource.
   */
  segments: string[]
  /** Supported actions (defines the action model). */
  actions: PermissionAction[]
  /** UI grouping key. */
  group: string
  /** Arabic label for the resource. */
  label: string
}

/** Arabic labels for permission groups (UI). */
export const PERMISSION_GROUPS: Record<string, string> = {
  catalog: "المنتجات والكتالوج",
  inventory: "المخزون والمستودعات",
  sales: "الطلبات والمبيعات",
  customers: "العملاء",
  marketing: "التسويق والعروض",
  pricing: "التسعير",
  fulfillment: "الشحن والتوصيل",
  settings: "الإعدادات",
  access: "إدارة الوصول",
  finance: "المالية والعملات",
  analytics: "التحليلات والإحصاءات",
}

const CRUD: PermissionAction[] = ["read", "create", "update", "delete"]
const RW: PermissionAction[] = ["read", "write"]
const RU: PermissionAction[] = ["read", "update"]
const RO: PermissionAction[] = ["read"]

/**
 * Central resource registry. Order here controls catalog/display order.
 */
export const RESOURCES: readonly ResourceDef[] = [
  // ── Catalog ───────────────────────────────────────────────────────────────
  { resource: "products", segments: ["products"], actions: CRUD, group: "catalog", label: "المنتجات" },
  { resource: "product_variants", segments: ["product-variants"], actions: RO, group: "catalog", label: "متغيرات المنتج" },
  { resource: "product_categories", segments: ["product-categories"], actions: CRUD, group: "catalog", label: "تصنيفات المنتجات" },
  { resource: "collections", segments: ["collections"], actions: CRUD, group: "catalog", label: "المجموعات" },
  { resource: "product_tags", segments: ["product-tags"], actions: CRUD, group: "catalog", label: "وسوم المنتجات" },
  { resource: "product_types", segments: ["product-types"], actions: CRUD, group: "catalog", label: "أنواع المنتجات" },

  // ── Inventory ───────────────────────────────────────────────────────────────
  { resource: "inventory", segments: ["inventory-items"], actions: CRUD, group: "inventory", label: "أصناف المخزون" },
  { resource: "reservations", segments: ["reservations"], actions: CRUD, group: "inventory", label: "الحجوزات" },
  { resource: "stock_locations", segments: ["stock-locations"], actions: CRUD, group: "inventory", label: "مواقع المخزون" },

  // ── Sales / orders ──────────────────────────────────────────────────────────
  { resource: "orders", segments: ["orders", "order-changes", "order-edits", "payment-collections"], actions: CRUD, group: "sales", label: "الطلبات" },
  { resource: "draft_orders", segments: ["draft-orders"], actions: CRUD, group: "sales", label: "الطلبات المسودة" },
  { resource: "returns", segments: ["returns"], actions: CRUD, group: "sales", label: "المرتجعات" },
  { resource: "exchanges", segments: ["exchanges"], actions: CRUD, group: "sales", label: "الاستبدالات" },
  { resource: "claims", segments: ["claims"], actions: CRUD, group: "sales", label: "المطالبات" },

  // ── Customers ───────────────────────────────────────────────────────────────
  { resource: "customers", segments: ["customers"], actions: CRUD, group: "customers", label: "العملاء" },
  { resource: "customer_groups", segments: ["customer-groups"], actions: CRUD, group: "customers", label: "مجموعات العملاء" },

  // ── Marketing ───────────────────────────────────────────────────────────────
  { resource: "promotions", segments: ["promotions"], actions: CRUD, group: "marketing", label: "العروض الترويجية" },
  { resource: "campaigns", segments: ["campaigns"], actions: CRUD, group: "marketing", label: "الحملات" },
  { resource: "abandoned_carts", segments: ["abandoned-carts"], actions: RU, group: "marketing", label: "السلال المهجورة" },
  { resource: "reviews", segments: ["reviews"], actions: ["read", "update", "delete"], group: "marketing", label: "آراء العملاء" },

  // ── Pricing ─────────────────────────────────────────────────────────────────
  { resource: "price_lists", segments: ["price-lists"], actions: CRUD, group: "pricing", label: "قوائم الأسعار" },
  { resource: "price_preferences", segments: ["price-preferences"], actions: RU, group: "pricing", label: "تفضيلات التسعير" },

  // ── Fulfillment / shipping ────────────────────────────────────────────────
  { resource: "fulfillments", segments: ["fulfillments"], actions: CRUD, group: "fulfillment", label: "عمليات التنفيذ" },
  { resource: "fulfillment_sets", segments: ["fulfillment-sets"], actions: CRUD, group: "fulfillment", label: "مجموعات التنفيذ" },
  { resource: "shipping_options", segments: ["shipping-options"], actions: CRUD, group: "fulfillment", label: "خيارات الشحن" },
  { resource: "shipping_profiles", segments: ["shipping-profiles"], actions: CRUD, group: "fulfillment", label: "ملفات الشحن" },
  { resource: "shipping_option_types", segments: ["shipping-option-types"], actions: CRUD, group: "fulfillment", label: "أنواع خيارات الشحن" },

  // ── Settings ────────────────────────────────────────────────────────────────
  { resource: "store", segments: ["stores"], actions: RU, group: "settings", label: "المتجر" },
  { resource: "regions", segments: ["regions"], actions: CRUD, group: "settings", label: "المناطق" },
  { resource: "currencies", segments: ["currencies"], actions: RO, group: "settings", label: "العملات" },
  { resource: "sales_channels", segments: ["sales-channels"], actions: CRUD, group: "settings", label: "قنوات البيع" },
  { resource: "api_keys", segments: ["api-keys"], actions: CRUD, group: "settings", label: "مفاتيح API" },
  { resource: "tax_rates", segments: ["tax-rates"], actions: CRUD, group: "settings", label: "معدلات الضريبة" },
  { resource: "tax_regions", segments: ["tax-regions"], actions: CRUD, group: "settings", label: "مناطق الضريبة" },
  { resource: "return_reasons", segments: ["return-reasons"], actions: CRUD, group: "settings", label: "أسباب الإرجاع" },
  { resource: "refund_reasons", segments: ["refund-reasons"], actions: CRUD, group: "settings", label: "أسباب الاسترداد" },
  { resource: "uploads", segments: ["uploads"], actions: ["read", "create", "delete"], group: "settings", label: "الملفات المرفوعة" },
  { resource: "tracking", segments: ["tracking-config"], actions: RW, group: "settings", label: "تتبّع الإعلانات (Meta/Google)" },

  // ── Access control ──────────────────────────────────────────────────────────
  { resource: "users", segments: ["users", "invites"], actions: CRUD, group: "access", label: "المستخدمون" },
  { resource: "roles", segments: [], actions: RW, group: "access", label: "الأدوار" },

  // ── Finance / custom modules ──────────────────────────────────────────────
  { resource: "fx", segments: ["fx"], actions: RW, group: "finance", label: "أسعار الصرف" },
  { resource: "currency_config", segments: ["currency-config"], actions: RW, group: "finance", label: "إعداد العملات" },
  { resource: "payments", segments: ["payments"], actions: CRUD, group: "finance", label: "المدفوعات والحسابات البنكية" },
  { resource: "payment_settings", segments: ["payment-settings"], actions: RW, group: "finance", label: "إعدادات الدفع" },
  { resource: "shipping_cities", segments: ["shipping-cities"], actions: RW, group: "fulfillment", label: "مدن الشحن" },
  { resource: "settlements", segments: ["settlements"], actions: RW, group: "finance", label: "التسويات" },

  // ── Analytics / statistics dashboard (read-only aggregation) ───────────────
  { resource: "analytics", segments: ["analytics"], actions: RO, group: "analytics", label: "لوحة التحليلات" },
]

/** Arabic labels per action, for the permission picker. */
const ACTION_LABELS: Record<PermissionAction, string> = {
  read: "عرض",
  create: "إنشاء",
  update: "تعديل",
  delete: "حذف",
  write: "تعديل",
}

/** A single assignable permission. */
export type PermissionDefinition = {
  key: string
  resource: string
  action: PermissionAction
  group: string
  label: string
}

/**
 * Extra standalone, feature-level permissions that are NOT derived from the
 * resource×action grid and are NOT enforced by the central route mapper. They
 * are checked explicitly inside specific feature route handlers (delegated
 * routes) via `requirePermission`. Use dotted keys to distinguish them from the
 * `resource:action` route-mapped keys.
 */
export const EXTRA_PERMISSIONS: readonly Omit<
  PermissionDefinition,
  "action"
>[] = [
  {
    key: "orders.invoice.print",
    resource: "orders",
    group: "sales",
    label: "طباعة فاتورة الطلب",
  },
  {
    key: "orders.processing.view",
    resource: "orders",
    group: "sales",
    label: "عرض كشف الطلبات قيد التجهيز",
  },
  {
    key: "invoice_settings.read",
    resource: "invoice_settings",
    group: "settings",
    label: "عرض إعدادات الفاتورة",
  },
  {
    key: "invoice_settings.write",
    resource: "invoice_settings",
    group: "settings",
    label: "تعديل إعدادات الفاتورة",
  },
  {
    key: "manual_transfers.read",
    resource: "manual_transfers",
    group: "finance",
    label: "عرض إشعارات التحويل البنكي",
  },
  {
    key: "manual_transfers.review",
    resource: "manual_transfers",
    group: "finance",
    label: "قبول ورفض التحويلات البنكية",
  },
]

/** The generated, flat permission catalog. */
export const PERMISSIONS: readonly PermissionDefinition[] = [
  ...RESOURCES.flatMap((r) =>
    r.actions.map((action) => ({
      key: `${r.resource}:${action}`,
      resource: r.resource,
      action,
      group: r.group,
      label: `${ACTION_LABELS[action]} ${r.label}`,
    }))
  ),
  ...EXTRA_PERMISSIONS.map((p) => ({ ...p, action: "read" as PermissionAction })),
]

/** Map of `/admin` path segment → resource definition (for the route mapper). */
export const SEGMENT_TO_RESOURCE: ReadonlyMap<string, ResourceDef> = new Map(
  RESOURCES.flatMap((r) => r.segments.map((s) => [s, r] as const))
)

/** Set of every valid permission key, for O(1) validation. */
export const PERMISSION_KEYS: ReadonlySet<string> = new Set(
  PERMISSIONS.map((p) => p.key)
)

/** All permission keys as an array. */
export const ALL_PERMISSION_KEYS: readonly string[] = PERMISSIONS.map(
  (p) => p.key
)

/** Every read-only permission key (resource grid only; excludes feature extras). */
export const READ_PERMISSION_KEYS: readonly string[] = RESOURCES.filter((r) =>
  r.actions.includes("read")
).map((r) => `${r.resource}:read`)

/** Whether a candidate string is a recognized, assignable permission key. */
export function isValidPermission(key: unknown): key is string {
  return typeof key === "string" && PERMISSION_KEYS.has(key)
}

/**
 * Filter an arbitrary list down to the valid, de-duplicated permission keys it
 * contains, preserving catalog order for stable storage/display.
 */
export function sanitizePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) {
    return []
  }
  const requested = new Set(input.filter(isValidPermission))
  return ALL_PERMISSION_KEYS.filter((key) => requested.has(key))
}

/**
 * Build the permission keys for the given resources, optionally limited to
 * specific actions. Used to compose default-role permission sets.
 */
export function permissionsFor(
  resources: string[],
  actions?: PermissionAction[]
): string[] {
  const resourceSet = new Set(resources)
  const actionSet = actions ? new Set(actions) : null
  return PERMISSIONS.filter(
    (p) =>
      resourceSet.has(p.resource) && (!actionSet || actionSet.has(p.action))
  ).map((p) => p.key)
}

/**
 * Baseline read permissions auto-granted to any user that holds at least one
 * role (and is not super). These cover the data the admin dashboard shell needs
 * to render on essentially every page (store config, currencies, regions, sales
 * channels, notifications). Users with **no** role receive none of these and
 * therefore cannot load any dashboard data.
 */
export const BASELINE_PERMISSIONS: readonly string[] = [
  "store:read",
  "currencies:read",
  "regions:read",
  "sales_channels:read",
  "notifications:read",
]
