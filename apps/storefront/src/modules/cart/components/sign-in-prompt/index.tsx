import { Button, Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const SignInPrompt = () => {
  return (
    <div className="bg-white flex items-center justify-between">
      <div>
        <Heading level="h2" className="txt-xlarge">
          سجّل الدخول لإكمال طلبك
        </Heading>
        <Text className="txt-medium text-ui-fg-subtle mt-2">
          يتطلب إتمام الشراء تسجيل الدخول أو إنشاء حساب. جميع الطلبات تُحفظ في
          حسابك ليمكنك تتبعها لاحقًا.
        </Text>
      </div>
      <div>
        <LocalizedClientLink href="/account?redirect=/checkout">
          <Button
            variant="secondary"
            className="h-10"
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
