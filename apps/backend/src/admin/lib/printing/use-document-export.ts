import { useCallback, useRef, useState } from "react"
import { exportNodeToPdf, type ExportOptions } from "./pdf-engine"

/**
 * Generic document export hook (reusable across all printable documents:
 * invoices, returns, order/customer/sales statements, receipts, …).
 *
 * Usage:
 * ```tsx
 * const { ref, exporting, exportPdf } = useDocumentExport()
 * return (
 *   <>
 *     <Button onClick={() => exportPdf({ filename: "invoice-INV-001" })}>
 *       تصدير PDF
 *     </Button>
 *     <div ref={ref}><DocumentSheet>…</DocumentSheet></div>
 *   </>
 * )
 * ```
 *
 * The hook owns the export lifecycle (pending state + the node ref) and
 * delegates the actual rendering to the swappable {@link exportNodeToPdf}
 * engine, keeping data, presentation, and export concerns separate.
 */
export function useDocumentExport<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const exportPdf = useCallback(async (options?: ExportOptions) => {
    if (!ref.current) {
      return
    }
    setExporting(true)
    setError(null)
    try {
      await exportNodeToPdf(ref.current, options)
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setExporting(false)
    }
  }, [])

  return { ref, exporting, error, exportPdf }
}
