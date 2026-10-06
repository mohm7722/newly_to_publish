import { randomUUID } from "crypto"
import { MedusaError, MedusaService } from "@medusajs/framework/utils"
import { ManualTransferSubmission } from "./models/manual-transfer-submission"
import { ManualTransferEvent } from "./models/manual-transfer-event"

export const MANUAL_TRANSFER_STATUSES = ["submitted", "rejected", "approved"] as const
export type ManualTransferStatus = (typeof MANUAL_TRANSFER_STATUSES)[number]

export type ProofSnapshot = {
  storageKey: string
  originalName: string
  mimeType: string
  size: number
  sha256: string
}

export type SubmitTransferInput = {
  cart_id: string
  customer_id: string
  bank_account_id: string
  bank_name: string
  account_number: string
  currency_code: string
  expected_amount: number
  base_amount: number
  fx_rate: number
  proof: ProofSnapshot
}

function notFound(message: string): never {
  throw new MedusaError(MedusaError.Types.NOT_FOUND, message)
}

function invalid(message: string): never {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
}

class ManualTransferModuleService extends MedusaService({
  ManualTransferSubmissionModel: ManualTransferSubmission,
  ManualTransferEventModel: ManualTransferEvent,
}) {
  async getByCart(cartId: string) {
    const [submission] = await super.listManualTransferSubmissionModels(
      { cart_id: cartId }, { take: 1 }
    )
    return submission ?? null
  }

  async getByOrder(orderId: string) {
    const [submission] = await super.listManualTransferSubmissionModels(
      { order_id: orderId }, { take: 1 }
    )
    return submission ?? null
  }

  async getEvents(submissionId: string) {
    return super.listManualTransferEventModels(
      { submission_id: submissionId }, { order: { created_at: "DESC" } }
    )
  }

  async submit(input: SubmitTransferInput) {
    const existing = await this.getByCart(input.cart_id)
    const now = new Date()
    const payload = {
      cart_id: input.cart_id,
      customer_id: input.customer_id,
      status: "submitted",
      bank_account_id: input.bank_account_id,
      bank_name: input.bank_name,
      account_number: input.account_number,
      currency_code: input.currency_code,
      expected_amount: input.expected_amount,
      base_amount: input.base_amount,
      fx_rate: input.fx_rate,
      proof_storage_key: input.proof.storageKey,
      proof_original_name: input.proof.originalName,
      proof_mime_type: input.proof.mimeType,
      proof_size: input.proof.size,
      proof_sha256: input.proof.sha256,
      submitted_at: now,
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
    }

    let submission: any
    if (existing) {
      if (existing.order_id) invalid("لا يمكن تعديل إشعار مرتبط بطلب من مسار السلة")
      const updated = await super.updateManualTransferSubmissionModels({
        id: existing.id, ...payload,
      })
      submission = Array.isArray(updated) ? updated[0] : updated
    } else {
      const created = await super.createManualTransferSubmissionModels({
        id: randomUUID(), order_id: null, ...payload,
      })
      submission = Array.isArray(created) ? created[0] : created
    }

    await this.addEvent(submission.id, "submitted", "customer", input.customer_id, null, {
      currency_code: input.currency_code,
      bank_account_id: input.bank_account_id,
      proof_sha256: input.proof.sha256,
    })
    return { submission, replacedStorageKey: existing?.proof_storage_key ?? null }
  }

  async attachOrder(cartId: string, orderId: string) {
    const submission = await this.getByCart(cartId)
    if (!submission) return null
    if (submission.order_id && submission.order_id !== orderId) {
      invalid("Transfer submission is already attached to another order")
    }
    if (submission.order_id === orderId) return submission
    const updated = await super.updateManualTransferSubmissionModels({
      id: submission.id, order_id: orderId,
    })
    const result = Array.isArray(updated) ? updated[0] : updated
    await this.addEvent(submission.id, "order_attached", "system", null, null, { order_id: orderId })
    return result
  }

  async resubmitOrderProof(orderId: string, customerId: string, proof: ProofSnapshot) {
    const submission = await this.getByOrder(orderId)
    if (!submission) notFound("لا يوجد تحويل بنكي لهذا الطلب")
    if (submission.customer_id !== customerId) notFound("الطلب غير موجود")
    if (submission.status !== "rejected") invalid("يمكن إعادة رفع الإشعار بعد الرفض فقط")

    const oldStorageKey = submission.proof_storage_key
    const updated = await super.updateManualTransferSubmissionModels({
      id: submission.id,
      status: "submitted",
      proof_storage_key: proof.storageKey,
      proof_original_name: proof.originalName,
      proof_mime_type: proof.mimeType,
      proof_size: proof.size,
      proof_sha256: proof.sha256,
      submitted_at: new Date(),
      reviewed_at: null,
      reviewed_by: null,
      rejection_reason: null,
    })
    const result = Array.isArray(updated) ? updated[0] : updated
    await this.addEvent(submission.id, "resubmitted", "customer", customerId, null, {
      proof_sha256: proof.sha256,
    })
    return { submission: result, replacedStorageKey: oldStorageKey }
  }

  async approve(orderId: string, actorId: string) {
    const submission = await this.getByOrder(orderId)
    if (!submission) notFound("لا يوجد تحويل بنكي لهذا الطلب")
    if (submission.status === "approved") return submission
    if (submission.status !== "submitted") invalid("لا يمكن قبول إشعار مرفوض قبل إعادة رفعه")
    const updated = await super.updateManualTransferSubmissionModels({
      id: submission.id,
      status: "approved",
      reviewed_at: new Date(),
      reviewed_by: actorId,
      rejection_reason: null,
    })
    const result = Array.isArray(updated) ? updated[0] : updated
    await this.addEvent(submission.id, "approved", "admin", actorId)
    return result
  }

  async reject(orderId: string, actorId: string, reason: string) {
    const cleanReason = reason?.trim()
    if (!cleanReason) invalid("سبب الرفض مطلوب")
    if (cleanReason.length > 1000) invalid("سبب الرفض طويل جدًا")
    const submission = await this.getByOrder(orderId)
    if (!submission) notFound("لا يوجد تحويل بنكي لهذا الطلب")
    if (submission.status !== "submitted") invalid("لا يمكن رفض هذا الإشعار في حالته الحالية")
    const updated = await super.updateManualTransferSubmissionModels({
      id: submission.id,
      status: "rejected",
      reviewed_at: new Date(),
      reviewed_by: actorId,
      rejection_reason: cleanReason,
    })
    const result = Array.isArray(updated) ? updated[0] : updated
    await this.addEvent(submission.id, "rejected", "admin", actorId, cleanReason)
    return result
  }

  async removeCartSubmission(cartId: string, customerId: string) {
    const submission = await this.getByCart(cartId)
    if (!submission) return null
    if (submission.customer_id !== customerId || submission.order_id) notFound("السلة غير موجودة")
    await super.deleteManualTransferSubmissionModels(submission.id)
    await this.addEvent(submission.id, "cleared", "customer", customerId)
    return submission
  }

  async listForReport(filters: {
    currency_code?: string
    created_at?: Record<string, Date>
  } = {}) {
    return super.listManualTransferSubmissionModels(filters as any, {
      order: { created_at: "DESC" },
      take: 5000,
    })
  }

  private async addEvent(
    submissionId: string,
    eventType: string,
    actorType: string,
    actorId: string | null,
    note: string | null = null,
    metadata: Record<string, unknown> | null = null
  ) {
    return super.createManualTransferEventModels({
      id: randomUUID(),
      submission_id: submissionId,
      event_type: eventType,
      actor_type: actorType,
      actor_id: actorId,
      note,
      metadata,
    })
  }
}

export default ManualTransferModuleService

// Report access is intentionally exposed through the service rather than the
// generated repository methods so routes remain decoupled from model aliases.
export type ManualTransferReportFilters = {
  currency_code?: string
  created_at?: Record<string, Date>
}
