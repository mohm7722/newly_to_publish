import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MANUAL_TRANSFER_MODULE } from "../../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../../modules/manual-transfer/service"
import { handleManualTransferError, publicSubmission } from "../../../../../utils/manual-transfer"
import { getAdminIdentity, requirePermission } from "../../../../../utils/rbac"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!requirePermission(req, res, "manual_transfers.review")) return
  try {
    const reason = String((req.body as { reason?: string } | undefined)?.reason || "")
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.reject(req.params.id, getAdminIdentity(req), reason)
    return res.status(200).json({ manual_transfer: publicSubmission(submission, true) })
  } catch (error) {
    handleManualTransferError(error, res)
  }
}
