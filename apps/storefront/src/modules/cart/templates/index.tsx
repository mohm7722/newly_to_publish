import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import EmailCapture from "../components/email-capture"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CartTemplate = ({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) => {
  return (
    <main className="min-h-screen bg-[#f8f6f8] py-6 sm:py-10" dir="rtl">
      <div className="content-container px-4 sm:px-6">
        <nav className="mb-6 flex items-center gap-2 text-sm text-gray-500" aria-label="مسار التنقل">
          <LocalizedClientLink href="/" className="transition hover:text-[#67285A]">الرئيسية</LocalizedClientLink>
          <span>/</span>
          <span className="font-semibold text-[#67285A]">السلة</span>
        </nav>

        {cart?.items?.length ? (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start xl:gap-8">
            <section className="min-w-0 overflow-hidden rounded-3xl border border-[#67285A]/10 bg-white p-4 shadow-sm sm:p-6 lg:p-7">
              <div className="mb-6">
                <p className="text-xs font-bold text-[#B3174A]">مشترياتك</p>
                <h1 className="mt-1 text-2xl font-bold text-[#270830] sm:text-3xl">سلة التسوق</h1>
                <p className="mt-2 text-sm text-gray-500">راجع المنتجات والكميات قبل متابعة الطلب.</p>
              </div>
              {!customer && <><SignInPrompt /><Divider /></>}
              {customer && !cart.email && <div className="mb-6"><EmailCapture defaultEmail={customer.email} /></div>}
              <ItemsTemplate cart={cart} />
            </section>
            <aside className="min-w-0 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-6">
                {cart.region && <Summary cart={cart as any} customer={customer} />}
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-3xl border border-[#67285A]/10 bg-white shadow-sm"><EmptyCartMessage /></div>
        )}
      </div>
    </main>
  )
}

export default CartTemplate
