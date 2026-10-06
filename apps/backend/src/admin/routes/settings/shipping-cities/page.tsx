import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MapPin } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Switch,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { adminFetch } from "../../../lib/admin-fetch"

/**
 * Shipping cities management page (Requirements 6.3, 6.4, 6.5, 6.6, 6.7).
 *
 * Wired to:
 *  - `GET    /admin/shipping-cities`          (list)
 *  - `POST   /admin/shipping-cities`          (create / upsert by name)
 *  - `PUT    /admin/shipping-cities/[city]`   (full update, incl. rename)
 *  - `PATCH  /admin/shipping-cities/[city]`   (toggle active)
 *  - `DELETE /admin/shipping-cities/[city]`   (delete by name)
 *
 * Mutating actions show a pending state (Requirement 6.6); failures surface the
 * server error message and leave the displayed list unchanged — the cache is
 * only refreshed on success (Requirement 6.7).
 */

type ShippingCity = {
  id: string
  city: string
  delivery_price: number | string
  is_active: boolean
}

type CityForm = {
  city: string
  delivery_price: string
  is_active: boolean
}

const EMPTY_FORM: CityForm = {
  city: "",
  delivery_price: "",
  is_active: true,
}

const QUERY_KEY = ["admin", "shipping-cities"] as const

/** Coerce a stored delivery price (number or numeric string) to a number. */
function toPrice(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : 0
}

