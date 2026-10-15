import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MANUAL_TRANSFER_MODULE } from "../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../modules/manual-transfer/service"
import {
  accessibleOrder,
  handleManualTransferError,
  publicSubmission,
} from "../../../../utils/manual-transfer"
import { nocache } from "../../../../utils/nocache"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    // Guest orders are readable by whoever holds the order id — the same model
    // Medusa applies to `GET /store/orders/:id`. Registered customers' orders
    // still require a matching authenticated actor.
    const accessed = await accessibleOrder(req, req.params.id)
    if (!accessed) {
      return res.status(404).json({ message: "الطلب غير موجود" })
    }
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const submission = await service.getByOrder(req.params.id)
    nocache(res)
    return res.status(200).json({
      manual_transfer: submission ? publicSubmission(submission) : null,
    })
  } catch (error) {
    handleManualTransferError(error, res)
  }
}
