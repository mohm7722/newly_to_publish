import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CreditCard } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  FocusModal,
  Heading,
  Input,
  Label,
  Prompt,
  Select,
  Switch,
  Table,
  Text,
  Textarea,
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
 * Bank accounts management page (Requirements 6.3, 6.4, 6.5, 6.6, 6.7).
 *
 * Wired to the admin bank-account routes:
 *  - `GET    /admin/payments/bank-accounts`
 *  - `POST   /admin/payments/bank-accounts`
 *  - `PATCH  /admin/payments/bank-accounts/[id]`
 *  - `DELETE /admin/payments/bank-accounts/[id]`
 *  - `POST   /admin/payments/bank-accounts/[id]/toggle`
 *
 * Every mutating action shows a pending state while the request runs
 * (Requirement 6.6) and, on failure, surfaces the server error message without
 * mutating the displayed list — the query cache is only refreshed on success
 * (Requirement 6.7).
 */

/** Canonical currency codes stored verbatim (underscore form). */
const CURRENCY_CODES = ["SAR", "YER_NEW", "YER_OLD"] as const

type CurrencyCode = (typeof CURRENCY_CODES)[number]

type BankAccount = {
  id: string
  bank_name: string
  account_number: string
  currency_code: string
  instructions: string | null
  is_active: boolean
}

type BankAccountForm = {
  bank_name: string
  account_number: string
  currency_code: CurrencyCode
  instructions: string
  is_active: boolean
}

const EMPTY_FORM: BankAccountForm = {
  bank_name: "",
  account_number: "",
  currency_code: "SAR",
  instructions: "",
  is_active: true,
}

const QUERY_KEY = ["admin", "payments", "bank-accounts"] as const

