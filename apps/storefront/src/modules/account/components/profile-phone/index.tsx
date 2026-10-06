"use client"

import React, { useActionState, useEffect } from "react"
import Input from "@modules/common/components/input"
import AccountInfo from "../account-info"
import { HttpTypes } from "@medusajs/types"
import { updateCustomer } from "@lib/data/customer"

type MyInformationProps = { customer: HttpTypes.StoreCustomer }

const ProfilePhone: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)
  const updateCustomerPhone = async (_currentState: Record<string, unknown>, formData: FormData) => {
    try {
      await updateCustomer({ phone: formData.get("phone") as string })
      return { success: true, error: null }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
  const [state, formAction] = useActionState(updateCustomerPhone, { error: null as string | null, success: false })
  const clearState = () => setSuccessState(false)
  useEffect(() => setSuccessState(state.success), [state])

  return (
    <form action={formAction} className="w-full">
      <AccountInfo
        label="رقم الهاتف"
        currentInfo={customer.phone ? <bdi dir="ltr" className="font-semibold" data-testid="current-info">{customer.phone}</bdi> : "غير مضاف"}
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error || undefined}
        clearState={clearState}
        data-testid="account-phone-editor"
      >
        <Input label="رقم الهاتف" name="phone" type="tel" autoComplete="tel" required defaultValue={customer.phone ?? ""} data-testid="phone-input" />
      </AccountInfo>
    </form>
  )
}

export default ProfilePhone
