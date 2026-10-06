/**
 * Lightweight, dependency-free chart primitives for the analytics dashboard.
 *
 * Built with plain SVG/CSS and `@medusajs/ui` tokens so they inherit the admin
 * theme and add no new bundle dependency. All components are presentational and
 * RTL-aware (labels in Arabic; numeric chart internals render left-to-right,
 * the conventional reading direction for time series and bars).
 */
import { Heading, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

/** A palette of theme-friendly colors reused across charts. */
export const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
]

/** A single KPI card: a label, a prominent value, and an optional sub-line. */
export function KpiCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  accent?: string
}) {
  return (
    <div className="border-ui-border-base bg-ui-bg-subtle rounded-lg border p-4">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <div
        className="mt-1 text-2xl font-semibold"
        style={accent ? { color: accent } : undefined}
      >
        {value}
      </div>
      {sub != null && (
        <Text size="xsmall" className="text-ui-fg-muted mt-1 block">
          {sub}
        </Text>
      )}
    </div>
  )
}

/** A titled card wrapper for a chart or block. */
export function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="border-ui-border-base rounded-lg border p-4">
      <Heading level="h3" className="text-ui-fg-base">
        {title}
      </Heading>
      {description && (
        <Text size="small" className="text-ui-fg-subtle mb-3 block">
          {description}
        </Text>
      )}
      <div className="mt-3">{children}</div>
    </div>
  )
}

export type BarDatum = { label: string; value: number; hint?: string }

/**
 * Horizontal bars sized by value share (CSS widths). RTL-friendly: the label
 * sits at the start, the value at the end, and the bar fills proportionally.
 */
