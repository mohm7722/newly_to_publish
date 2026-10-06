import type { InvoiceData } from "../../lib/data/invoices"

/**
 * Order invoice template — presentation only.
 *
 * Renders an order invoice from {@link InvoiceData}. It performs no data
 * fetching and no exporting; it is composed inside a `DocumentSheet` and can be
 * exported by the generic export hook. Keeping it pure makes it reusable for
 * preview, print, and (future) server-side rendering.
 */

function fmt(amount: number, currency: string): string {
  const n = new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(
    amount
  )
  return `${n} ${currency}`
}

function fmtDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(value))
  } catch {
    return value
  }
}

const labelCell: React.CSSProperties = {
  padding: "6px 8px",
  borderBottom: "1px solid #e5e7eb",
  textAlign: "right",
}
const th: React.CSSProperties = {
  padding: "8px",
  background: "#f3f4f6",
  borderBottom: "2px solid #d1d5db",
  textAlign: "right",
  fontWeight: 600,
}

export default function OrderInvoiceTemplate({ data }: { data: InvoiceData }) {
  const { invoice, settings, order, payment, bank_accounts, settlement } = data
  const cur = order.currency_code?.toUpperCase() || ""

  const customerName =
    [order.shipping_address?.first_name, order.shipping_address?.last_name]
      .filter(Boolean)
      .join(" ") ||
    [order.customer?.first_name, order.customer?.last_name]
      .filter(Boolean)
      .join(" ") ||
    "—"

  const addr = order.shipping_address
  const addressLine = [
    addr?.address_1,
    addr?.address_2,
    addr?.city,
    addr?.province,
    addr?.postal_code,
  ]
    .filter(Boolean)
    .join("، ")

  return (
    <div>
      {/* Header: store identity + logo */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #111827",
          paddingBottom: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            {settings.store_name}
          </div>
          {settings.address && <div>{settings.address}</div>}
          {settings.phone && <div>هاتف: {settings.phone}</div>}
          {settings.email && <div>بريد: {settings.email}</div>}
          {settings.website && <div>{settings.website}</div>}
          {settings.tax_number && (
            <div>الرقم الضريبي: {settings.tax_number}</div>
          )}
        </div>
        {settings.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logo_url}
            alt="logo"
            crossOrigin="anonymous"
            style={{ maxHeight: 80, maxWidth: 160, objectFit: "contain" }}
          />
        )}
      </div>

      {/* Invoice meta */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            فاتورة
          </div>
          <div>رقم الفاتورة: {invoice.number}</div>
          <div>رقم الطلب: #{order.display_id}</div>
        </div>
        <div style={{ textAlign: "left" }}>
          <div>تاريخ الإصدار: {fmtDate(invoice.issued_at)}</div>
          <div>تاريخ الطلب: {fmtDate(order.created_at)}</div>
        </div>
      </div>

      {/* Customer + shipping */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4 }}>بيانات العميل</div>
        <div>الاسم: {customerName}</div>
        {order.email && <div>البريد: {order.email}</div>}
        {(addr?.phone || order.customer?.phone) && (
          <div>الهاتف: {addr?.phone || order.customer?.phone}</div>
        )}
        {addressLine && <div>عنوان الشحن: {addressLine}</div>}
      </div>

      {/* Items */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={th}>الصنف</th>
            <th style={{ ...th, textAlign: "center", width: 70 }}>الكمية</th>
            <th style={{ ...th, textAlign: "left", width: 120 }}>سعر الوحدة</th>
            <th style={{ ...th, textAlign: "left", width: 120 }}>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i}>
              <td style={labelCell}>
                {it.title}
                {it.variant_title ? ` — ${it.variant_title}` : ""}
              </td>
              <td style={{ ...labelCell, textAlign: "center" }}>
                {it.quantity}
              </td>
              <td style={{ ...labelCell, textAlign: "left" }}>
                {fmt(it.unit_price, cur)}
              </td>
              <td style={{ ...labelCell, textAlign: "left" }}>
                {fmt(it.total, cur)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-start" }}>
        <table style={{ width: 320, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={labelCell}>المجموع الفرعي</td>
              <td style={{ ...labelCell, textAlign: "left" }}>
                {fmt(order.totals.subtotal, cur)}
              </td>
            </tr>
            <tr>
              <td style={labelCell}>الشحن</td>
              <td style={{ ...labelCell, textAlign: "left" }}>
                {fmt(order.totals.shipping_total, cur)}
              </td>
            </tr>
            {order.totals.discount_total > 0 && (
              <tr>
                <td style={labelCell}>الخصم</td>
                <td style={{ ...labelCell, textAlign: "left" }}>
                  -{fmt(order.totals.discount_total, cur)}
                </td>
              </tr>
            )}
            {order.totals.tax_total > 0 && (
              <tr>
                <td style={labelCell}>الضريبة</td>
                <td style={{ ...labelCell, textAlign: "left" }}>
                  {fmt(order.totals.tax_total, cur)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ ...labelCell, fontWeight: 700 }}>الإجمالي</td>
              <td
                style={{ ...labelCell, textAlign: "left", fontWeight: 700 }}
              >
                {fmt(order.totals.total, cur)}
              </td>
            </tr>
            {settlement && (
              <>
                <tr>
                  <td style={labelCell}>قيمة التسوية</td>
                  <td style={{ ...labelCell, textAlign: "left" }}>
                    {fmt(settlement.total, settlement.currency_code)}
                  </td>
                </tr>
                <tr>
                  <td style={labelCell}>سعر الصرف</td>
                  <td style={{ ...labelCell, textAlign: "left" }}>
                    1 {settlement.base_currency_code} = {settlement.rate}{" "}
                    {settlement.currency_code}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Payment */}
      <div style={{ marginTop: 16 }}>
        <div>طريقة الدفع: {payment.method_label}</div>
        {payment.status && <div>حالة الدفع: {payment.status}</div>}
      </div>

      {/* Bank accounts (bank transfer only) */}
      {payment.is_bank_transfer && bank_accounts.length > 0 && (
        <div
          style={{
            marginTop: 12,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>
            بيانات الحساب البنكي للتحويل
          </div>
          {bank_accounts.map((b, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {b.bank_name} — {b.account_number} ({b.currency_code})
              {b.instructions ? ` — ${b.instructions}` : ""}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {order.notes && (
        <div style={{ marginTop: 12 }}>
          <span style={{ fontWeight: 600 }}>ملاحظات: </span>
          {order.notes}
        </div>
      )}

      {/* Footer */}
      {settings.footer_note && (
        <div
          style={{
            marginTop: 24,
            paddingTop: 12,
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          {settings.footer_note}
        </div>
      )}
    </div>
  )
}