const BankAccountsPage = () => {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const [editor, setEditor] = useState<{
    open: boolean
    editing: BankAccount | null
    form: BankAccountForm
  }>({ open: false, editing: null, form: EMPTY_FORM })

  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null)

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      adminFetch<{ bank_accounts: BankAccount[] }>(
        "/admin/payments/bank-accounts"
      ),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const saveMutation = useMutation({
    mutationFn: async (form: BankAccountForm) => {
      const payload = {
        bank_name: form.bank_name,
        account_number: form.account_number,
        currency_code: form.currency_code,
        instructions:
          form.instructions.trim().length > 0
            ? form.instructions
            : undefined,
        is_active: form.is_active,
      }

      if (editor.editing) {
        return adminFetch(
          `/admin/payments/bank-accounts/${editor.editing.id}`,
          { method: "PATCH", body: payload }
        )
      }
      return adminFetch("/admin/payments/bank-accounts", {
        method: "POST",
        body: payload,
      })
    },
    onSuccess: async () => {
      await refresh()
      toast.success(
        editor.editing
          ? t("custom.bankAccounts.updatedToast")
          : t("custom.bankAccounts.createdToast")
      )
      setEditor({ open: false, editing: null, form: EMPTY_FORM })
    },
    onError: (err: Error) => {
      // Leave displayed values unchanged; only surface the error (Req 6.7).
      toast.error(t("custom.bankAccounts.saveErrorToast"), {
        description: err.message,
      })
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (account: BankAccount) =>
      adminFetch(
        `/admin/payments/bank-accounts/${account.id}/toggle`,
        { method: "POST" }
      ),
    onSuccess: async () => {
      await refresh()
      toast.success(t("custom.bankAccounts.updatedToast"))
    },
    onError: (err: Error) => {
      toast.error(t("custom.bankAccounts.toggleErrorToast"), {
        description: err.message,
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (account: BankAccount) =>
      adminFetch(`/admin/payments/bank-accounts/${account.id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await refresh()
      toast.success(t("custom.bankAccounts.deletedToast"))
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error(t("custom.bankAccounts.deleteErrorToast"), {
        description: err.message,
      })
      setDeleteTarget(null)
    },
  })

  const openCreate = () =>
    setEditor({ open: true, editing: null, form: EMPTY_FORM })

  const openEdit = (account: BankAccount) =>
    setEditor({
      open: true,
      editing: account,
      form: {
        bank_name: account.bank_name,
        account_number: account.account_number,
        currency_code: CURRENCY_CODES.includes(
          account.currency_code as CurrencyCode
        )
          ? (account.currency_code as CurrencyCode)
          : "SAR",
        instructions: account.instructions ?? "",
        is_active: account.is_active,
      },
    })

  const setForm = (partial: Partial<BankAccountForm>) =>
    setEditor((prev) => ({ ...prev, form: { ...prev.form, ...partial } }))

  const accounts = data?.bank_accounts ?? []
  const formValid =
    editor.form.bank_name.trim().length > 0 &&
    editor.form.account_number.trim().length > 0

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">{t("custom.bankAccounts.title")}</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {t("custom.bankAccounts.subtitle")}
          </Text>
        </div>
        <Button variant="primary" onClick={openCreate}>
          {t("custom.bankAccounts.add")}
        </Button>
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">
            {t("custom.bankAccounts.loading")}
          </Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            {t("custom.bankAccounts.loadError", {
              message: (error as Error)?.message,
            })}
          </Text>
        </div>
      )}

      {!isLoading && !isError && accounts.length === 0 && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">
            {t("custom.bankAccounts.empty")}
          </Text>
        </div>
      )}

      {!isLoading && !isError && accounts.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>{t("custom.bankAccounts.colBank")}</Table.HeaderCell>
              <Table.HeaderCell>
                {t("custom.bankAccounts.colAccountNumber")}
              </Table.HeaderCell>
              <Table.HeaderCell>{t("custom.common.currency")}</Table.HeaderCell>
              <Table.HeaderCell>{t("custom.common.status")}</Table.HeaderCell>
              <Table.HeaderCell className="text-right">
                {t("custom.common.actions")}
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {accounts.map((account) => (
              <Table.Row key={account.id}>
                <Table.Cell>{account.bank_name}</Table.Cell>
                <Table.Cell>{account.account_number}</Table.Cell>
                <Table.Cell>{account.currency_code}</Table.Cell>
                <Table.Cell>
                  <Badge
                    color={account.is_active ? "green" : "grey"}
                    size="small"
                  >
                    {account.is_active
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
                        toggleMutation.variables?.id === account.id
                      }
                      onClick={() => toggleMutation.mutate(account)}
                    >
                      {account.is_active
                        ? t("custom.common.deactivate")
                        : t("custom.common.activate")}
                    </Button>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => openEdit(account)}
                    >
                      {t("custom.common.edit")}
                    </Button>
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => setDeleteTarget(account)}
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
        onOpenChange={(open) =>
          setEditor((prev) => ({ ...prev, open }))
        }
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
                  ? t("custom.bankAccounts.editTitle")
                  : t("custom.bankAccounts.addTitle")}
              </Heading>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="bank_name">{t("custom.bankAccounts.bankName")}</Label>
                <Input
                  id="bank_name"
                  value={editor.form.bank_name}
                  onChange={(e) => setForm({ bank_name: e.target.value })}
                  placeholder={t("custom.bankAccounts.bankNamePlaceholder")}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="account_number">
                  {t("custom.bankAccounts.accountNumber")}
                </Label>
                <Input
                  id="account_number"
                  value={editor.form.account_number}
                  onChange={(e) =>
                    setForm({ account_number: e.target.value })
                  }
                  placeholder={t("custom.bankAccounts.accountNumberPlaceholder")}
                />
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="currency_code">{t("custom.common.currency")}</Label>
                <Select
                  value={editor.form.currency_code}
                  onValueChange={(value) =>
                    setForm({ currency_code: value as CurrencyCode })
                  }
                >
                  <Select.Trigger id="currency_code">
                    <Select.Value placeholder={t("custom.common.selectCurrency")} />
                  </Select.Trigger>
                  <Select.Content>
                    {CURRENCY_CODES.map((code) => (
                      <Select.Item key={code} value={code}>
                        {code}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="instructions">
                  {t("custom.bankAccounts.instructions")}
                </Label>
                <Textarea
                  id="instructions"
                  value={editor.form.instructions}
                  onChange={(e) =>
                    setForm({ instructions: e.target.value })
                  }
                  placeholder={t("custom.bankAccounts.instructionsPlaceholder")}
                />
              </div>

              <div className="flex items-center gap-x-2">
                <Switch
                  id="is_active"
                  checked={editor.form.is_active}
                  onCheckedChange={(checked) =>
                    setForm({ is_active: checked })
                  }
                />
                <Label htmlFor="is_active">{t("custom.bankAccounts.activeLabel")}</Label>
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
            <Prompt.Title>{t("custom.bankAccounts.deleteTitle")}</Prompt.Title>
            <Prompt.Description>
              {t("custom.bankAccounts.deleteConfirm", {
                name: deleteTarget?.bank_name ?? "",
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
  label: "custom.bankAccounts.label",
  translationNs: "translation",
  icon: CreditCard,
})

export default BankAccountsPage
