/**
 * Default ERP roles seeded/reconciled on startup.
 *
 * These mirror a real company's departmental structure. They are marked
 * `is_system: true` (cannot be deleted from the UI) and their permission sets
 * are treated as managed defaults: the sync migration script reconciles them to
 * the definitions below, so they automatically gain access to new resources as
 * the catalog grows. Custom roles created from the UI are never reconciled.
 *
 * The super-admin role carries `is_super: true`: it bypasses per-permission
 * checks entirely and is fully locked (no edit/delete).
 */
import {
  ALL_PERMISSION_KEYS,
  READ_PERMISSION_KEYS,
  permissionsFor,
} from "./permissions"

/** Shape of a seeded default role. */
export type DefaultRole = {
  slug: string
  name: string
  description: string
  is_super: boolean
  is_system: boolean
  permissions: readonly string[]
}

/** De-duplicate a composed permission list, preserving order. */
function compose(...lists: string[][]): string[] {
  return [...new Set(lists.flat())]
}

export const DEFAULT_ROLES: readonly DefaultRole[] = [
  {
    slug: "super_admin",
    name: "مدير النظام",
    description:
      "صلاحية كاملة على كل أجزاء النظام وإدارة الوصول. غير قابل للتعديل أو الحذف.",
    is_super: true,
    is_system: true,
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    slug: "general_manager",
    name: "المدير العام",
    description: "إشراف كامل على جميع العمليات والمالية والمبيعات وإدارة المستخدمين.",
    is_super: false,
    is_system: true,
    permissions: ALL_PERMISSION_KEYS,
  },
  {
    slug: "finance_manager",
    name: "مدير الإدارة المالية",
    description: "إدارة أسعار الصرف والعملات والمدفوعات والتسويات.",
    is_super: false,
    is_system: true,
    permissions: compose(
      permissionsFor(["fx", "currency_config", "payment_settings", "settlements"]),
      permissionsFor(["payments"]),
      permissionsFor(["analytics"]),
      permissionsFor(["orders", "customers"], ["read"]),
      ["manual_transfers.read", "manual_transfers.review"]
    ),
  },
  {
    slug: "accountant",
    name: "محاسب",
    description: "قراءة البيانات المالية وإدارة التسويات.",
    is_super: false,
    is_system: true,
    permissions: compose(
      permissionsFor(
        ["fx", "currency_config", "payment_settings", "payments"],
        ["read"]
      ),
      permissionsFor(["settlements"]),
      permissionsFor(["analytics"]),
      permissionsFor(["orders"], ["read"]),
      ["manual_transfers.read"]
    ),
  },
  {
    slug: "sales_manager",
    name: "مدير المبيعات",
    description: "إدارة الطلبات والطلبات المسودة والمرتجعات ومتابعة العملاء.",
    is_super: false,
    is_system: true,
    permissions: compose(
      permissionsFor(["orders", "draft_orders", "returns", "exchanges", "claims"]),
      permissionsFor(["customers"], ["read", "update"]),
      permissionsFor(["analytics"]),
      permissionsFor(
        ["products", "promotions", "price_lists", "shipping_cities", "shipping_options"],
        ["read"]
      ),
      ["manual_transfers.read"]
    ),
  },
  {
    slug: "sales_representative",
    name: "مندوب مبيعات",
    description: "إنشاء ومتابعة الطلبات المسودة وقراءة الطلبات والعملاء.",
    is_super: false,
    is_system: true,
    permissions: compose(
      permissionsFor(["orders"], ["read"]),
      permissionsFor(["draft_orders"], ["read", "create", "update"]),
      permissionsFor(["customers", "products"], ["read"])
    ),
  },
  {
    slug: "operations_manager",
    name: "مدير العمليات",
    description: "إدارة المخزون والمستودعات والشحن والتنفيذ.",
    is_super: false,
    is_system: true,
    permissions: compose(
      permissionsFor([
        "inventory",
        "reservations",
        "stock_locations",
        "fulfillments",
        "fulfillment_sets",
        "shipping_options",
        "shipping_profiles",
      ]),
      permissionsFor(["shipping_cities"]),
      permissionsFor(["analytics"]),
      permissionsFor(["products", "orders", "draft_orders"], ["read"])
    ),
  },
  {
    slug: "customer_support",
    name: "خدمة العملاء",
    description: "متابعة الطلبات والمرتجعات ومساعدة العملاء.",
    is_super: false,
    is_system: true,
    permissions: compose(
      permissionsFor(["orders", "draft_orders", "exchanges", "claims"], ["read"]),
      permissionsFor(["returns"], ["read", "create"]),
      permissionsFor(["customers"], ["read", "update"]),
      permissionsFor(["products"], ["read"])
    ),
  },
  {
    slug: "auditor",
    name: "مدقق",
    description: "وصول للقراءة فقط على كل أجزاء النظام لأغراض المراجعة.",
    is_super: false,
    is_system: true,
    permissions: compose([...READ_PERMISSION_KEYS], ["manual_transfers.read"]),
  },
]
