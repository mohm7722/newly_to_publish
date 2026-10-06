import { Module } from "@medusajs/framework/utils"
import ManualTransferModuleService from "./service"

export const MANUAL_TRANSFER_MODULE = "manualTransfer"

export { ManualTransferSubmission } from "./models/manual-transfer-submission"
export { ManualTransferEvent } from "./models/manual-transfer-event"
export { default as ManualTransferModuleService } from "./service"

export default Module(MANUAL_TRANSFER_MODULE, {
  service: ManualTransferModuleService,
})
