"use client"

import {
  deleteCustomerAddress,
  updateCustomerAddress,
} from "@lib/data/customer"
import useToggleState from "@lib/hooks/use-toggle-state"
import { joinFullName } from "@lib/util/full-name"
import type { StoreCity } from "@lib/data/cities"
import { PencilSquare as Edit, Trash } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import CountrySelect from "@modules/checkout/components/country-select"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import Modal from "@modules/common/components/modal"
import { Button, Heading, Text, clx } from "@modules/common/components/ui"
import Spinner from "@modules/common/icons/spinner"
import React, { useActionState, useEffect, useState } from "react"

type EditAddressProps = {
  region: HttpTypes.StoreRegion
  address: HttpTypes.StoreCustomerAddress
  cities: StoreCity[]
  isActive?: boolean
}

/**
 * Edit a saved address.
 *
 * Mirrors the checkout address form exactly: full name, phone, governorate,
 * detailed address. No separate billing fields — the invoice uses this address.
 */
const EditAddress: React.FC<EditAddressProps> = ({
  region,
  address,
  cities,
  isActive = false,
}) => {
  const [removing, setRemoving] = useState(false)
  const [successState, setSuccessState] = useState(false)
  const { state, open, close: closeModal } = useToggleState(false)

  const countries = region?.countries ?? []
  const singleCountryCode =
    countries.length === 1 ? countries[0]?.iso_2 ?? "" : ""

  const [formState, formAction] = useActionState(updateCustomerAddress, {
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

  const removeAddress = async () => {
    setRemoving(true)
    await deleteCustomerAddress(address.id)
    setRemoving(false)
  }

  const fullName = joinFullName(address.first_name, address.last_name)

  return (
    <>
      <div
        className={clx(
          "flex min-h-[220px] h-full w-full flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 text-right shadow-sm transition hover:border-[#67285A]/20 hover:shadow-neoly",
          {
            "border-[#67285A]": isActive,
          }
        )}
        data-testid="address-container"
      >
        <div className="flex flex-col">
          <Heading
            className="text-right text-base-semi"
            data-testid="address-name"
          >
            {fullName}
          </Heading>
          <Text className="mt-2 flex flex-col text-right text-base-regular">
            <span data-testid="address-address">{address.address_1}</span>
            <span data-testid="address-city">{address.city}</span>
            {address.phone && (
              <span data-testid="address-phone">
                <bdi dir="ltr">{address.phone}</bdi>
              </span>
            )}
          </Text>
        </div>
        <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4">
          <button
            className="text-small-regular text-ui-fg-base flex items-center gap-x-2"
            onClick={open}
            data-testid="address-edit-button"
          >
            <Edit />
            تعديل
          </button>
          <button
            className="text-small-regular text-ui-fg-base flex items-center gap-x-2"
            onClick={removeAddress}
            data-testid="address-delete-button"
          >
            {removing ? <Spinner /> : <Trash />}
            إزالة
          </button>
        </div>
      </div>

      <Modal isOpen={state} close={close} data-testid="edit-address-modal">
        <Modal.Title>
          <Heading className="mb-2">تعديل العنوان</Heading>
        </Modal.Title>
        <form action={formAction}>
          <input type="hidden" name="addressId" value={address.id} />
          <Modal.Body>
            <div className="grid grid-cols-1 gap-y-3 text-right">
              <Input
                label="الاسم الكامل"
                name="full_name"
                required
                autoComplete="name"
                defaultValue={fullName || undefined}
                data-testid="full-name-input"
              />
              <Input
                label="رقم الهاتف"
                name="phone"
                type="tel"
                inputMode="tel"
                required
                autoComplete="tel"
                defaultValue={address.phone || undefined}
                data-testid="phone-input"
              />
              <div>
                <label
                  htmlFor={`edit-address-city-${address.id}`}
                  className="mb-2 block text-sm font-medium text-[#270830]"
                >
                  المحافظة
                </label>
                <NativeSelect
                  id={`edit-address-city-${address.id}`}
                  name="city"
                  required
                  disabled={cities.length === 0}
                  defaultValue={address.city || undefined}
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
                  {/* Keep a legacy/unlisted city selectable so editing an older
                      address does not silently drop its stored value. */}
                  {address.city &&
                    !cities.some((city) => city.name === address.city) && (
                      <option value={address.city}>{address.city}</option>
                    )}
                </NativeSelect>
              </div>
              <Input
                label="العنوان التفصيلي"
                name="address_1"
                required
                autoComplete="street-address"
                defaultValue={address.address_1 || undefined}
                data-testid="address-1-input"
              />
              {singleCountryCode ? (
                <input
                  type="hidden"
                  name="country_code"
                  value={address.country_code || singleCountryCode}
                />
              ) : (
                <CountrySelect
                  name="country_code"
                  region={region}
                  required
                  autoComplete="country"
                  defaultValue={address.country_code || undefined}
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

export default EditAddress
