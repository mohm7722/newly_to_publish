import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { MANUAL_TRANSFER_MODULE } from "../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../modules/manual-transfer/service"
import { deleteProof } from "../../../../../lib/manual-transfer/storage"
import {
  handleManualTransferError,
  ownedCart,
  publicSubmission,
  requireCustomer,
} from "../../../../utils/manual-transfer"
import { nocache } from "../../../../utils/nocache"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = requireCustomer(req, res)
  if (!customerId) return
  try {
    if (!(await ownedCart(req, req.params.id, customerId))) {
      return res.status(404).json({ message: "السلة غير موجودة" })
    }
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByCart(req.params.id)
    nocache(res)
    return res.status(200).json({
      manual_transfer: submission ? publicSubmission(submission) : null,
    })
  } catch (error) {
    handleManualTransferError(error, res)
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customerId = requireCustomer(req, res)
  if (!customerId) return
  try {
    const cart = await ownedCart(req, req.params.id, customerId)
    if (!cart) return res.status(404).json({ message: "السلة غير موجودة" })
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const removed = await service.removeCartSubmission(req.params.id, customerId)
    await deleteProof(removed?.proof_storage_key)
    const { manual_transfer_currency, manual_transfer_bank_account_id, ...metadata } = cart.metadata ?? {}
    const cartService = req.scope.resolve(Modules.CART) as any
    await cartService.updateCarts([{ id: req.params.id, metadata }])
    return res.status(200).json({ ok: true })
  } catch (error) {
    handleManualTransferError(error, res)
  }
}
