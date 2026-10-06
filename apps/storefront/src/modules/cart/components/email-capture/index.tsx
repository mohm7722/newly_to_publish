"use client"

import { useState } from "react"
import { Button, Input, Text } from "@modules/common/components/ui"
import { setCartEmail } from "@lib/data/cart"

/**
 * Early email capture on the cart page.
 *
 * Rendered only when the cart has no email yet. Persisting the email here (well
 * before the address step) makes the cart eligible for abandoned-cart recovery
 * even if the customer abandons before checkout. Non-blocking: it never
 * prevents the customer from proceeding to checkout.
 */
const EmailCapture = ({ defaultEmail }: { defaultEmail?: string | null }) => {
  const [email, setEmail] = useState(defaultEmail ?? "")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const value = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("يرجى إدخال بريد إلكتروني صحيح")
      return
    }

    try {
      setStatus("saving")
      await setCartEmail(value)
      setStatus("saved")
    } catch (err) {
      setStatus("error")
      setError(err instanceof Error ? err.message : "تعذّر حفظ البريد")
    }
  }

  if (status === "saved") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-right">
        <Text className="text-sm text-green-700">
          تم حفظ بريدك ✅ سنُذكّرك بسلتك إذا لم تُكمل طلبك.
        </Text>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
    >
      <Text className="mb-2 text-sm text-gray-700 text-right">
        أدخل بريدك الإلكتروني لحفظ سلتك وتلقّي تذكير في حال لم تُكمل الطلب.
      </Text>
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <Input
          type="email"
          name="cart_email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1"
          dir="ltr"
          required
        />
        <Button
          type="submit"
          disabled={status === "saving"}
          className="h-10 whitespace-nowrap"
        >
          {status === "saving" ? "جارٍ الحفظ..." : "احفظ سلتي"}
        </Button>
      </div>
      {error && (
        <Text className="mt-2 text-sm text-red-600 text-right">{error}</Text>
      )}
    </form>
  )
}

export default EmailCapture
