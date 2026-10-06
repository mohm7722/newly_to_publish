"use client"

import { Plus } from "@medusajs/icons"
import { Button, Heading } from "@modules/common/components/ui"
import { useActionState, useEffect, useState } from "react"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import Modal from "@modules/common/components/modal"

const AddAddress = ({
  region,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const [formState, formAction] = useActionState(addCustomerAddress, {
    success: false,
    error: null,
  } as { success: boolean; error: string | null })

  const close = () => {
    setSuccessState(false)
    closeModal()
  }

  useEffect(() => {
    if (successState) {
      close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [successState])

  useEffect(() => {
    if (formState.success) {
      setSuccessState(true)
    }
  }, [formState])

  return (
    <>
      <button
        type="button"
        className="group flex min-h-[220px] h-full w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-[#67285A]/20 bg-[#fcfafc] p-5 text-[#67285A] transition hover:border-[#67285A]/50 hover:bg-[#f9f6fb]"
        onClick={open}
        data-testid="add-address-button"
      >
        <span className="text-base-semi">عنوان جديد</span>
        <Plus />
      </button>

      <Modal isOpen={state} close={close} data-testid="add-address-modal">
        <Modal.Title>
          <Heading className="mb-2">إضافة عنوان</Heading>
        </Modal.Title>
        <form action={formAction}>
          <Modal.Body>
            <div className="flex flex-col gap-y-3 text-right">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="الاسم الأول"
                  name="first_name"
                  required
                  autoComplete="given-name"
                  data-testid="first-name-input"
                />
                <Input
                  label="اسم العائلة"
                  name="last_name"
                  required
                  autoComplete="family-name"
                  data-testid="last-name-input"
                />
              </div>
              <Input
                label="الشركة"
                name="company"
                autoComplete="organization"
                data-testid="company-input"
              />
              <Input
                label="العنوان"
                name="address_1"
                required
                autoComplete="address-line1"
                data-testid="address-1-input"
              />
              <Input
                label="الشقة، الجناح، إلخ."
                name="address_2"
                autoComplete="address-line2"
                data-testid="address-2-input"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="الرمز البريدي"
                  name="postal_code"
                  required
                  autoComplete="postal-code"
                  data-testid="postal-code-input"
                />
                <Input
                  label="المدينة"
                  name="city"
                  required
                  autoComplete="address-level2"
                  data-testid="city-input"
                />
              </div>
              <Input
                label="المحافظة / الولاية"
                name="province"
                autoComplete="address-level1"
                data-testid="state-input"
              />
              <CountrySelect
                region={region}
                name="country_code"
                required
                autoComplete="country"
                data-testid="country-select"
              />
              <Input
                label="رقم الهاتف"
                name="phone"
                type="tel"
                autoComplete="tel"
                data-testid="phone-input"
              />
            </div>
            {formState.error && (
              <div
                className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600"
                data-testid="address-error"
              >
                {formState.error}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="reset"
                variant="secondary"
                onClick={close}
                className="h-10 w-full sm:w-auto"
                data-testid="cancel-button"
              >
                إلغاء
              </Button>
              <SubmitButton className="w-full sm:w-auto" data-testid="save-button">
                حفظ
              </SubmitButton>
            </div>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  )
}

export default AddAddress
