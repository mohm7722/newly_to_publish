import type { StoreCity } from "@lib/data/cities"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Checkbox from "@modules/common/components/checkbox"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const normalizeCity = (value?: string | null) =>
  (value ?? "").trim().toLocaleLowerCase("ar")

const ShippingAddress = ({
  customer,
  cart,
  checked,
  onChange,
  cities,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
  checked: boolean
  onChange: () => void
  cities: StoreCity[]
}) => {
  const metadataCityId = String(cart?.metadata?.city_id ?? "")
  const initialCity =
    cities.find((city) => city.id === metadataCityId) ??
    cities.find(
      (city) =>
        normalizeCity(city.name) ===
        normalizeCity(cart?.shipping_address?.city)
    )
  const [selectedCityId, setSelectedCityId] = useState(initialCity?.id ?? "")
  const [formData, setFormData] = useState<Record<string, string>>({
    // Fall back to the registered customer's profile so the sign-up details
    // (name, phone) prefill the checkout instead of asking for them again.
    "shipping_address.first_name":
      cart?.shipping_address?.first_name || customer?.first_name || "",
    "shipping_address.last_name":
      cart?.shipping_address?.last_name || customer?.last_name || "",
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.company": cart?.shipping_address?.company || "",
    "shipping_address.postal_code": cart?.shipping_address?.postal_code || "",
    "shipping_address.city": initialCity?.name || "",
    "shipping_address.country_code": cart?.shipping_address?.country_code || "",
    "shipping_address.province": cart?.shipping_address?.province || "",
    "shipping_address.phone":
      cart?.shipping_address?.phone || customer?.phone || "",
    email: cart?.email || customer?.email || "",
  })

  const countriesInRegion = useMemo(
    () => cart?.region?.countries?.map((c) => c.iso_2),
    [cart?.region]
  )

  // check if customer has saved addresses that are in the current region
  const addressesInRegion = useMemo(
    () =>
      customer?.addresses.filter(
        (a) => a.country_code && countriesInRegion?.includes(a.country_code)
      ),
    [customer?.addresses, countriesInRegion]
  )

  const setFormAddress = (
    address?: HttpTypes.StoreCartAddress,
    email?: string
  ) => {
    if (address) {
      const matchedCity = cities.find(
        (city) =>
          normalizeCity(city.name) === normalizeCity(address.city)
      )
      setSelectedCityId(matchedCity?.id ?? "")
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        "shipping_address.first_name": address?.first_name || "",
        "shipping_address.last_name": address?.last_name || "",
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.company": address?.company || "",
        "shipping_address.postal_code": address?.postal_code || "",
        "shipping_address.city": matchedCity?.name || "",
        "shipping_address.country_code": address?.country_code || "",
        "shipping_address.province": address?.province || "",
        "shipping_address.phone": address?.phone || "",
      }))
    }

    if (email) {
      setFormData((prevState: Record<string, string>) => ({
        ...prevState,
        email: email,
      }))
    }
  }

  useEffect(() => {
    // Ensure cart is not null and has a shipping_address before setting form data
    if (cart && cart.shipping_address) {
      setFormAddress(cart?.shipping_address, cart?.email)
    }

    if (cart && !cart.email && customer?.email) {
      setFormAddress(undefined, customer.email)
    }
  }, [cart]) // Add cart as a dependency

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = cities.find((item) => item.id === e.target.value)
    setSelectedCityId(city?.id ?? "")
    setFormData((current) => ({
      ...current,
      "shipping_address.city": city?.name ?? "",
    }))
  }

  return (
    <>
      {customer && (addressesInRegion?.length || 0) > 0 && (
        <Container className="mb-6 flex flex-col gap-y-4 p-5">
          <p className="text-small-regular">
            {`مرحباً ${customer.first_name}، هل ترغب في استخدام أحد عناوينك المحفوظة؟`}
          </p>
          <AddressSelect
            addresses={customer.addresses}
            addressInput={
              mapKeys(formData, (_, key) =>
                key.replace("shipping_address.", "")
              ) as unknown as HttpTypes.StoreCartAddress
            }
            onSelect={setFormAddress}
          />
        </Container>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="الاسم الأول"
          name="shipping_address.first_name"
          autoComplete="given-name"
          value={formData["shipping_address.first_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-first-name-input"
        />
        <Input
          label="اسم العائلة"
          name="shipping_address.last_name"
          autoComplete="family-name"
          value={formData["shipping_address.last_name"]}
          onChange={handleChange}
          required
          data-testid="shipping-last-name-input"
        />
        <div className="sm:col-span-2">
          <Input
            label="العنوان التفصيلي (الشارع / المبنى)"
            name="shipping_address.address_1"
            autoComplete="address-line1"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            data-testid="shipping-address-input"
          />
        </div>

        <div className="sm:col-span-2 rounded-2xl bg-[#fcfafc] px-4 py-3">
          <p className="text-sm font-bold text-[#270830]">موقع التوصيل</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            اختر الدولة ومحافظة التوصيل، ثم اكتب المديرية أو الحي لتحديد العنوان بدقة.
          </p>
        </div>

        <div>
          <label htmlFor="shipping-country-select" className="mb-2 block text-sm font-medium text-[#270830]">
            الدولة
          </label>
          <CountrySelect
            id="shipping-country-select"
            name="shipping_address.country_code"
            autoComplete="country"
            region={cart?.region}
            value={formData["shipping_address.country_code"]}
            onChange={handleChange}
            required
            placeholder="اختر الدولة"
            className="h-12 rounded-xl bg-white"
            data-testid="shipping-country-select"
          />
        </div>

        <div>
          <label htmlFor="shipping-city-select" className="mb-2 block text-sm font-medium text-[#270830]">
            محافظة التوصيل
          </label>
          <input
            type="hidden"
            name="shipping_address.city"
            value={formData["shipping_address.city"]}
          />
          <NativeSelect
            id="shipping-city-select"
            name="shipping_city_id"
            value={selectedCityId}
            onChange={handleCityChange}
            required
            disabled={cities.length === 0}
            placeholder={cities.length ? "اختر محافظة متاحة للتوصيل" : "لا توجد محافظات توصيل متاحة حالياً"}
            aria-describedby="shipping-governorate-help"
            className="h-12 rounded-xl bg-white"
            data-testid="shipping-city-select"
          >
            {cities.map((city) => (
              <option key={city.id} value={city.id}>
                {city.name}
              </option>
            ))}
          </NativeSelect>
          <p id="shipping-governorate-help" className="mt-2 text-xs leading-5 text-gray-500">
            تُحدد رسوم الشحن حسب المحافظة، وستظهر في ملخص الطلب.
          </p>
        </div>

        <div className="sm:col-span-2">
          <Input
            id="shipping-district-input"
            label="المنطقة / المديرية داخل المحافظة (اختياري)"
            name="shipping_address.province"
            autoComplete="address-level1"
            value={formData["shipping_address.province"]}
            onChange={handleChange}
            aria-describedby="shipping-district-help"
            data-testid="shipping-province-input"
          />
          <p id="shipping-district-help" className="mt-2 text-xs leading-5 text-gray-500">
            مثال: الشيخ عثمان أو خور مكسر. لا تكرر اسم المحافظة هنا.
          </p>
        </div>
      </div>

      <div className="my-8 rounded-2xl border border-[#67285A]/10 bg-[#fcfafc] p-4">
        <Checkbox
          label="استخدم عنوان الشحن نفسه لإصدار الفاتورة"
          name="same_as_billing"
          checked={checked}
          onChange={onChange}
          data-testid="billing-address-checkbox"
        />
        <p className="mt-2 text-xs leading-6 text-gray-500 sm:pr-7">
          اترك هذا الخيار مفعّلًا عادةً. ألغِه فقط إذا أردت أن تحمل الفاتورة عنوانًا مختلفًا عن مكان استلام الطلب.
        </p>
      </div>
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="البريد الإلكتروني"
          name="email"
          type="email"
          title="أدخل بريداً إلكترونياً صالحاً."
          autoComplete="email"
          value={formData.email}
          onChange={handleChange}
          required
          data-testid="shipping-email-input"
        />
        <Input
          label="رقم الهاتف"
          name="shipping_address.phone"
          type="tel"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          data-testid="shipping-phone-input"
        />
      </div>
    </>
  )
}

export default ShippingAddress
