import { useEffect } from "react"
import { useMyPermissions, makeChecker } from "../lib/use-my-permissions"

/**
 * Best-effort client-side access guard (cosmetic layer).
 *
 * The authoritative authorization is server-side (every `/admin/*` call is
 * checked by the RBAC middleware and returns 403 when unauthorized). This
 * component only improves UX:
 *   1. Users with no roles are redirected to the `/no-access` page.
 *   2. Top-level sidebar links for resources the user cannot read are hidden.
 *
 * Medusa's admin SDK exposes no global injection zone, so this component is
 * mounted via thin widgets on the common list pages. Because the sidebar
 * persists across client-side navigation, hiding applied on any visited page
 * remains in effect for the session. This is intentionally non-destructive: it
 * only sets `display:none` on matching links and never alters server behavior.
 */

/** Map of sidebar link href prefix → the read permission that reveals it. */
const NAV_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: "/app/products", permission: "products:read" },
  { prefix: "/app/categories", permission: "product_categories:read" },
  { prefix: "/app/collections", permission: "collections:read" },
  { prefix: "/app/inventory", permission: "inventory:read" },
  { prefix: "/app/reservations", permission: "reservations:read" },
  { prefix: "/app/orders", permission: "orders:read" },
  { prefix: "/app/draft-orders", permission: "draft_orders:read" },
  { prefix: "/app/customers", permission: "customers:read" },
  { prefix: "/app/customer-groups", permission: "customer_groups:read" },
  { prefix: "/app/promotions", permission: "promotions:read" },
  { prefix: "/app/campaigns", permission: "campaigns:read" },
  { prefix: "/app/price-lists", permission: "price_lists:read" },
]

const AccessGuard = () => {
  const { data, isSuccess } = useMyPermissions()

  useEffect(() => {
    if (!isSuccess || !data) {
      return
    }

    // 1. No roles → no access at all. Redirect to the dedicated page.
    //    `window.location` is used (not react-router's useNavigate) because
    //    admin widgets are bundled with an isolated react-router instance whose
    //    Router context differs from the host dashboard's.
    if (!data.is_super && data.permissions.length === 0) {
      if (!window.location.pathname.endsWith("/no-access")) {
        window.location.assign("/app/no-access")
      }
      return
    }

    // 2. Hide sidebar links the user cannot read.
    const can = makeChecker(data)
    const anchors = document.querySelectorAll<HTMLAnchorElement>(
      'a[href^="/app/"]'
    )
    anchors.forEach((a) => {
      const href = a.getAttribute("href") ?? ""
      for (const item of NAV_PERMISSIONS) {
        if (href === item.prefix || href.startsWith(item.prefix + "/")) {
          if (!can(item.permission)) {
            const li = a.closest("li")
            ;(li ?? a).style.display = "none"
          }
        }
      }
    })
  }, [isSuccess, data])

  return null
}

export default AccessGuard
