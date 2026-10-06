"use client"
import { RadioGroup } from "@headlessui/react"
import {
  MANUAL_PROVIDER_ID,
  isCODPayment,
  isManual,
  isManualBankTransfer,
  isOfflinePayment,
  isStripeLike,
  paymentInfoMap,
} from "@lib/constants"
import { initiatePaymentSession, updateCart } from "@lib/data/cart"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  StripeCardContainer,
} from "@modules/checkout/components/payment-container"
import CODPayment from "./cod-payment"
import ManualBankTransfer from "./manual-bank-transfer"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

const Payment = ({
  cart,
  availablePaymentMethods,
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardBrand, setCardBrand] = useState<string | null>(null)
  const [cardComplete, setCardComplete] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [bankTransferReady, setBankTransferReady] = useState(false)
  const handleBankTransferReady = useCallback((ready: boolean) => {
    setBankTransferReady(ready)
  }, [])
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(
    (cart.metadata?.payment_method as string | undefined) ??
      (activeSession?.provider_id && !isManual(activeSession.provider_id)
        ? activeSession.provider_id
        : "")
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const isOpen = searchParams.get("step") === "payment"

  // The shipping city id used to gate COD availability, if the cart carries it.
  const shippingCityId =
    (cart.metadata?.city_id as string | undefined) ?? undefined

  // A manual provider being available means offline methods (COD / bank
  // transfer) can be completed through pp_system_default.
  const manualProviderAvailable = availablePaymentMethods?.some((pm) =>
    isManual(pm.id)
  )

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)

    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
      return
    }

    // Offline methods (COD / bank transfer) complete through the core manual
    // provider. Initiate the manual session and persist the selected offline
    // discriminator on the cart so it survives reload and review.
    if (isOfflinePayment(method)) {
      try {
        await initiatePaymentSession(cart, {
          provider_id: MANUAL_PROVIDER_ID,
        })
        await updateCart({
          metadata: {
            ...(cart.metadata ?? {}),
            payment_method: method,
          },
        })
        setOfflineReady(true)
      } catch (err) {
        setOfflineReady(false)
        setError(err instanceof Error ? err.message : String(err))
      }
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const hasShipping = (cart?.shipping_methods?.length ?? 0) !== 0
  const paymentReady = paidByGiftcard || (
    hasShipping && (
      isManualBankTransfer(selectedPaymentMethod)
        ? bankTransferReady
        : isCODPayment(selectedPaymentMethod)
          ? offlineReady
          : Boolean(activeSession)
    )
  )

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      if (isManualBankTransfer(selectedPaymentMethod) && !bankTransferReady) {
        setError("اختر حسابًا بنكيًا وارفع إشعار الإيداع قبل المتابعة")
        return
      }
      // Offline methods already initiated their manual session in
      // setPaymentMethod; move straight to review.
      if (isOfflinePayment(selectedPaymentMethod)) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }

      const shouldInputCard =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession =
        activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(cart, {
          provider_id: selectedPaymentMethod,
        })
      }

      if (!shouldInputCard) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  return (
    <section className="overflow-hidden rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Heading
          level="h2"
          className={clx(
            "flex items-center gap-3 text-xl font-bold text-[#270830] sm:text-2xl",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f3edf5] text-sm font-bold text-[#67285A]">3</span>
          الدفع
          {!isOpen && paymentReady && <CheckCircleSolid className="text-[#82ac40]" />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              type="button"
              onClick={handleEdit}
              className="rounded-xl bg-[#f3edf5] px-4 py-2 text-sm font-bold text-[#67285A] transition hover:bg-[#eadfec]"
              data-testid="edit-payment-button"
            >
              تعديل
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {!paidByGiftcard && availablePaymentMethods?.length && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {availablePaymentMethods
                  .filter((paymentMethod) => !isManual(paymentMethod.id))
                  .map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripeCardContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setCardBrand={setCardBrand}
                        setError={setError}
                        setCardComplete={setCardComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}

                {/* Offline payment methods, completed via the manual provider */}
                {manualProviderAvailable && (
                  <>
                    <ManualBankTransfer
                      cartId={cart.id}
                      selectedPaymentOptionId={selectedPaymentMethod}
                      onReadyChange={handleBankTransferReady}
                    />
                    <CODPayment
                      selectedPaymentOptionId={selectedPaymentMethod}
                      shippingCityId={shippingCityId}
                    />
                  </>
                )}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                طريقة الدفع
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                بطاقة هدية
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6 h-12 w-full rounded-xl bg-[#67285A] text-white hover:bg-[#56214c] sm:w-auto sm:min-w-[220px]"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !cardComplete) ||
              (isManualBankTransfer(selectedPaymentMethod) && !bankTransferReady) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? " أدخل بيانات البطاقة"
              : "المتابعة إلى المراجعة"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && (activeSession || isOfflinePayment(selectedPaymentMethod)) ? (
            <div className="grid w-full gap-3 sm:grid-cols-2">
              <div className="flex min-w-0 flex-col rounded-2xl bg-[#fcfafc] p-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  طريقة الدفع
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {paymentInfoMap[selectedPaymentMethod]?.title ||
                    paymentInfoMap[activeSession?.provider_id ?? ""]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex min-w-0 flex-col rounded-2xl bg-[#fcfafc] p-4">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  تفاصيل الدفع
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {paymentInfoMap[selectedPaymentMethod]?.icon || (
                      <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {isStripeLike(selectedPaymentMethod) && cardBrand
                      ? cardBrand
                      : isManualBankTransfer(selectedPaymentMethod)
                      ? "سيتم إرسال تفاصيل الحساب"
                      : isCODPayment(selectedPaymentMethod)
                      ? "الدفع عند الاستلام"
                      : "ستظهر خطوة أخرى"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                طريقة الدفع
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                بطاقة هدية
              </Text>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export default Payment
