import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound, redirect } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"

export const metadata: Metadata = {
  title: "الحساب",
  description: "نظرة عامة على نشاط حسابك.",
}

// Only allow redirects to internal, country-code-relative paths. This blocks
// open-redirect vectors such as protocol-relative (`//host`), backslash
// (`/\host`) and absolute (`http://`, `https://`) URLs. The `/account` root is
// rejected as well to avoid redirecting back onto this same page (loop).
function getSafeRedirect(value: string | undefined): string | null {
  if (!value || !value.startsWith("/")) {
    return null
  }

  // Reject protocol-relative and backslash-escaped hosts.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return null
  }

  // Reject a bare `/account` target which would re-render this same slot.
  if (value === "/account") {
    return null
  }

  return value
}

type OverviewPageProps = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ redirect?: string }>
}

export default async function OverviewTemplate({
  params,
  searchParams,
}: OverviewPageProps) {
  const customer = await retrieveCustomer().catch(() => null)

  if (!customer) {
    notFound()
  }

  // The customer landed here right after logging in from a guarded page
  // (e.g. `/ye/account?redirect=/checkout`). Send them to their intended
  // destination server-side, keeping the active country code.
  const { countryCode } = await params
  const { redirect: redirectParam } = await searchParams
  const safeRedirect = getSafeRedirect(redirectParam)

  if (safeRedirect) {
    redirect(`/${countryCode}${safeRedirect}`)
  }

  const orders = (await listOrders().catch(() => null)) || null

  return <Overview customer={customer} orders={orders} />
}
