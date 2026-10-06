import { useMemo } from "react"
import { Button, Container, Heading, Text } from "@medusajs/ui"
import { useInvoiceData } from "../../lib/data/invoices"
import { useDocumentExport } from "../../lib/printing/use-document-export"
import DocumentSheet from "../../components/documents/document-sheet"
import OrderInvoiceTemplate from "../../components/documents/order-invoice-template"

/**
 * Order invoice page (`/app/invoice?order_id=...`).
 *
 * Exports no `config`, so it is a hidden route (not in the menu); it is opened
 * from the order-details "تصدير فاتورة PDF" widget button. Concerns are
 * separated: data via {@link useInvoiceData}, presentation via
 * `OrderInvoiceTemplate`/`DocumentSheet`, export via {@link useDocumentExport}.
 *
 * The `order_id` is read from the URL via `window.location` (not a react-router
 * hook) to avoid the admin's isolated-router context pitfalls in extensions.
 */
const InvoicePage = () => {
  const orderId = useMemo(
    () =>
      new URLSearchParams(window.location.search).get("order_id") ?? undefined,
    []
  )

  const { data, isLoading, isError, error } = useInvoiceData(orderId)
  const { ref, exporting, exportPdf } = useDocumentExport()

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">فاتورة الطلب</Heading>
          {data && (
            <Text size="small" className="text-ui-fg-subtle">
              رقم الفاتورة: {data.invoice.number}
            </Text>
          )}
        </div>
        <Button
          variant="primary"
          disabled={!data || exporting}
          isLoading={exporting}
          onClick={() =>
            exportPdf({
              filename: data ? `invoice-${data.invoice.number}` : "invoice",
            })
          }
        >
          تصدير PDF
        </Button>
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ التحميل…</Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            تعذّر تحميل الفاتورة: {(error as Error)?.message}
          </Text>
        </div>
      )}

      {data && (
        <div className="flex justify-center bg-ui-bg-subtle p-6">
          <div ref={ref}>
            <DocumentSheet>
              <OrderInvoiceTemplate data={data} />
            </DocumentSheet>
          </div>
        </div>
      )}
    </Container>
  )
}

export default InvoicePage
