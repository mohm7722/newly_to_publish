import type { ReactNode } from "react"

/**
 * Generic list/statement report template — presentation only, reusable for any
 * tabular report (processing orders, customer statements, sales statements, …).
 *
 * Pass a title, optional store header, the column definitions, and the rows.
 * It performs no data fetching or exporting, so it composes inside a
 * `DocumentSheet` and is exported by the generic export hook.
 */
export type ReportColumn = {
  key: string
  label: string
  align?: "right" | "center" | "left"
}

export type ListReportProps = {
  title: string
  /** Optional store/brand name shown in the header. */
  storeName?: string
  /** Optional sub-line (e.g. applied filters summary). */
  subtitle?: string
  generatedAt?: string
  columns: ReportColumn[]
  rows: Record<string, ReactNode>[]
  /** Optional footer (e.g. totals / count). */
  footer?: ReactNode
}

const cell: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #e5e7eb",
}

export default function ListReportTemplate({
  title,
  storeName,
  subtitle,
  generatedAt,
  columns,
  rows,
  footer,
}: ListReportProps) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          borderBottom: "2px solid #111827",
          paddingBottom: 12,
          marginBottom: 12,
        }}
      >
        <div>
          {storeName && (
            <div style={{ fontSize: 16, fontWeight: 700 }}>{storeName}</div>
          )}
          <div style={{ fontSize: 18, fontWeight: 700 }}>{title}</div>
          {subtitle && (
            <div style={{ color: "#6b7280", fontSize: 12 }}>{subtitle}</div>
          )}
        </div>
        <div style={{ textAlign: "left", color: "#6b7280", fontSize: 12 }}>
          {generatedAt && <div>تاريخ الإصدار: {generatedAt}</div>}
          <div>عدد السجلات: {rows.length}</div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                style={{
                  ...cell,
                  background: "#f3f4f6",
                  borderBottom: "2px solid #d1d5db",
                  textAlign: c.align ?? "right",
                  fontWeight: 600,
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td
                  key={c.key}
                  style={{ ...cell, textAlign: c.align ?? "right" }}
                >
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {footer && <div style={{ marginTop: 12 }}>{footer}</div>}
    </div>
  )
}
