import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Table,
  Text,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { adminFetch } from "../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../lib/use-my-permissions"
import { useDocumentExport } from "../../lib/printing/use-document-export"
import DocumentSheet from "../documents/document-sheet"
import ListReportTemplate, {
  type ReportColumn,
} from "../documents/list-report-template"
import { fmtDate } from "./format"

type Opt = { value: string; label: string }

type BaseFilter = {
  key: string
  label: string
  placeholder?: string
  defaultValue?: string
}

export type ReportFilterDef =
  | (BaseFilter & { type: "date" | "text" })
  | (BaseFilter & { type: "select"; options: Opt[] })
  | (BaseFilter & {
      type: "async-select"
      endpoint: string
      mapOptions: (data: any) => Opt[]
    })

export type ReportViewProps<Row = any> = {
  /** On-screen page title + printed report title. */
  title: string
  description?: string
  /** Permission key required to view (checked client-side for UX). */
  permission: string
  /** Base endpoint, e.g. `/admin/reports/sold-products`. */
  endpoint: string
  /** Response key holding the array of rows (default `rows`). */
  dataKey?: string
  filters?: ReportFilterDef[]
  columns: ReportColumn[]
  /** Map a raw row to the cell values keyed by column key (table + PDF). */
  mapRow: (row: Row) => Record<string, ReactNode>
  exportFilename: string
  orientation?: "portrait" | "landscape"
  /** Optional summary block rendered above the table and in the PDF footer. */
  renderSummary?: (data: any, rows: Row[]) => ReactNode
}

function FilterField({
  def,
  value,
  onChange,
  enabled,
}: {
  def: ReportFilterDef
  value: string
  onChange: (v: string) => void
  enabled: boolean
}) {
  const { t } = useTranslation()
  const asyncQuery = useQuery({
    queryKey: ["admin", "report-filter", (def as any).endpoint],
    queryFn: () => adminFetch<any>((def as any).endpoint),
    enabled: enabled && def.type === "async-select",
  })

  if (def.type === "date" || def.type === "text") {
    return (
      <Input
        type={def.type === "date" ? "date" : "text"}
        value={value}
        placeholder={def.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  let options: Opt[] = []
  if (def.type === "select") {
    options = def.options
  } else if (def.type === "async-select") {
    options = asyncQuery.data ? def.mapOptions(asyncQuery.data) : []
  }

  // Radix/Medusa `Select.Item` forbids an empty-string value (it is reserved
  // for clearing the selection). Use a sentinel for the "all" option and map it
  // back to "" so the query treats it as no filter.
  const showAll = def.placeholder !== "__no_all__"

  return (
    <Select
      value={value === "" ? ALL_VALUE : value}
      onValueChange={(v) => onChange(v === ALL_VALUE ? "" : v)}
    >
      <Select.Trigger>
        <Select.Value placeholder={t("custom.reports.common.all")} />
      </Select.Trigger>
      <Select.Content>
        {showAll && (
          <Select.Item value={ALL_VALUE}>
            {t("custom.reports.common.all")}
          </Select.Item>
        )}
        {options.map((o) => (
          <Select.Item key={o.value} value={o.value}>
            {o.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select>
  )
}

/** Sentinel value representing "no filter / all" (empty values are disallowed). */
const ALL_VALUE = "__all__"

export function ReportView<Row = any>({
  title,
  description,
  permission,
  endpoint,
  dataKey = "rows",
  filters = [],
  columns,
  mapRow,
  exportFilename,
  orientation = "landscape",
  renderSummary,
}: ReportViewProps<Row>) {
  const { t } = useTranslation()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const allowed = can(permission)

  const initial = useMemo(() => {
    const o: Record<string, string> = {}
    for (const f of filters) o[f.key] = f.defaultValue ?? ""
    return o
  }, [filters])

  const [draft, setDraft] = useState<Record<string, string>>(initial)
  const [applied, setApplied] = useState<Record<string, string>>(initial)

  const { ref, exporting, exportPdf } = useDocumentExport()

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    Object.entries(applied).forEach(([k, v]) => {
      if (v && v.trim().length > 0) p.set(k, v.trim())
    })
    const s = p.toString()
    return s ? `?${s}` : ""
  }, [applied])

  const reportQuery = useQuery({
    queryKey: ["admin", "reports", endpoint, applied],
    queryFn: () => adminFetch<any>(`${endpoint}${queryString}`),
    enabled: allowed,
  })

  const rows: Row[] = (reportQuery.data?.[dataKey] as Row[]) ?? []
  const cellRows = useMemo(() => rows.map((r) => mapRow(r)), [rows, mapRow])

  const set = (key: string, v: string) =>
    setDraft((prev) => ({ ...prev, [key]: v }))

  if (!allowed) {
    return (
      <Container className="p-6">
        <Heading level="h1">{title}</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          {t("custom.reports.common.noPermission")}
        </Text>
      </Container>
    )
  }

  const summary = renderSummary
    ? renderSummary(reportQuery.data, rows)
    : null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">{title}</Heading>
          {description && (
            <Text size="small" className="text-ui-fg-subtle">
              {description}
            </Text>
          )}
        </div>
        <Button
          variant="primary"
          disabled={exporting || rows.length === 0}
          isLoading={exporting}
          onClick={() => exportPdf({ filename: exportFilename, orientation })}
        >
          {t("custom.reports.common.exportPdf")}
        </Button>
      </div>

      {filters.length > 0 && (
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3 lg:grid-cols-4">
          {filters.map((f) => (
            <div key={f.key} className="flex flex-col gap-y-1">
              <Label size="small">{f.label}</Label>
              <FilterField
                def={f}
                value={draft[f.key] ?? ""}
                onChange={(v) => set(f.key, v)}
                enabled={allowed}
              />
            </div>
          ))}
          <div className="flex items-end gap-2">
            <Button
              variant="primary"
              onClick={() => setApplied({ ...draft })}
              isLoading={reportQuery.isFetching}
            >
              {t("custom.reports.common.search")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(initial)
                setApplied(initial)
              }}
            >
              {t("custom.reports.common.reset")}
            </Button>
          </div>
        </div>
      )}

      {summary && <div className="px-6 py-4">{summary}</div>}

      {reportQuery.isError && (
        <div className="px-6 py-6">
          <Text className="text-ui-fg-error">
            {t("custom.reports.common.loadError", {
              message: (reportQuery.error as Error)?.message,
            })}
          </Text>
        </div>
      )}

      {!reportQuery.isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              {columns.map((c) => (
                <Table.HeaderCell key={c.key}>{c.label}</Table.HeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cellRows.map((row, i) => (
              <Table.Row key={i}>
                {columns.map((c) => (
                  <Table.Cell key={c.key}>{row[c.key]}</Table.Cell>
                ))}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {!reportQuery.isError &&
        rows.length === 0 &&
        !reportQuery.isFetching && (
          <div className="px-6 py-6">
            <Text className="text-ui-fg-subtle">
              {t("custom.reports.common.noData")}
            </Text>
          </div>
        )}

      {/* Off-screen printable report (export target). */}
      <div style={{ position: "absolute", left: -10000, top: 0 }} aria-hidden>
        <div ref={ref}>
          <DocumentSheet width={1100}>
            <ListReportTemplate
              title={title}
              generatedAt={fmtDate(new Date().toISOString())}
              columns={columns}
              rows={cellRows}
              footer={summary ?? undefined}
            />
          </DocumentSheet>
        </div>
      </div>
    </Container>
  )
}

export default ReportView
