import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { adminFetch } from "../../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../../lib/use-my-permissions"

/**
 * Invoice settings page (Settings → إعدادات الفاتورة).
 *
 * Edits the store/document identity used on printed documents. Reads via
 * `GET /admin/invoice-settings` (invoice_settings.read) and saves via
 * `PUT /admin/invoice-settings` (invoice_settings.write). The logo is uploaded
 * through the core `/admin/uploads` endpoint and stored as a URL.
 */
type InvoiceSettings = {
  store_name: string
  store_name_override: string
  default_store_name: string
  logo_url: string | null
  address: string
  phone: string
  email: string
  website: string
  tax_number: string
  footer_note: string
}

const KEY = ["admin", "invoice-settings"] as const

const InvoiceSettingsPage = () => {
  const queryClient = useQueryClient()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const canRead = can("invoice_settings.read")
  const canWrite = can("invoice_settings.write")

  const [form, setForm] = useState<InvoiceSettings | null>(null)
  const [uploading, setUploading] = useState(false)

  const settingsQuery = useQuery({
    queryKey: KEY,
    queryFn: () =>
      adminFetch<{ invoice_settings: InvoiceSettings }>("/admin/invoice-settings"),
    enabled: canRead,
  })

  useEffect(() => {
    if (settingsQuery.data?.invoice_settings) {
      setForm(settingsQuery.data.invoice_settings)
    }
  }, [settingsQuery.data])

  const saveMutation = useMutation({
    mutationFn: (data: InvoiceSettings) =>
      adminFetch("/admin/invoice-settings", { method: "PUT", body: data }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: KEY })
      toast.success("تم حفظ إعدادات الفاتورة")
    },
    onError: (err: Error) =>
      toast.error("تعذّر الحفظ", { description: err.message }),
  })

  const set = (partial: Partial<InvoiceSettings>) =>
    setForm((prev) => (prev ? { ...prev, ...partial } : prev))

  const uploadLogo = async (file: File) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("files", file)
      const res = await fetch("/admin/uploads", {
        method: "POST",
        credentials: "include",
        body: fd,
      })
      if (!res.ok) {
        throw new Error(`فشل الرفع (${res.status})`)
      }
      const json = await res.json()
      const url = json?.files?.[0]?.url
      if (url) {
        set({ logo_url: url })
        toast.success("تم رفع الشعار")
      }
    } catch (e) {
      toast.error("تعذّر رفع الشعار", { description: (e as Error).message })
    } finally {
      setUploading(false)
    }
  }

  if (!canRead) {
    return (
      <Container className="p-6">
        <Heading level="h1">إعدادات الفاتورة</Heading>
        <Text className="text-ui-fg-subtle mt-2">لا تملك صلاحية عرض هذه الصفحة.</Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">بيانات النشاط التجاري</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            هوية النشاط التجاري المستخدمة على الفواتير والمستندات المطبوعة
          </Text>
        </div>
        <Button
          variant="primary"
          disabled={!form || !canWrite || saveMutation.isPending}
          isLoading={saveMutation.isPending}
          onClick={() => form && saveMutation.mutate(form)}
        >
          حفظ
        </Button>
      </div>

      {!form ? (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ التحميل…</Text>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 px-6 py-6 md:grid-cols-2">
          <Field label="اسم المتجر على المستندات (اختياري)">
            <Input
              value={form.store_name_override}
              placeholder={form.default_store_name}
              onChange={(e) => set({ store_name_override: e.target.value })}
            />
            <Text size="xsmall" className="text-ui-fg-subtle">
              يُترك فارغاً لاستخدام اسم المتجر الأساسي: {form.default_store_name}
            </Text>
          </Field>
          <Field label="الرقم الضريبي">
            <Input value={form.tax_number} onChange={(e) => set({ tax_number: e.target.value })} />
          </Field>
          <Field label="العنوان">
            <Input value={form.address} onChange={(e) => set({ address: e.target.value })} />
          </Field>
          <Field label="الهاتف">
            <Input value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
          </Field>
          <Field label="البريد الإلكتروني">
            <Input value={form.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <Field label="الموقع الإلكتروني">
            <Input value={form.website} onChange={(e) => set({ website: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <Field label="رسالة التذييل (شكر/شروط)">
              <Textarea value={form.footer_note} onChange={(e) => set({ footer_note: e.target.value })} />
            </Field>
          </div>
          <div className="md:col-span-2 flex flex-col gap-y-2">
            <Label size="small">الشعار</Label>
            <div className="flex items-center gap-4">
              {form.logo_url && (
                // eslint-disable-next-line jsx-a11y/alt-text
                <img src={form.logo_url} alt="logo" style={{ maxHeight: 60, maxWidth: 140, objectFit: "contain" }} />
              )}
              <input
                type="file"
                accept="image/*"
                disabled={!canWrite || uploading}
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) uploadLogo(f)
                }}
              />
              {form.logo_url && (
                <Button variant="secondary" size="small" disabled={!canWrite} onClick={() => set({ logo_url: null })}>
                  إزالة
                </Button>
              )}
            </div>
            <Input
              placeholder="أو الصق رابط الشعار"
              value={form.logo_url ?? ""}
              onChange={(e) => set({ logo_url: e.target.value || null })}
            />
          </div>
        </div>
      )}
    </Container>
  )
}

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-y-1">
    <Label size="small">{label}</Label>
    {children}
  </div>
)

export const config = defineRouteConfig({
  label: "بيانات النشاط التجاري",
  icon: DocumentText,
})

export default InvoiceSettingsPage
