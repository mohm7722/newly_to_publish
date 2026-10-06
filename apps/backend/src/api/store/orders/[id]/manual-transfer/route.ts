import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MANUAL_TRANSFER_MODULE } from "../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../modules/manual-transfer/service"
import {
  handleManualTransferError,
  ownedOrder,
  publicSubmission,
  requireCustomer,
} from "../../../../utils/manual-transfer"
import { nocache } from "../../../../utils/nocache"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = requireCustomer(req, res)
  if (!customerId) return
  try {
    if (!(await ownedOrder(req, req.params.id, customerId))) {
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
