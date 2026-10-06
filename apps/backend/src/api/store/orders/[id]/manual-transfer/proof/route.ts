import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteProof, openProofStream, storeProof } from "../../../../../../lib/manual-transfer/storage"
import { MANUAL_TRANSFER_MODULE } from "../../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../../modules/manual-transfer/service"
import {
  handleManualTransferError,
  ownedOrder,
  requireCustomer,
} from "../../../../../utils/manual-transfer"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = requireCustomer(req, res)
  if (!customerId) return
  try {
    if (!(await ownedOrder(req, req.params.id, customerId))) {
      return res.status(404).json({ message: "الطلب غير موجود" })
    }
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByOrder(req.params.id)
    if (!submission || submission.customer_id !== customerId) {
      return res.status(404).json({ message: "الإشعار غير موجود" })
    }
    res.setHeader("Content-Type", submission.proof_mime_type)
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(submission.proof_original_name)}`)
    res.setHeader("Cache-Control", "private, no-store")
    openProofStream(submission.proof_storage_key)
      .on("error", () => { if (!res.headersSent) res.status(404).end() })
      .pipe(res)
  } catch (error) {
    handleManualTransferError(error, res)
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = requireCustomer(req, res)
  if (!customerId) return
  let stored: Awaited<ReturnType<typeof storeProof>> | null = null
  try {
    if (!(await ownedOrder(req, req.params.id, customerId))) {
      return res.status(404).json({ message: "الطلب غير موجود" })
    }
    stored = await storeProof(req)
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const result = await service.resubmitOrderProof(req.params.id, customerId, stored)
    stored = null
    await deleteProof(result.replacedStorageKey)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (stored) await deleteProof(stored.storageKey).catch(() => undefined)
    handleManualTransferError(error, res)
  }
}
