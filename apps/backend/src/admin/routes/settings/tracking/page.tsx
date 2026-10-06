/**
 * Ad tracking admin settings page.
 *
 * Lets an administrator view and edit the public tracking identifiers (GTM /
 * Meta Pixel / GA4), which are stored in the database (`store.metadata.tracking`)
 * and served to the storefront and server-side dispatchers at runtime. Secret
 * credentials (Meta CAPI access token, GA4 API secret) live only in environment
 * variables and are shown here as a read-only "configured?" status — never
 * their value.
 *
 * Talks only to `GET/POST /admin/tracking-config`. Gated by `tracking:read` /
 * `tracking:write` (also enforced by the RBAC middleware). Shows in-progress and
 * error states, and never mutates displayed values on a failed save.
 */

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Switch,
  Text,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { adminFetch } from "../../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../../lib/use-my-permissions"

type TrackingConfig = {
  enabled: boolean
  gtm_id: string
  meta_pixel_id: string
  meta_api_version: string
  meta_test_event_code: string
  ga4_measurement_id: string
}

type SecretStatus = {
  meta_capi_access_token: boolean
  ga4_api_secret: boolean
}

type TrackingResponse = { config: TrackingConfig; secrets: SecretStatus }

const QUERY_KEY = ["admin", "tracking-config"] as const

const SecretBadge = ({ ok }: { ok: boolean }) => (
  <Badge size="small" color={ok ? "green" : "grey"}>
    {ok ? "مضبوط ✓" : "غير مضبوط"}
  </Badge>
)

