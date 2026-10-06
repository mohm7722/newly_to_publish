import { useQuery } from "@tanstack/react-query"
import { adminFetch } from "./admin-fetch"

/** Effective permission context for the logged-in admin (from `/admin/rbac/me`). */
export type MyPermissions = {
  user_id: string | null
  email: string | null
  roles: string[]
  permissions: string[]
  is_super: boolean
}

/**
 * Fetch and cache the current admin's effective permissions. Used by the access
 * guard to hide navigation the user cannot access and to redirect users with no
 * roles. Cached for a minute to avoid refetching on every page mount.
 */
export function useMyPermissions() {
  return useQuery({
    queryKey: ["admin", "rbac", "me"],
    queryFn: () => adminFetch<MyPermissions>("/admin/access/me"),
    staleTime: 60_000,
    retry: false,
  })
}

/** Build a permission checker from a fetched context. */
export function makeChecker(data?: MyPermissions) {
  const perms = new Set(data?.permissions ?? [])
  const isSuper = data?.is_super ?? false
  return (key: string) => isSuper || perms.has(key)
}