const ShippingCitiesPage = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const [editor, setEditor] = useState<{
    open: boolean
    editing: ShippingCity | null
    form: CityForm
  }>({ open: false, editing: null, form: EMPTY_FORM })

  const [deleteTarget, setDeleteTarget] = useState<ShippingCity | null>(null)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      adminFetch<{ ok: boolean; items: ShippingCity[] }>(
        "/admin/shipping-cities"
      ),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const saveMutation = useMutation({
    mutationFn: async (form: CityForm) => {
      const price = Number(form.delivery_price)
      const payload = {
        city: form.city,
        delivery_price: price,
        is_active: form.is_active,
      }

      if (editor.editing) {
        // PUT supports rename + price + active in one update.
        return adminFetch(
          `/admin/shipping-cities/${encodeURIComponent(
            editor.editing.city
          )}`,
          { method: "PUT", body: payload }
        )
      }
      return adminFetch("/admin/shipping-cities", {
        method: "POST",
        body: payload,
      })
    },
    onSuccess: async () => {
      await refresh()
      toast.success(
        editor.editing
          ? t("custom.shippingCities.updatedToast")
          : t("custom.shippingCities.createdToast")
      )
      setEditor({ open: false, editing: null, form: EMPTY_FORM })
    },
    onError: (err: Error) => {
      toast.error(t("custom.shippingCities.saveErrorToast"), {
        description: err.message,
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (city: ShippingCity) =>
      adminFetch(
        `/admin/shipping-cities/${encodeURIComponent(city.city)}`,
        { method: "PATCH", body: { is_active: !city.is_active } }
      ),
    onSuccess: async () => {
      await refresh()
      toast.success(t("custom.shippingCities.updatedToast"))
    },
    onError: (err: Error) => {
      toast.error(t("custom.shippingCities.toggleErrorToast"), {
        description: err.message,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (city: ShippingCity) =>
      adminFetch(
        `/admin/shipping-cities/${encodeURIComponent(city.city)}`,
        { method: "DELETE" }
      ),
    onSuccess: async () => {
      await refresh()
      toast.success(t("custom.shippingCities.deletedToast"))
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error(t("custom.shippingCities.deleteErrorToast"), {
        description: err.message,
      })
      setDeleteTarget(null)
    },
  })

  const openCreate = () =>
    setEditor({ open: true, editing: null, form: EMPTY_FORM })

  const openEdit = (city: ShippingCity) =>
    setEditor({
      open: true,
      editing: city,
      form: {
        city: city.city,
        delivery_price: String(toPrice(city.delivery_price)),
        is_active: city.is_active,
      },
    })

  const setForm = (partial: Partial<CityForm>) =>
    setEditor((prev) => ({ ...prev, form: { ...prev.form, ...partial } }))

  const cities = data?.items ?? []
  const priceNumber = Number(editor.form.delivery_price)
  const formValid =
    editor.form.city.trim().length > 0 &&
    editor.form.delivery_price.trim().length > 0 &&
    Number.isFinite(priceNumber) &&
    priceNumber >= 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">{t("custom.shippingCities.title")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("custom.shippingCities.subtitle")}
          </Text>
        </div>
        <Button variant="primary" onClick={openCreate}>
          {t("custom.shippingCities.add")}
        </Button>
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">
            {t("custom.shippingCities.loading")}
          </Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            {t("custom.shippingCities.loadError", {
              message: (error as Error)?.message,
            })}
          </Text>
        </div>
      )}

      {!isLoading && !isError && cities.length === 0 && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">
            {t("custom.shippingCities.empty")}
          </Text>
        </div>
      )}

      {!isLoading && !isError && cities.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t("custom.shippingCities.colCity")}</Table.HeaderCell>
              <Table.HeaderCell>
                {t("custom.shippingCities.colDeliveryPrice")}
              </Table.HeaderCell>
              <Table.HeaderCell>{t("custom.common.status")}</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                {t("custom.common.actions")}
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {cities.map((city) => (
              <Table.Row key={city.id}>
                <Table.Cell>{city.city}</Table.Cell>
                <Table.Cell>
                  {toPrice(city.delivery_price).toFixed(2)}
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    color={city.is_active ? "green" : "grey"}
                    size="small"
                  >
                    {city.is_active
                      ? t("custom.common.active")
                      : t("custom.common.inactive")}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="secondary"
                      size="small"
                      isLoading={
                        toggleMutation.isPending &&
                        toggleMutation.variables?.id === city.id
                      }
                      onClick={() => toggleMutation.mutate(city)}
                    >
                      {city.is_active
                        ? t("custom.common.deactivate")
                        : t("custom.common.activate")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => openEdit(city)}
                    >
                      {t("custom.common.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => setDeleteTarget(city)}
                    >
                      {t("custom.common.delete")}
                    </Button>
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <FocusModal
        open={editor.open}
        onOpenChange={(open) => setEditor((prev) => ({ ...prev, open }))}
      >
        <FocusModal.Content>
          <FocusModal.Header>
            <Button
              variant="primary"
              disabled={!formValid}
              isLoading={saveMutation.isPending}
              onClick={() => saveMutation.mutate(editor.form)}
            >
              {t("custom.common.save")}
            </Button>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col items-center overflow-y-auto py-8">
            <div className="flex w-full max-w-lg flex-col gap-y-6">
              <Heading level="h2">
                {editor.editing
                  ? t("custom.shippingCities.editTitle")
                  : t("custom.shippingCities.addTitle")}
              </Heading>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="city">{t("custom.shippingCities.cityName")}</Label>
                <Input
                  id="city"
                  value={editor.form.city}
                  onChange={(e) => setForm({ city: e.target.value })}
                  placeholder={t("custom.shippingCities.cityNamePlaceholder")}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="delivery_price">
                  {t("custom.shippingCities.deliveryPrice")}
                </Label>
                <Input
                  id="delivery_price"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editor.form.delivery_price}
                  onChange={(e) =>
                    setForm({ delivery_price: e.target.value })
                  }
                  placeholder={t("custom.shippingCities.deliveryPricePlaceholder")}
                />
              </div>

              <div className="flex items-center gap-x-2">
                <Switch
                  id="city_is_active"
                  checked={editor.form.is_active}
                  onCheckedChange={(checked) =>
                    setForm({ is_active: checked })
                  }
                />
                <Label htmlFor="city_is_active">
                  {t("custom.shippingCities.activeLabel")}
                </Label>
              </div>
            </div>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>

      <Prompt
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>{t("custom.shippingCities.deleteTitle")}</Prompt.Title>
            <Prompt.Description>
              {t("custom.shippingCities.deleteConfirm", {
                name: deleteTarget?.city ?? "",
              })}
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>{t("custom.common.cancel")}</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                if (deleteTarget) {
                  deleteMutation.mutate(deleteTarget)
                }
              }}
            >
              {t("custom.common.delete")}
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "custom.shippingCities.label",
  translationNs: "translation",
  icon: MapPin,
})

export default ShippingCitiesPage
