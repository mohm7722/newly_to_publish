import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * Optional sign-in nudge shown on the cart page to guests.
 *
 * This is deliberately *not* a gate: guest checkout is fully supported, so the
 * copy frames an account as a convenience (saved addresses, order history)
 * rather than a requirement.
 */
const SignInPrompt = () => {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-[#fcfafc] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div>
        <Heading level="h2" className="text-base font-bold text-[#270830]">
          لديك حساب؟
        </Heading>
        <Text className="mt-1 text-sm leading-6 text-gray-500">
          سجّل الدخول لاستخدام عناوينك المحفوظة ومتابعة طلباتك. أو أكمل الشراء
          مباشرةً بدون حساب — نحتاج الاسم ورقم الهاتف فقط.
        </Text>
      </div>
      <div className="shrink-0">
        <LocalizedClientLink href="/account?redirect=/checkout">
          <Button
            variant="secondary"
            className="h-10 w-full sm:w-auto"
            data-testid="sign-in-button"
          >
            تسجيل الدخول
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default SignInPrompt
