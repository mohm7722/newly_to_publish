import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { deleteProof, openProofStream, storeProof } from "../../../../../../lib/manual-transfer/storage"
import { MANUAL_TRANSFER_MODULE } from "../../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../../modules/manual-transfer/service"
import {
  accessibleOrder,
  expectedSubmissionOwner,
  handleManualTransferError,
} from "../../../../../utils/manual-transfer"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const accessed = await accessibleOrder(req, req.params.id)
    if (!accessed) {
      return res.status(404).json({ message: "الطلب غير موجود" })
    }
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByOrder(req.params.id)
    if (
      !submission ||
      submission.customer_id !== expectedSubmissionOwner(submission, accessed.access)
    ) {
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
  let stored: Awaited<ReturnType<typeof storeProof>> | null = null
  try {
    const accessed = await accessibleOrder(req, req.params.id)
    if (!accessed) {
      return res.status(404).json({ message: "الطلب غير موجود" })
    }
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const existing = await service.getByOrder(req.params.id)
    if (!existing) {
      return res.status(404).json({ message: "لا يوجد تحويل بنكي لهذا الطلب" })
    }
    const ownerId = expectedSubmissionOwner(existing, accessed.access)
    stored = await storeProof(req)
    const result = await service.resubmitOrderProof(req.params.id, ownerId, stored)
    stored = null
    await deleteProof(result.replacedStorageKey)
    return res.status(200).json({ ok: true })
  } catch (error) {
    if (stored) await deleteProof(stored.storageKey).catch(() => undefined)
    handleManualTransferError(error, res)
  }
}
