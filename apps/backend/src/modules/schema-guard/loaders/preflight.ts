/**
 * Schema-preservation guard — module loader.
 *
 * This loader runs at backend startup (the module is registered first in
 * `medusa-config.ts`, ahead of the data-bearing custom modules). It introspects
 * the live columns of the protected tables (`shipping_cities`, `bank_accounts`,
 * `cod_settings`, `order_settlement`), diffs them against the preserved
 * baseline, and halts startup with a descriptive error on any destructive
 * change — drop, rename, truncate, row delete, or column-type alteration —
 * while allowing the single additive `deleted_at timestamptz NULL` column and
 * the whitelisted benign differences (Requirements 1.6, 1.7, 9.4).
 *
 * Wiring note: Medusa invokes module loaders with a container that has the
 * shared `PG_CONNECTION` and `LOGGER` registered (resolved from the application
 * container). `runSchemaPreflight` resolves those keys itself, so passing the
 * loader's container (and the injected logger) through is sufficient.
 */
import type { LoaderOptions } from "@medusajs/framework/types"
import { runSchemaPreflight } from "../../../lib/schema-guard"

export default async function schemaGuardPreflightLoader({
  container,
  logger,
}: LoaderOptions): Promise<void> {
  await runSchemaPreflight(container, logger)
}