const TrackingSettingsPage = () => {
  const queryClient = useQueryClient()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const allowed = can("tracking:read")
  const canWrite = can("tracking:write")

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => adminFetch<TrackingResponse>("/admin/tracking-config"),
    enabled: allowed,
  })

  const [form, setForm] = useState<TrackingConfig | null>(null)

  // Sync editable form from the server config on (re)load. After a failed save
  // the server config is unchanged, so displayed values are preserved.
  useEffect(() => {
    if (data?.config) {
      setForm(data.config)
    }
  }, [data])

  const mutation = useMutation({
    mutationFn: (payload: TrackingConfig) =>
      adminFetch<TrackingResponse>("/admin/tracking-config", {
        method: "POST",
        body: payload,
      }),
    onSuccess: (res) => {
      queryClient.setQueryData(QUERY_KEY, res)
    },
  })

  if (!allowed) {
    return (
      <Container className="p-6">
        <Heading level="h1">تتبّع الإعلانات</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          لا تملك صلاحية عرض إعدادات التتبّع.
        </Text>
      </Container>
    )
  }

  const set = (key: keyof TrackingConfig, value: string | boolean) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev))

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">تتبّع الإعلانات (Meta + Google)</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              المعرّفات العامة تُحفظ في قاعدة البيانات وتُطبّق فوراً. المفاتيح
              السرية تبقى في متغيّرات البيئة (env) وتظهر هنا كحالة فقط.
            </Text>
          </div>
          <Badge
            size="small"
            color={form?.enabled ? "green" : "grey"}
          >
            {form?.enabled ? "مُفعّل" : "معطّل"}
          </Badge>
        </div>

        {isError && (
          <div className="px-6 py-4">
            <Text className="text-ui-fg-error" size="small">
              تعذّر تحميل الإعدادات: {(error as Error)?.message}
            </Text>
          </div>
        )}

        {isLoading || !form ? (
          <div className="px-6 py-4">
            <Text className="text-ui-fg-subtle" size="small">
              جارٍ التحميل…
            </Text>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-x-4 px-6 py-4">
              <div>
                <Label size="small" weight="plus">
                  تفعيل التتبّع
                </Label>
                <Text size="xsmall" className="text-ui-fg-muted">
                  مفتاح رئيسي لإيقاف/تشغيل كل التتبّع (عميل وخادم).
                </Text>
              </div>
              <Switch
                checked={form.enabled}
                disabled={!canWrite || mutation.isPending}
                onCheckedChange={(v) => set("enabled", v)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-2">
              <Field
                label="معرّف Google Tag Manager"
                placeholder="GTM-XXXXXXX"
                value={form.gtm_id}
                disabled={!canWrite || mutation.isPending}
                onChange={(v) => set("gtm_id", v)}
                hint="يُحقن في الستورفرونت ويُدير وسوم Meta Pixel و GA4."
              />
              <Field
                label="معرّف GA4 (Measurement ID)"
                placeholder="G-XXXXXXXXXX"
                value={form.ga4_measurement_id}
                disabled={!canWrite || mutation.isPending}
                onChange={(v) => set("ga4_measurement_id", v)}
                hint="يُستخدم لإرسال أحداث الشراء من الخادم (GA4 MP)."
              />
              <Field
                label="معرّف Meta Pixel"
                placeholder="1234567890"
                value={form.meta_pixel_id}
                disabled={!canWrite || mutation.isPending}
                onChange={(v) => set("meta_pixel_id", v)}
                hint="يُستخدم لإرسال أحداث الشراء من الخادم (Conversions API)."
              />
              <Field
                label="إصدار Meta Graph API"
                placeholder="v19.0"
                value={form.meta_api_version}
                disabled={!canWrite || mutation.isPending}
                onChange={(v) => set("meta_api_version", v)}
              />
              <Field
                label="رمز حدث الاختبار لميتا (اختياري)"
                placeholder="TEST12345"
                value={form.meta_test_event_code}
                disabled={!canWrite || mutation.isPending}
                onChange={(v) => set("meta_test_event_code", v)}
                hint="لتبويب Test events في Events Manager فقط."
              />
            </div>

            {/* Secret status (env-managed) */}
            <div className="px-6 py-4">
              <Heading level="h2" className="text-ui-fg-base mb-2">
                المفاتيح السرية (env)
              </Heading>
              <div className="flex flex-col gap-y-2">
                <div className="flex items-center justify-between">
                  <Text size="small">Meta CAPI Access Token</Text>
                  <SecretBadge ok={data?.secrets.meta_capi_access_token ?? false} />
                </div>
                <div className="flex items-center justify-between">
                  <Text size="small">GA4 API Secret</Text>
                  <SecretBadge ok={data?.secrets.ga4_api_secret ?? false} />
                </div>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted mt-2 block">
                تُضبط في ملف <code>apps/backend/.env</code>:{" "}
                <code>META_CAPI_ACCESS_TOKEN</code> و <code>GA4_API_SECRET</code>.
                إرسال الخادم لا يعمل ما لم تُضبط.
              </Text>
            </div>

            <div className="flex items-center justify-between gap-x-4 px-6 py-4">
              <div>
                {mutation.isError && (
                  <Text className="text-ui-fg-error" size="small">
                    تعذّر الحفظ: {(mutation.error as Error)?.message}
                  </Text>
                )}
                {mutation.isSuccess && !mutation.isPending && (
                  <Text className="text-ui-fg-subtle" size="small">
                    تم الحفظ.
                  </Text>
                )}
              </div>
              <Button
                variant="primary"
                isLoading={mutation.isPending}
                disabled={!canWrite || mutation.isPending}
                onClick={() => mutation.mutate(form)}
              >
                حفظ
              </Button>
            </div>
          </>
        )}
      </Container>
    </div>
  )
}

const Field = ({
  label,
  value,
  placeholder,
  hint,
  disabled,
  onChange,
}: {
  label: string
  value: string
  placeholder?: string
  hint?: string
  disabled?: boolean
  onChange: (v: string) => void
}) => (
  <div className="flex flex-col gap-y-1">
    <Label size="small" weight="plus">
      {label}
    </Label>
    <Input
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
    {hint && (
      <Text size="xsmall" className="text-ui-fg-muted">
        {hint}
      </Text>
    )}
  </div>
)

export const config = defineRouteConfig({
  label: "تتبّع الإعلانات",
  icon: ChartBar,
})

export default TrackingSettingsPage
