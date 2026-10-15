import type { StoreCity } from "@lib/data/cities"
import { joinFullName } from "@lib/util/full-name"
import { HttpTypes } from "@medusajs/types"
import { Container } from "@modules/common/components/ui"
import Input from "@modules/common/components/input"
import NativeSelect from "@modules/common/components/native-select"
import { mapKeys } from "lodash"
import React, { useEffect, useMemo, useState } from "react"
import AddressSelect from "../address-select"
import CountrySelect from "../country-select"

const normalizeCity = (value?: string | null) =>
  (value ?? "").trim().toLocaleLowerCase("ar")

/**
 * The single address form used at checkout.
 *
 * Collects the minimum a Yemeni delivery actually needs, in this order:
 * full name → phone → email (optional) → governorate → detailed address.
 *
 * There is no billing address form. The invoice is issued with exactly this
 * address, so `billing_address` is filled server-side from these same values
 * (see `setAddresses` in `@lib/data/cart`). Likewise there is no separate
 * street/district field: the governorate comes from the dropdown and everything
 * finer goes into the free-text address.
 *
 * The country select only renders when the region actually spans more than one
 * country; with a single-country region (Yemen) it is submitted as a hidden
 * input so the shopper never has to answer a question with one possible answer.
 */
const ShippingAddress = ({
  customer,
  cart,
  cities,
}: {
  customer: HttpTypes.StoreCustomer | null
  cart: HttpTypes.StoreCart | null
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

  const regionCountries = useMemo(
    () => cart?.region?.countries ?? [],
    [cart?.region]
  )
  const singleCountryCode =
    regionCountries.length === 1 ? regionCountries[0]?.iso_2 ?? "" : ""

  const [formData, setFormData] = useState<Record<string, string>>({
    // Fall back to the registered customer's profile so the sign-up details
    // (name, phone) prefill the checkout instead of asking for them again.
    "shipping_address.full_name":
      joinFullName(
        cart?.shipping_address?.first_name,
        cart?.shipping_address?.last_name
      ) || joinFullName(customer?.first_name, customer?.last_name),
    "shipping_address.address_1": cart?.shipping_address?.address_1 || "",
    "shipping_address.city": initialCity?.name || "",
    "shipping_address.country_code":
      cart?.shipping_address?.country_code || singleCountryCode,
    "shipping_address.phone":
      cart?.shipping_address?.phone || customer?.phone || "",
    email: cart?.email || customer?.email || "",
  })

  const countriesInRegion = useMemo(
    () => regionCountries.map((c) => c.iso_2),
    [regionCountries]
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
        "shipping_address.full_name": joinFullName(
          address?.first_name,
          address?.last_name
        ),
        "shipping_address.address_1": address?.address_1 || "",
        "shipping_address.city": matchedCity?.name || "",
        "shipping_address.country_code":
          address?.country_code || singleCountryCode,
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
        <div className="sm:col-span-2">
          <Input
            label="الاسم الكامل"
            name="shipping_address.full_name"
            autoComplete="name"
            value={formData["shipping_address.full_name"]}
            onChange={handleChange}
            required
            data-testid="shipping-full-name-input"
          />
        </div>

        <Input
          label="رقم الهاتف"
          name="shipping_address.phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={formData["shipping_address.phone"]}
          onChange={handleChange}
          required
          data-testid="shipping-phone-input"
        />

        <div>
          <Input
            label="البريد الإلكتروني (اختياري)"
            name="email"
            type="email"
            title="أدخل بريداً إلكترونياً صالحاً."
            autoComplete="email"
            value={formData.email}
            onChange={handleChange}
            aria-describedby="shipping-email-help"
            data-testid="shipping-email-input"
          />
          <p id="shipping-email-help" className="mt-2 text-xs leading-5 text-gray-500">
            أضفه إذا أردت استلام تأكيد الطلب بالبريد. التواصل الأساسي يتم عبر الهاتف.
          </p>
        </div>

        <div className="sm:col-span-2 rounded-2xl bg-[#fcfafc] px-4 py-3">
          <p className="text-sm font-bold text-[#270830]">موقع التوصيل</p>
          <p className="mt-1 text-xs leading-5 text-gray-500">
            اختر محافظتك من القائمة، ثم اكتب تفاصيل العنوان (المديرية، الحي، الشارع، أقرب نقطة دالة).
          </p>
        </div>

        {singleCountryCode ? (
          <input
            type="hidden"
            name="shipping_address.country_code"
            value={formData["shipping_address.country_code"]}
          />
        ) : (
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
        )}

        <div className={singleCountryCode ? "sm:col-span-2" : undefined}>
          <label htmlFor="shipping-city-select" className="mb-2 block text-sm font-medium text-[#270830]">
            المحافظة
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
            placeholder={cities.length ? "اختر المحافظة" : "لا توجد محافظات توصيل متاحة حالياً"}
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
            label="العنوان التفصيلي"
            name="shipping_address.address_1"
            autoComplete="street-address"
            value={formData["shipping_address.address_1"]}
            onChange={handleChange}
            required
            aria-describedby="shipping-address-help"
            data-testid="shipping-address-input"
          />
          <p id="shipping-address-help" className="mt-2 text-xs leading-5 text-gray-500">
            مثال: الشيخ عثمان، شارع الزعفران، بجوار صيدلية النور.
          </p>
        </div>
      </div>

      <div className="mb-2 mt-6 rounded-2xl border border-[#67285A]/10 bg-[#fcfafc] p-4">
        <p className="text-sm leading-7 text-gray-600">
          سيتم التوصيل إلى هذا العنوان، وستصدر الفاتورة بنفس العنوان. يمكنك تعديله في أي وقت قبل تأكيد الطلب.
        </p>
      </div>
    </>
  )
}

export default ShippingAddress
