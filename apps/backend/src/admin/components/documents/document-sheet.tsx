import { forwardRef, type ReactNode } from "react"

/**
 * Generic printable document "sheet" (reusable layout shell).
 *
 * Provides a white, RTL, A4-proportioned canvas with consistent padding that
 * every printed document (invoice, statement, receipt, …) renders inside. It is
 * presentation-only and carries no data or export logic, so it can back any
 * document template. Attach the export ref to this element (or a wrapper).
 */
type DocumentSheetProps = {
  children: ReactNode
  /** Optional max width in px (defaults to A4 width at 96dpi ≈ 794px). */
  width?: number
}

export const DocumentSheet = forwardRef<HTMLDivElement, DocumentSheetProps>(
  function DocumentSheet({ children, width = 794 }, ref) {
    return (
      <div
        ref={ref}
        dir="rtl"
        style={{
          width,
          maxWidth: "100%",
          margin: "0 auto",
          background: "#ffffff",
          color: "#111827",
          padding: 40,
          boxSizing: "border-box",
          fontFamily:
            "'Segoe UI', Tahoma, 'Noto Sans Arabic', Arial, sans-serif",
          fontSize: 13,
          lineHeight: 1.7,
        }}
      >
        {children}
      </div>
    )
  }
)

export default DocumentSheet
