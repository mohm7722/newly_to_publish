/**
 * Currencies / FX admin settings page.
 *
 * A Medusa admin settings route (registered via `defineRouteConfig`) that lets
 * an administrator view and edit the store's FX configuration:
 *
 * - the conversion rate for every supported currency pair (units of the quote
 *   currency per 1 SAR), and
 * - the FX feature configuration (which currencies are enabled/offered and the
 *   default currency), from which the FX feature-flag state is derived.
 *
 * It talks only to the existing admin API routes:
 * - `GET/POST /admin/fx/rates`
 * - `GET/POST /admin/currency-config`
 *
 * Behavior (Requirements 6.1, 6.4, 6.5, 6.6, 6.7):
 * - 6.1: displays rates for all supported pairs plus the FX flag state and lets
 *   the administrator edit them.
 * - 6.4: built with the Medusa admin extension APIs (`defineRouteConfig`) and
 *   `@medusajs/ui`.
 * - 6.5: each submission calls the corresponding admin route and reflects the
 *   returned result.
 * - 6.6: every in-flight request shows an in-progress indicator.
 * - 6.7: on failure an operation-specific error is surfaced and the displayed
 *   (server-sourced) values are left unchanged.
 */

import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Switch,
  Text,
  clx,
} from "@medusajs/ui"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

/** Supported currency codes in their canonical underscore form. */
const SUPPORTED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const
type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]

/** The base currency whose rate is always 1 and is not editable. */
const BASE_CURRENCY: CurrencyCode = "SAR"

/** Translation key for a supported currency's human-friendly label. */
function currencyLabelKey(code: CurrencyCode): string {
  return `custom.currencies.${code}`
}

/** Shape returned by `GET /admin/fx/rates`. */
type RatesResponse = Record<string, number>

/** Shape returned by `GET/POST /admin/currency-config`. */
type CurrencyConfig = {
  enabled: string[]
  default: string
}

const RATES_QUERY_KEY = ["admin", "fx", "rates"] as const
const CONFIG_QUERY_KEY = ["admin", "currency-config"] as const

/**
 * Thin fetch wrapper for the admin API. Uses same-origin cookie auth (the admin
 * dashboard session) and throws a descriptive `Error` on non-2xx responses so
 * react-query surfaces it as a mutation/query error.
 */
async function adminFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const text = await res.text()
  const body = text ? (JSON.parse(text) as unknown) : undefined

  if (!res.ok) {
    const message =
      body && typeof body === "object" && "message" in body
        ? String((body as { message: unknown }).message)
        : `Request failed with status ${res.status}`
    throw new Error(message)
  }

  return body as T
}

/** Format a numeric rate for display in an input without trailing noise. */
function formatRate(value: number | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return ""
  }
  return String(value)
}

/** Parse and validate a user-entered rate. Returns `null` when invalid. */
function parseRate(input: string): number | null {
  const trimmed = input.trim()
  if (trimmed === "") {
    return null
  }
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value <= 0) {
    return null
  }
  return value
}

const CurrenciesFxPage = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const ratesQuery = useQuery({
    queryKey: RATES_QUERY_KEY,
    queryFn: () => adminFetch<RatesResponse>("/admin/fx/rates"),
  })

  const configQuery = useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: () => adminFetch<CurrencyConfig>("/admin/currency-config"),
  })

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading level="h1">{t("custom.fx.title")}</Heading>
            <Text className="text-ui-fg-subtle" size="small">
              {t("custom.fx.subtitle")}
            </Text>
          </div>
          <FxFlagBadge
            config={configQuery.data}
            isLoading={configQuery.isLoading}
          />
        </div>
      </Container>

      <RatesCard
        rates={ratesQuery.data}
        isLoading={ratesQuery.isLoading}
        loadError={ratesQuery.error as Error | null}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: RATES_QUERY_KEY })
        }
      />

      <CurrencyConfigCard
        config={configQuery.data}
        isLoading={configQuery.isLoading}
        loadError={configQuery.error as Error | null}
        onSaved={() =>
          queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY })
        }
      />
    </div>
  )
}

/**
 * Derives and displays the FX feature-flag state. FX is considered active when
 * at least one currency is enabled in the currency configuration.
 */
