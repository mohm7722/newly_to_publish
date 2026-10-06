import { model } from "@medusajs/framework/utils"

export const ManualTransferEvent = model
  .define(
    { name: "manual_transfer_event", tableName: "manual_transfer_events" },
    {
      id: model.id().primaryKey(),
      submission_id: model.text(),
      event_type: model.text(),
      actor_type: model.text(),
      actor_id: model.text().nullable(),
      note: model.text().nullable(),
      metadata: model.json().nullable(),
    }
  )
  .indexes([
    { on: ["submission_id"] },
    { on: ["event_type"] },
  ])

export default ManualTransferEvent
