import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MANUAL_TRANSFER_MODULE } from "../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../modules/manual-transfer/service"
import { handleManualTransferError, publicSubmission } from "../../../../utils/manual-transfer"
import { requirePermission } from "../../../../utils/rbac"
import { nocache } from "../../../../utils/nocache"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (!requirePermission(req, res, "manual_transfers.read")) return
  try {
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByOrder(req.params.id)
    if (!submission) return res.status(404).json({ message: "لا يوجد تحويل بنكي لهذا الطلب" })
    const events = await service.getEvents(submission.id)
    nocache(res)
    return res.status(200).json({
      manual_transfer: publicSubmission(submission, true),
      events: events.map((event) => ({
        id: event.id,
        event_type: event.event_type,
        actor_type: event.actor_type,
        actor_id: event.actor_id,
        note: event.note,
        metadata: event.metadata,
        created_at: event.created_at,
      })),
    })
  } catch (error) {
    handleManualTransferError(error, res)
  }
}
