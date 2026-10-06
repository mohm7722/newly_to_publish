import { Module } from "@medusajs/framework/utils"
import InvoicingModuleService from "./service"
import { Invoice } from "./models/invoice"

/**
 * Invoicing module.
 *
 * Provides a standalone, accounting-style document numbering + persistence
 * layer (currently order invoices, extensible to returns/receipts). Each issued
 * invoice carries its own number series, independent of the order display id.
 *
 * New table `invoicing_invoice` (additive; does not touch protected tables).
 */
export const INVOICING_MODULE = "invoicing"

export { Invoice }
export { default as InvoicingModuleService } from "./service"

export default Module(INVOICING_MODULE, {
  service: InvoicingModuleService,
})