const FxFlagBadge = ({
  config,
  isLoading,
}: {
  config: CurrencyConfig | undefined
  isLoading: boolean
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Badge size="small" color="grey">
        {t("custom.fx.flagLoading")}
      </Badge>
    )
  }

  const active = !!config && config.enabled.length > 0
  return (
    <Badge size="small" color={active ? "green" : "grey"}>
      {active ? t("custom.fx.flagEnabled") : t("custom.fx.flagDisabled")}
    </Badge>
  )
}

/**
 * Editable list of per-currency rates. SAR is the base currency (rate fixed at
 * 1) and is shown read-only; every other supported currency exposes an editable
 * rate with its own save action calling `POST /admin/fx/rates`.
 */
const RatesCard = ({
  rates,
  isLoading,
  loadError,
  onSaved,
}: {
  rates: RatesResponse | undefined
  isLoading: boolean
  loadError: Error | null
  onSaved: () => void
}) => {
  const { t } = useTranslation()

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("custom.fx.ratesTitle")}</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          {t("custom.fx.ratesSubtitle", { base: BASE_CURRENCY })}
        </Text>
      </div>

      {loadError ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-error" size="small">
            {t("custom.fx.ratesLoadError", { message: loadError.message })}
          </Text>
        </div>
      ) : isLoading ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle" size="small">
            {t("custom.fx.ratesLoading")}
          </Text>
        </div>
      ) : (
        SUPPORTED_CURRENCIES.map((code) => (
          <RateRow key={code} code={code} rate={rates?.[code]} onSaved={onSaved} />
        ))
      )}
    </Container>
  )
}

const RateRow = ({
  code,
  rate,
  onSaved,
}: {
  code: CurrencyCode
  rate: number | undefined
  onSaved: () => void
}) => {
  const { t } = useTranslation()
  const isBase = code === BASE_CURRENCY
  const [value, setValue] = useState<string>(
    isBase ? "1" : formatRate(rate)
  )

  // Keep the editable value in sync with the server-sourced rate. On a failed
  // save the server value is unchanged, so the displayed value stays put.
  useEffect(() => {
    if (!isBase) {
      setValue(formatRate(rate))
    }
  }, [rate, isBase])

  const mutation = useMutation({
    mutationFn: async (nextRate: number) =>
      adminFetch<{ quote: string; rate: number }>("/admin/fx/rates", {
        method: "POST",
        body: JSON.stringify({ quote: code, rate: nextRate }),
      }),
    onSuccess: () => {
      onSaved()
    },
  })

  const parsed = parseRate(value)
  const dirty = !isBase && value.trim() !== formatRate(rate)
  const invalid = !isBase && value.trim() !== "" && parsed === null

  return (
    <div className="flex items-end justify-between gap-x-4 px-6 py-4">
      <div className="flex-1">
        <Label size="small" weight="plus" htmlFor={`rate-${code}`}>
          {t(currencyLabelKey(code))}
        </Label>
        <Input
          id={`rate-${code}`}
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          className="mt-1"
          value={value}
          disabled={isBase || mutation.isPending}
          aria-invalid={invalid}
          onChange={(e) => setValue(e.target.value)}
        />
        {isBase ? (
          <Text className="text-ui-fg-muted mt-1" size="xsmall">
            {t("custom.fx.baseHint")}
          </Text>
        ) : invalid ? (
          <Text className="text-ui-fg-error mt-1" size="xsmall">
            {t("custom.fx.rateInvalid")}
          </Text>
        ) : mutation.isError ? (
          <Text className="text-ui-fg-error mt-1" size="xsmall">
            {t("custom.fx.rateSaveError", {
              code,
              message: (mutation.error as Error).message,
            })}
          </Text>
        ) : null}
      </div>

      {!isBase && (
        <Button
          variant="secondary"
          size="small"
          isLoading={mutation.isPending}
          disabled={!dirty || parsed === null || mutation.isPending}
          onClick={() => {
            if (parsed !== null) {
              mutation.mutate(parsed)
            }
          }}
        >
          {t("custom.common.save")}
        </Button>
      )}
    </div>
  )
}

/**
 * Editable currency configuration: which currencies are enabled (the FX flag
 * mechanism) and the default currency. Saves via `POST /admin/currency-config`.
 * Validation mirrors the server route: `enabled` must be non-empty and the
 * default must be one of the enabled currencies.
 */
