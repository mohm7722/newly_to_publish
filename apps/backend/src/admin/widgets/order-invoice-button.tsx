import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Button, Heading } from "@medusajs/ui"
import { DocumentText } from "@medusajs/icons"
import { useMyPermissions, makeChecker } from "../lib/use-my-permissions"

/**
 * Order-details widget: "تصدير فاتورة PDF".
 *
 * Shown only to users holding `orders.invoice.print`. Opens the hidden invoice
 * page in a new tab (`/app/invoice?order_id=…`); navigation uses `window.open`
 * to avoid the admin's isolated react-router context in widgets.
 */
const OrderInvoiceButton = ({ data }: { data: { id: string } }) => {
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)

  if (!can("orders.invoice.print")) {
    return null
  }

  return (
    <Container className="flex items-center justify-between p-6">
      <div className="flex items-center gap-x-2">
        <DocumentText className="text-ui-fg-subtle" />
        <Heading level="h2">الفاتورة</Heading>
      </div>
      <Button
        variant="secondary"
        size="small"
        onClick={() =>
          window.open(`/app/invoice?order_id=${data.id}`, "_blank")
        }
      >
        تصدير فاتورة PDF
      </Button>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderInvoiceButton
