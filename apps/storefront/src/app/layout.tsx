import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
// Self-hosted Tajawal font (no network/Google fetch). Weights actually used: 400/500/700.
import "@fontsource/tajawal/400.css"
import "@fontsource/tajawal/500.css"
import "@fontsource/tajawal/700.css"
import "styles/globals.css"

import { FxProvider } from "@lib/fx/context"
import { getFxSnapshot } from "@lib/fx/server"
import { GtmScripts, GtmNoScript } from "@modules/analytics/gtm-scripts"
import { getStorefrontGtmId } from "@lib/analytics/server"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  applicationName: "نيولي",
  title: {
    default: "نيولي | تسوق بسهولة",
    template: "%s | نيولي",
  },
  description: "متجر نيولي للتسوق الإلكتروني والمنتجات المميزة.",
  creator: "نيولي",
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  // Seed the client FX context server-side so display prices convert to the
  // customer's selected currency (default YER_NEW) everywhere via `useFx`.
  const fxSnapshot = await getFxSnapshot()
  const gtmId = await getStorefrontGtmId()

  return (
    <html lang="ar" dir="rtl" data-mode="light">
      <head>
        <GtmScripts gtmId={gtmId} />
      </head>
      <body className="font-arabic antialiased">
        <GtmNoScript gtmId={gtmId} />
        <FxProvider snapshot={fxSnapshot}>
          <main className="relative">{props.children}</main>
        </FxProvider>
      </body>
    </html>
  )
}