const CurrencyConfigCard = ({
  config,
  isLoading,
  loadError,
  onSaved,
}: {
  config: CurrencyConfig | undefined
  isLoading: boolean
  loadError: Error | null
  onSaved: () => void
}) => {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState<string[]>([])
  const [defaultCurrency, setDefaultCurrency] = useState<string>("")

  // Reset local edit state from the server config whenever it (re)loads. After
  // a failed save the server config is unchanged, so the displayed values are
  // preserved (Requirement 6.7).
  useEffect(() => {
    if (config) {
      setEnabled(config.enabled)
      setDefaultCurrency(config.default)
    }
  }, [config])

  const mutation = useMutation({
    mutationFn: async (payload: CurrencyConfig) =>
      adminFetch<CurrencyConfig>("/admin/currency-config", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      onSaved()
    },
  })

  const toggleCurrency = (code: string, next: boolean) => {
    setEnabled((prev) => {
      const set = new Set(prev)
      if (next) {
        set.add(code)
      } else {
        set.delete(code)
      }
      return SUPPORTED_CURRENCIES.filter((c) => set.has(c))
    })
  }

  const validationError = useMemo(() => {
    if (enabled.length === 0) {
      return t("custom.fx.enableAtLeastOne")
    }
    if (!enabled.includes(defaultCurrency)) {
      return t("custom.fx.defaultMustBeEnabled")
    }
    return null
  }, [enabled, defaultCurrency, t])

  const dirty = useMemo(() => {
    if (!config) {
      return false
    }
    const sameEnabled =
      config.enabled.length === enabled.length &&
      config.enabled.every((c) => enabled.includes(c))
    return !sameEnabled || config.default !== defaultCurrency
  }, [config, enabled, defaultCurrency])

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("custom.fx.configTitle")}</Heading>
        <Text className="text-ui-fg-subtle" size="small">
          {t("custom.fx.configSubtitle")}
        </Text>
      </div>

      {loadError ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-error" size="small">
            {t("custom.fx.configLoadError", { message: loadError.message })}
          </Text>
        </div>
      ) : isLoading ? (
        <div className="px-6 py-4">
          <Text className="text-ui-fg-subtle" size="small">
            {t("custom.fx.configLoading")}
          </Text>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-y-3 px-6 py-4">
            {SUPPORTED_CURRENCIES.map((code) => (
              <div
                key={code}
                className="flex items-center justify-between gap-x-4"
              >
                <Label size="small" htmlFor={`enabled-${code}`}>
                  {t(currencyLabelKey(code))}
                </Label>
                <Switch
                  id={`enabled-${code}`}
                  checked={enabled.includes(code)}
                  disabled={mutation.isPending}
                  onCheckedChange={(checked) => toggleCurrency(code, checked)}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-y-2 px-6 py-4">
            <Label size="small" weight="plus" htmlFor="default-currency">
              {t("custom.fx.defaultCurrency")}
            </Label>
            <Select
              value={defaultCurrency}
              disabled={mutation.isPending}
              onValueChange={setDefaultCurrency}
            >
              <Select.Trigger id="default-currency">
                <Select.Value placeholder={t("custom.fx.selectDefaultCurrency")} />
              </Select.Trigger>
              <Select.Content>
                {SUPPORTED_CURRENCIES.filter((c) => enabled.includes(c)).map(
                  (code) => (
                    <Select.Item key={code} value={code}>
                      {t(currencyLabelKey(code))}
                    </Select.Item>
                  )
                )}
              </Select.Content>
            </Select>
          </div>

          <div
            className={clx(
              "flex items-center justify-between gap-x-4 px-6 py-4"
            )}
          >
            <div>
              {validationError ? (
                <Text className="text-ui-fg-error" size="small">
                  {validationError}
                </Text>
              ) : mutation.isError ? (
                <Text className="text-ui-fg-error" size="small">
                  {t("custom.fx.configSaveError", {
                    message: (mutation.error as Error).message,
                  })}
                </Text>
              ) : null}
            </div>
            <Button
              variant="primary"
              size="small"
              isLoading={mutation.isPending}
              disabled={!dirty || !!validationError || mutation.isPending}
              onClick={() =>
                mutation.mutate({
                  enabled,
                  default: defaultCurrency,
                })
              }
            >
              {t("custom.common.save")}
            </Button>
          </div>
        </>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "custom.fx.label",
  translationNs: "translation",
  icon: CurrencyDollar,
})

export default CurrenciesFxPage
