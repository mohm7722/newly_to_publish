import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { openProofStream } from "../../../../../../lib/manual-transfer/storage"
import { MANUAL_TRANSFER_MODULE } from "../../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../../modules/manual-transfer/service"
import { handleManualTransferError } from "../../../../../utils/manual-transfer"
import { requirePermission } from "../../../../../utils/rbac"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!requirePermission(req, res, "manual_transfers.read")) return
  try {
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByOrder(req.params.id)
    if (!submission) return res.status(404).json({ message: "الإشعار غير موجود" })
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
