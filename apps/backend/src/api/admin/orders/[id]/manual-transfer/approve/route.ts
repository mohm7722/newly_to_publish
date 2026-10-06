import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { markPaymentCollectionAsPaid } from "@medusajs/medusa/core-flows"
import { MANUAL_TRANSFER_MODULE } from "../../../../../../modules/manual-transfer"
import type ManualTransferModuleService from "../../../../../../modules/manual-transfer/service"
import { handleManualTransferError, publicSubmission } from "../../../../../utils/manual-transfer"
import { getAdminIdentity, getPermissionContext, requirePermission } from "../../../../../utils/rbac"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  if (!requirePermission(req, res, "manual_transfers.review")) return
  try {
    const service = req.scope.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)
    const current = await service.getByOrder(req.params.id)
    if (!current) return res.status(404).json({ message: "لا يوجد تحويل بنكي لهذا الطلب" })
    if (current.status === "approved") {
      return res.status(200).json({ manual_transfer: publicSubmission(current, true) })
    }
    if (current.status !== "submitted") {
      return res.status(409).json({ message: "يجب إعادة رفع الإشعار المرفوض قبل قبوله" })
    }

    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "order",
      fields: ["id", "payment_collections.id"],
      filters: { id: req.params.id },
    })
    const paymentCollectionId = (data?.[0] as any)?.payment_collections?.[0]?.id
    if (!paymentCollectionId) {
      return res.status(422).json({ message: "لا توجد مجموعة دفع مرتبطة بالطلب" })
    }

    await markPaymentCollectionAsPaid(req.scope).run({
      input: {
        order_id: req.params.id,
        payment_collection_id: paymentCollectionId,
        captured_by: getPermissionContext(req)?.userId,
        provider_id: "pp_system_default",
      },
    })
    const submission = await service.approve(req.params.id, getAdminIdentity(req))
    return res.status(200).json({ manual_transfer: publicSubmission(submission, true) })
  } catch (error) {
    handleManualTransferError(error, res)
  }
}
