"use client"
import { setAddresses } from "@lib/data/cart"
import { CheckCircleSolid } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import type { StoreCity } from "@lib/data/cities"
import { Heading, Text } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useActionState } from "react"
import ErrorMessage from "../error-message"
import ShippingAddress from "../shipping-address"
import { SubmitButton } from "../submit-button"

/**
 * Checkout step 1 — one address, no account required.
 *
 * The shopper fills a single address. It is used for delivery and the invoice
 * is issued with the same address, so there is no "billing address" form, no
 * "same as billing" checkbox, and no separate billing summary card.
 */
const Addresses = ({
  cart,
  customer,
  cities,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  cities: StoreCity[]
}) => {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "address"

  const handleEdit = () => {
    router.push(pathname + "?step=address")
  }

  const [message, formAction] = useActionState(setAddresses, null)

  return (
    <section className="overflow-hidden rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Heading
          level="h2"
          className="flex items-center gap-3 text-xl font-bold text-[#270830] sm:text-2xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3edf5] text-sm font-bold text-[#67285A]">1</span>
          بياناتك وعنوان التوصيل
          {!isOpen && <CheckCircleSolid className="text-[#82ac40]" />}
        </Heading>
        {!isOpen && cart?.shipping_address && (
          <Text>
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl bg-[#f3edf5] px-4 py-2 text-sm font-bold text-[#67285A] transition hover:bg-[#eadfec]"
              data-testid="edit-address-button"
            >
              تعديل
            </button>
          </Text>
        )}
      </div>
      {isOpen ? (
        <form action={formAction}>
          <div className="pb-8">
            <ShippingAddress
              customer={customer}
              cart={cart}
              cities={cities}
            />

            <SubmitButton className="mt-6 h-12 w-full rounded-xl bg-[#67285A] text-white hover:bg-[#56214c] sm:w-auto sm:min-w-[220px]" data-testid="submit-address-button">
              حفظ العنوان والمتابعة
            </SubmitButton>
            <ErrorMessage error={message} data-testid="address-error-message" />
          </div>
        </form>
      ) : (
        <div>
          <div className="text-small-regular">
            {cart && cart.shipping_address ? (
              <div className="w-full">
                <div className="grid w-full gap-3 sm:grid-cols-2">
                  <div
                    className="flex min-w-0 flex-col rounded-2xl bg-[#fcfafc] p-4"
                    data-testid="shipping-address-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      عنوان التوصيل
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.first_name}{" "}
                      {cart.shipping_address.last_name}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.address_1}
                    </Text>
                    <Text className="txt-medium text-ui-fg-subtle">
                      {cart.shipping_address.city}
                    </Text>
                  </div>

                  <div
                    className="flex min-w-0 flex-col rounded-2xl bg-[#fcfafc] p-4"
                    data-testid="shipping-contact-summary"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-1">
                      جهة الاتصال
                    </Text>
                    <Text className="break-all text-sm text-ui-fg-subtle">
                      <bdi dir="ltr">{cart.shipping_address.phone || "—"}</bdi>
                    </Text>
                    {cart.email && (
                      <Text className="break-all text-sm text-ui-fg-subtle">
                        <bdi dir="ltr">{cart.email}</bdi>
                      </Text>
                    )}
                  </div>
                </div>

                <p className="mt-3 rounded-2xl bg-[#f7faef] px-4 py-3 text-xs leading-6 text-[#3f5f18]">
                  ستصدر الفاتورة بنفس هذا العنوان.
                </p>
              </div>
            ) : (
              <div>
                <Spinner />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

export default Addresses
