"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"

/**
 * After a successful login/registration, sends the customer to the page they
 * were trying to reach. The intended destination is provided via a `redirect`
 * search param (a country-code-relative path such as `/checkout` or
 * `/account/orders`). The current country code is derived from the pathname so
 * the push stays within the active region. When no `redirect` param is present
 * the account layout simply re-renders into the dashboard, so nothing is done.
 */
export function usePostAuthRedirect(success: boolean) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!success) {
      return
    }

    const redirectParam = searchParams.get("redirect")
    if (!redirectParam || !redirectParam.startsWith("/")) {
      return
    }

    const countryCode = pathname?.split("/")[1] || ""
    const destination =
      redirectParam === "/checkout"
        ? "/checkout?step=address"
        : redirectParam
    const target = countryCode
      ? `/${countryCode}${destination}`
      : destination

    router.push(target)
    router.refresh()
  }, [success, pathname, searchParams, router])
}
