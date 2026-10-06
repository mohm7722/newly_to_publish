import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import NewlyBrand from "@modules/layout/components/newly-brand"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full bg-[#f8f6f8]">
      <header className="sticky top-0 z-40 h-16 border-b border-[#67285A]/10 bg-white/95 backdrop-blur">
        <nav className="content-container flex h-full items-center justify-between px-4 sm:px-6">
          <LocalizedClientLink
            href="/cart"
            className="flex flex-1 basis-0 items-center gap-x-2 text-small-semi text-ui-fg-base"
            data-testid="back-to-cart-link"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="mt-px hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base small:block">
              العودة إلى سلة التسوق
            </span>
            <span className="mt-px block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base small:hidden">
              رجوع
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="inline-flex items-center justify-center transition hover:opacity-80"
            data-testid="store-link"
            aria-label="العودة إلى متجر نيولي"
          >
            <img
              src="/logo-newly.svg"
              alt="نيولي"
              className="h-[2.02rem] w-auto sm:h-[2.31rem]"
            />
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </header>
      <div className="relative" data-testid="checkout-container">{children}</div>
      <footer className="flex w-full items-center justify-center border-t border-[#67285A]/10 bg-white py-5">
        <NewlyBrand />
      </footer>
    </div>
  )
}
