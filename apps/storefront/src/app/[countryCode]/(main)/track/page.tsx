import { retrieveCustomer } from "@lib/data/customer"
import { redirect } from "next/navigation"

type TrackPageProps = {
  params: Promise<{ countryCode: string }>
}

// Order tracking is handled entirely through the authenticated account area.
// Logged-in customers go straight to their orders list; guests are sent to
// login with a redirect back to the orders page after authentication.
export default async function TrackPage({ params }: TrackPageProps) {
  const { countryCode } = await params
  const customer = await retrieveCustomer().catch(() => null)

  if (customer) {
    redirect(`/${countryCode}/account/orders`)
  }

  redirect(`/${countryCode}/account?redirect=/account/orders`)
}
