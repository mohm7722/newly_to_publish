import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { convertAmount, loadFxConfig } from "../../../../../../lib/fx"
import { deleteProof, storeProof } from "../../../../../../lib/manual-transfer/storage"
import { MANUAL_TRANSFER_MODULE } from "../../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../../modules/manual-transfer/service"
import { PAYMENTS_MODULE } from "../../../../../../modules/payments"
import type PaymentsModuleService from "../../../../../../modules/payments/service"
import {
  handleManualTransferError,
  isTransferCurrency,
  ownedCart,
  publicSubmission,
  requireCustomer,
} from "../../../../../utils/manual-transfer"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = requireCustomer(req, res)
  if (!customerId) return
  let stored: Awaited<ReturnType<typeof storeProof>> | null = null
  try {
    const bankAccountId = String(req.query.bank_account_id || "")
    const currencyCode = String(req.query.currency_code || "")
    if (!bankAccountId || !isTransferCurrency(currencyCode)) {
      return res.status(400).json({ message: "الحساب البنكي والعملة مطلوبان" })
    }
    const cart = await ownedCart(req, req.params.id, customerId)
    if (!cart) return res.status(404).json({ message: "السلة غير موجودة" })

    const payments = req.scope.resolve<PaymentsModuleService>(PAYMENTS_MODULE)
    const accounts = await payments.listBankAccounts({ is_active: true, currency_code: currencyCode })
    const account = accounts.find((item) => item.id === bankAccountId)
    if (!account) return res.status(422).json({ message: "الحساب البنكي غير متاح لهذه العملة" })

    const fx = await loadFxConfig(req.scope)
    const rate = currencyCode === "SAR" ? 1 : Number(fx.rates[currencyCode])
    if (!Number.isFinite(rate) || rate <= 0) {
      return res.status(422).json({ message: "سعر صرف العملة غير متاح" })
    }
    const baseAmount = Number(cart.total ?? 0)
    const expectedAmount = baseAmount > 0
      ? convertAmount(baseAmount, "SAR", currencyCode, { ...fx.rates, SAR: 1 }, { enabled: true })
      : 0
    stored = await storeProof(req)

    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const result = await service.submit({
      cart_id: req.params.id,
      customer_id: customerId,
      bank_account_id: account.id,
      bank_name: account.bank_name,
      account_number: account.account_number,
      currency_code: currencyCode,
      expected_amount: expectedAmount,
      base_amount: baseAmount,
      fx_rate: rate,
      proof: stored,
    })
    stored = null
    await deleteProof(result.replacedStorageKey)

    const cartService = req.scope.resolve(Modules.CART) as any
    await cartService.updateCarts([{
      id: req.params.id,
      metadata: {
        ...(cart.metadata ?? {}),
        payment_method: "manual_bank_transfer",
        manual_transfer_currency: currencyCode,
        manual_transfer_bank_account_id: account.id,
      },
    }])

    return res.status(201).json({
      manual_transfer: publicSubmission(result.submission),
    })
  } catch (error) {
    if (stored) await deleteProof(stored.storageKey).catch(() => undefined)
    handleManualTransferError(error, res)
  }
}