export function HBars({
  data,
  formatValue,
  emptyText = "لا توجد بيانات",
}: {
  data: BarDatum[]
  formatValue?: (v: number) => string
  emptyText?: string
}) {
  if (!data.length) {
    return <Text className="text-ui-fg-subtle">{emptyText}</Text>
  }
  const max = Math.max(...data.map((d) => d.value), 0) || 1
  const fmt = formatValue ?? ((v: number) => String(v))

  return (
    <div className="flex flex-col gap-y-3">
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} className="flex flex-col gap-y-1">
          <div className="flex items-center justify-between gap-x-2">
            <Text size="small" className="text-ui-fg-base truncate" title={d.label}>
              {d.label}
            </Text>
            <Text size="small" className="text-ui-fg-subtle whitespace-nowrap">
              {d.hint ?? fmt(d.value)}
            </Text>
          </div>
          <div className="bg-ui-bg-base h-2 w-full overflow-hidden rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%`,
                backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export type DonutDatum = { label: string; value: number; color?: string }

/** A donut chart with an inline legend. */
export function Donut({
  data,
  formatValue,
  centerLabel,
}: {
  data: DonutDatum[]
  formatValue?: (v: number) => string
  centerLabel?: string
}) {
  const total = data.reduce((s, d) => s + Math.max(d.value, 0), 0)
  const fmt = formatValue ?? ((v: number) => String(v))
  const radius = 60
  const stroke = 22
  const circumference = 2 * Math.PI * radius

  if (total <= 0) {
    return <Text className="text-ui-fg-subtle">لا توجد بيانات</Text>
  }

  let offset = 0
  const segments = data
    .filter((d) => d.value > 0)
    .map((d, i) => {
      const fraction = d.value / total
      const dash = fraction * circumference
      const seg = {
        color: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
        dasharray: `${dash} ${circumference - dash}`,
        dashoffset: -offset,
      }
      offset += dash
      return seg
    })

  return (
    <div className="flex flex-wrap items-center gap-6" dir="ltr">
      <svg width={160} height={160} viewBox="0 0 160 160">
        <g transform="translate(80,80) rotate(-90)">
          <circle
            r={radius}
            fill="none"
            stroke="var(--bg-base, #e5e7eb)"
            strokeWidth={stroke}
            opacity={0.25}
          />
          {segments.map((s, i) => (
            <circle
              key={i}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={stroke}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
            />
          ))}
        </g>
        {centerLabel && (
          <text
            x="80"
            y="84"
            textAnchor="middle"
            className="fill-ui-fg-base"
            style={{ fontSize: 14, fontWeight: 600 }}
          >
            {centerLabel}
          </text>
        )}
      </svg>
      <div className="flex flex-col gap-y-2" dir="rtl">
        {data
          .filter((d) => d.value > 0)
          .map((d, i) => (
            <div key={`${d.label}-${i}`} className="flex items-center gap-x-2">
              <span
                className="inline-block h-3 w-3 rounded-sm"
                style={{
                  backgroundColor: d.color ?? CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              <Text size="small" className="text-ui-fg-base">
                {d.label}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {fmt(d.value)} ({Math.round((d.value / total) * 100)}%)
              </Text>
            </div>
          ))}
      </div>
    </div>
  )
}

export type TrendPoint = { label: string; bars: number; line: number }

/**
 * A combined trend chart: vertical bars (e.g. order counts) with an overlaid
 * line (e.g. SAR-normalized revenue), sharing an x-axis of time buckets.
 */
export function TrendChart({
  points,
  barLabel,
  lineLabel,
  formatLine,
}: {
  points: TrendPoint[]
  barLabel: string
  lineLabel: string
  formatLine?: (v: number) => string
}) {
  if (!points.length) {
    return <Text className="text-ui-fg-subtle">لا توجد بيانات</Text>
  }

  const width = 760
  const height = 240
  const padX = 40
  const padY = 24
  const plotW = width - padX * 2
  const plotH = height - padY * 2

  const maxBar = Math.max(...points.map((p) => p.bars), 1)
  const maxLine = Math.max(...points.map((p) => p.line), 1)
  const n = points.length
  const slot = plotW / n
  const barW = Math.max(Math.min(slot * 0.6, 40), 2)
  const fmtLine = formatLine ?? ((v: number) => String(v))

  const x = (i: number) => padX + slot * i + slot / 2
  const yBar = (v: number) => padY + plotH - (v / maxBar) * plotH
  const yLine = (v: number) => padY + plotH - (v / maxLine) * plotH

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${yLine(p.line).toFixed(1)}`)
    .join(" ")

  // Show at most ~12 x-axis labels to avoid clutter.
  const labelStep = Math.ceil(n / 12)

  return (
    <div className="overflow-x-auto" dir="ltr">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* baseline */}
        <line
          x1={padX}
          y1={padY + plotH}
          x2={width - padX}
          y2={padY + plotH}
          stroke="currentColor"
          className="text-ui-border-base"
          strokeWidth={1}
        />
        {/* bars */}
        {points.map((p, i) => (
          <rect
            key={`bar-${i}`}
            x={x(i) - barW / 2}
            y={yBar(p.bars)}
            width={barW}
            height={padY + plotH - yBar(p.bars)}
            rx={2}
            fill={CHART_COLORS[0]}
            opacity={0.75}
          >
            <title>{`${p.label}\n${barLabel}: ${p.bars}\n${lineLabel}: ${fmtLine(p.line)}`}</title>
          </rect>
        ))}
        {/* line */}
        <path d={linePath} fill="none" stroke={CHART_COLORS[1]} strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={`pt-${i}`} cx={x(i)} cy={yLine(p.line)} r={2.5} fill={CHART_COLORS[1]} />
        ))}
        {/* x labels */}
        {points.map((p, i) =>
          i % labelStep === 0 ? (
            <text
              key={`lbl-${i}`}
              x={x(i)}
              y={height - 4}
              textAnchor="middle"
              className="fill-ui-fg-muted"
              style={{ fontSize: 9 }}
            >
              {p.label}
            </text>
          ) : null
        )}
      </svg>
      <div className="mt-2 flex items-center gap-x-4" dir="rtl">
        <span className="flex items-center gap-x-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[0] }} />
          <Text size="xsmall" className="text-ui-fg-subtle">{barLabel}</Text>
        </span>
        <span className="flex items-center gap-x-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[1] }} />
          <Text size="xsmall" className="text-ui-fg-subtle">{lineLabel}</Text>
        </span>
      </div>
    </div>
  )
}
