import { Module } from "@medusajs/framework/utils"
import schemaGuardPreflightLoader from "./loaders/preflight"

/**
 * Schema-preservation guard module (loader-only, no data model).
 *
 * Registered first in `medusa-config.ts` so its startup loader runs before the
 * data-bearing custom modules (`shipping-city`, `payments`, `settlement`) and
 * halts the backend on any destructive change to the protected production
 * tables. The module defines no models and owns no columns; it exists solely to
 * host the preflight loader. The service is an empty no-op required by the
 * Medusa module loader (a module must export a service).
 *
 * _Requirements: 1.6, 1.7, 9.4_
 */
export const SCHEMA_GUARD_MODULE = "schema_guard"

class SchemaGuardModuleService {}

export default Module(SCHEMA_GUARD_MODULE, {
  service: SchemaGuardModuleService,
  loaders: [schemaGuardPreflightLoader],
})
