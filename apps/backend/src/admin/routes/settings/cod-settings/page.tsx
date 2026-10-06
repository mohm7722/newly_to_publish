import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import {
  Button,
  Checkbox,
  Container,
  Heading,
  Label,
  Switch,
  Text,
  Textarea,
  toast,
} from "@medusajs/ui"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { adminFetch } from "../../../lib/admin-fetch"

/**
 * Cash-on-Delivery (COD) settings page (Requirements 6.3, 6.4, 6.5, 6.6, 6.7).
 *
 * Wired to:
 *  - `GET  /admin/payments/cod-settings`  (read singleton settings)
 *  - `POST /admin/payments/cod-settings`  (upsert singleton settings)
 *  - `GET  /admin/shipping-cities`        (resolve city restriction options)
 *
 * Saving shows a pending state (Requirement 6.6); on failure the error is
 * surfaced and the form keeps the last successfully loaded values — the query
 * cache is only refreshed on success (Requirement 6.7).
 */

type CodSettings = {
  id?: string
  enabled: boolean
  instructions: string | null
  selected_city_ids: string[] | null
}

type ShippingCity = {
  id: string
  city: string
  is_active: boolean
}

type CodForm = {
  enabled: boolean
  instructions: string
  selected_city_ids: string[]
}

const COD_QUERY_KEY = ["admin", "payments", "cod-settings"] as const
const CITIES_QUERY_KEY = ["admin", "shipping-cities"] as const

const CodSettingsPage = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const [form, setForm] = useState<CodForm>({
    enabled: false,
    instructions: "",
    selected_city_ids: [],
  })

  const codQuery = useQuery({
    queryKey: COD_QUERY_KEY,
    queryFn: () =>
      adminFetch<{ cod_settings: CodSettings }>(
        "/admin/payments/cod-settings"
      ),
  })

  const citiesQuery = useQuery({
    queryKey: CITIES_QUERY_KEY,
    queryFn: () =>
      adminFetch<{ ok: boolean; items: ShippingCity[] }>(
        "/admin/shipping-cities"
      ),
  })

  // Seed the form from the loaded settings (last known-good values).
  useEffect(() => {
    const settings = codQuery.data?.cod_settings
    if (settings) {
      setForm({
        enabled: Boolean(settings.enabled),
        instructions: settings.instructions ?? "",
        selected_city_ids: settings.selected_city_ids ?? [],
      })
    }
  }, [codQuery.data])

  const saveMutation = useMutation({
    mutationFn: (input: CodForm) =>
      adminFetch<{ cod_settings: CodSettings }>(
        "/admin/payments/cod-settings",
        {
          method: "POST",
          body: {
            enabled: input.enabled,
            instructions:
              input.instructions.trim().length > 0
                ? input.instructions
                : undefined,
            selected_city_ids: input.selected_city_ids,
          },
        }
      ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: COD_QUERY_KEY })
      toast.success(t("custom.cod.savedToast"))
    },
    onError: (err: Error) => {
      // Keep the displayed form values unchanged (Req 6.7).
      toast.error(t("custom.cod.saveErrorToast"), {
        description: err.message,
      })
    },
  })

  const toggleCity = (cityId: string, checked: boolean) =>
    setForm((prev) => ({
      ...prev,
      selected_city_ids: checked
        ? [...prev.selected_city_ids, cityId]
        : prev.selected_city_ids.filter((id) => id !== cityId),
    }))

  const cities = citiesQuery.data?.items ?? []

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">{t("custom.cod.title")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("custom.cod.subtitle")}
          </Text>
        </div>
        <Button
          variant="primary"
          isLoading={saveMutation.isPending}
          disabled={codQuery.isLoading}
          onClick={() => saveMutation.mutate(form)}
        >
          {t("custom.common.save")}
        </Button>
      </div>

      {codQuery.isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">{t("custom.cod.loading")}</Text>
        </div>
      )}

      {codQuery.isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            {t("custom.cod.loadError", {
              message: (codQuery.error as Error)?.message,
            })}
          </Text>
        </div>
      )}

      {!codQuery.isLoading && !codQuery.isError && (
        <div className="flex flex-col gap-y-8 px-6 py-6">
          <div className="flex items-center gap-x-2">
            <Switch
              id="cod_enabled"
              checked={form.enabled}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, enabled: checked }))
              }
            />
            <Label htmlFor="cod_enabled">{t("custom.cod.enable")}</Label>
          </div>

          <div className="flex max-w-lg flex-col gap-y-2">
            <Label htmlFor="cod_instructions">{t("custom.cod.instructions")}</Label>
            <Textarea
              id="cod_instructions"
              value={form.instructions}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  instructions: e.target.value,
                }))
              }
              placeholder={t("custom.cod.instructionsPlaceholder")}
            />
          </div>

          <div className="flex flex-col gap-y-3">
            <div>
              <Label>{t("custom.cod.cityRestriction")}</Label>
              <Text className="text-ui-fg-subtle" size="small">
                {t("custom.cod.cityRestrictionHelp")}
              </Text>
            </div>

            {citiesQuery.isLoading && (
              <Text className="text-ui-fg-subtle" size="small">
                {t("custom.cod.loadingCities")}
              </Text>
            )}

            {citiesQuery.isError && (
              <Text className="text-ui-fg-error" size="small">
                {t("custom.cod.citiesError", {
                  message: (citiesQuery.error as Error)?.message,
                })}
              </Text>
            )}

            {!citiesQuery.isLoading &&
              !citiesQuery.isError &&
              cities.length === 0 && (
                <Text className="text-ui-fg-subtle" size="small">
                  {t("custom.cod.noCities")}
                </Text>
              )}

            {cities.length > 0 && (
              <div className="grid max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                {cities.map((city) => (
                  <div
                    key={city.id}
                    className="flex items-center gap-x-2"
                  >
                    <Checkbox
                      id={`city_${city.id}`}
                      checked={form.selected_city_ids.includes(city.id)}
                      onCheckedChange={(checked) =>
                        toggleCity(city.id, checked === true)
                      }
                    />
                    <Label htmlFor={`city_${city.id}`} weight="plus">
                      {city.city}
                      {!city.is_active ? t("custom.common.inactiveSuffix") : ""}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "custom.cod.label",
  translationNs: "translation",
  icon: CurrencyDollar,
})

export default CodSettingsPage
