"use client"

import { Plus } from "@medusajs/icons"
import { Button, Heading } from "@modules/common/components/ui"
import { useActionState, useEffect, useState } from "react"

import { addCustomerAddress } from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import type { StoreCity } from "@lib/data/cities"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import Modal from "@modules/common/components/modal"

/**
 * Add a saved address.
 *
 * Collects exactly the same fields as checkout — full name, phone, governorate,
 * detailed address — so a saved address can prefill checkout in one click with
 * nothing left over. There are no separate billing fields: the invoice is
 * issued with the delivery address.
 */
const AddAddress = ({
  region,
  cities,
}: {
  region: HttpTypes.StoreRegion
  addresses: HttpTypes.StoreCustomerAddress[]
  cities: StoreCity[]
}) => {
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const countries = region?.countries ?? []
  const singleCountryCode =
    countries.length === 1 ? countries[0]?.iso_2 ?? "" : ""

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
              <Input
                label="الاسم الكامل"
                name="full_name"
                required
                autoComplete="name"
                data-testid="full-name-input"
              />
              <Input
                label="رقم الهاتف"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                data-testid="phone-input"
              />
              <div>
                <label
                  htmlFor="add-address-city"
                  className="mb-2 block text-sm font-medium text-[#270830]"
                >
                  المحافظة
                </label>
                <NativeSelect
                  id="add-address-city"
                  name="city"
                  required
                  disabled={cities.length === 0}
                  placeholder={
                    cities.length
                      ? "اختر المحافظة"
                      : "لا توجد محافظات توصيل متاحة حالياً"
                  }
                  className="h-12 rounded-xl bg-white"
                  data-testid="city-select"
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.name}>
                      {city.name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <Input
                label="العنوان التفصيلي"
                name="address_1"
                required
                autoComplete="street-address"
                data-testid="address-1-input"
              />
              {singleCountryCode ? (
                <input
                  type="hidden"
                  name="country_code"
                  value={singleCountryCode}
                />
              ) : (
                <CountrySelect
                  region={region}
                  name="country_code"
                  required
                  autoComplete="country"
                  data-testid="country-select"
                />
              )}
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
