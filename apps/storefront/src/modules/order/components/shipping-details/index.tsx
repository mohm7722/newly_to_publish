import FxPrice from "@modules/common/components/fx-price"
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"

type ShippingDetailsProps = {
  order: HttpTypes.StoreOrder
}

const ShippingDetails = ({ order }: ShippingDetailsProps) => {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <Heading level="h2" className="mb-4 text-xl font-bold text-[#270830]">
        التوصيل
      </Heading>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div
          className="flex flex-col rounded-xl bg-[#fcfafc] p-4"
          data-testid="shipping-address-summary"
        >
          <Text className="mb-2 font-semibold text-ui-fg-base">عنوان الشحن</Text>
          <Text className="text-sm leading-6 text-ui-fg-subtle">
            {order.shipping_address?.first_name} {order.shipping_address?.last_name}
          </Text>
          <Text className="text-sm leading-6 text-ui-fg-subtle">
            {order.shipping_address?.address_1}{order.shipping_address?.address_2 ? `، ${order.shipping_address.address_2}` : ""}
          </Text>
          <Text className="text-sm leading-6 text-ui-fg-subtle">
            {order.shipping_address?.postal_code}، {order.shipping_address?.city}
          </Text>
          <Text className="text-sm leading-6 text-ui-fg-subtle">
            {order.shipping_address?.country_code?.toUpperCase()}
          </Text>
        </div>

        <div
          className="flex min-w-0 flex-col rounded-xl bg-[#fcfafc] p-4"
          data-testid="shipping-contact-summary"
        >
          <Text className="mb-2 font-semibold text-ui-fg-base">جهة الاتصال</Text>
          <Text className="text-sm leading-6 text-ui-fg-subtle">
            <bdi dir="ltr">{order.shipping_address?.phone || "—"}</bdi>
          </Text>
          <Text className="break-all text-sm leading-6 text-ui-fg-subtle">
            <bdi dir="ltr">{order.email}</bdi>
          </Text>
        </div>

        <div
          className="flex flex-col rounded-xl bg-[#fcfafc] p-4"
          data-testid="shipping-method-summary"
        >
          <Text className="mb-2 font-semibold text-ui-fg-base">طريقة التوصيل</Text>
          <Text className="text-sm leading-6 text-ui-fg-subtle">
            {(order.shipping_methods?.[0] as { name?: string })?.name || "غير محددة"}
          </Text>
          <strong className="mt-2 text-sm text-[#67285A]">
            <FxPrice amountSar={order.shipping_methods?.[0]?.total ?? 0} />
          </strong>
        </div>
      </div>
    </section>
  )
}

export default ShippingDetails
