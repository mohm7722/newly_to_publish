import { model } from "@medusajs/framework/utils"

export const ManualTransferSubmission = model
  .define(
    {
      name: "manual_transfer_submission",
      tableName: "manual_transfer_submissions",
    },
    {
      id: model.id().primaryKey(),
      cart_id: model.text().nullable(),
      order_id: model.text().nullable(),
      customer_id: model.text(),
      status: model.text().default("submitted"),
      bank_account_id: model.text(),
      bank_name: model.text(),
      account_number: model.text(),
      currency_code: model.text(),
      expected_amount: model.number(),
      base_amount: model.number(),
      fx_rate: model.number(),
      proof_storage_key: model.text(),
      proof_original_name: model.text(),
      proof_mime_type: model.text(),
      proof_size: model.number(),
      proof_sha256: model.text(),
      submitted_at: model.dateTime(),
      reviewed_at: model.dateTime().nullable(),
      reviewed_by: model.text().nullable(),
      rejection_reason: model.text().nullable(),
    }
  )
  .indexes([
    { on: ["cart_id"], unique: true },
    { on: ["order_id"], unique: true },
    { on: ["customer_id"] },
    { on: ["status"] },
  ])

export default ManualTransferSubmission
