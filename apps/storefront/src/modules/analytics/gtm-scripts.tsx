import Script from "next/script"

/**
 * Google Tag Manager bootstrap.
 *
 * Injects the GTM container loader as an `afterInteractive` Next.js script and
 * initializes `window.dataLayer` before it loads, so any ecommerce events
 * pushed during hydration are buffered and picked up by the container. The
 * container id is resolved at runtime from the database (admin-managed) and
 * passed in as `gtmId`; when empty, nothing is rendered so the storefront stays
 * free of tracking scripts.
 */
export function GtmScripts({ gtmId }: { gtmId?: string }) {
  if (!gtmId) {
    return null
  }

  return (
    <Script id="gtm-loader" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
    </Script>
  )
}

/**
 * The GTM `<noscript>` fallback iframe. Should be rendered as close to the start
 * of `<body>` as possible so tracking still works without JavaScript.
 */
export function GtmNoScript({ gtmId }: { gtmId?: string }) {
  if (!gtmId) {
    return null
  }

  return (
    <noscript>
      <iframe
        title="gtm"
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  )
}
