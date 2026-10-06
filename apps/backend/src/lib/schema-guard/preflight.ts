/**
 * Schema-preservation guard — startup/build preflight runner.
 *
 * Composes live introspection with the pure diff/assertion logic and halts the
 * process (by throwing) on any destructive change to a protected table
 * (Requirements 1.6, 1.7, 9.4). Intended to run at backend startup/build via a
 * module loader (see `src/modules/schema-guard`).
 *
 * Behavior:
 *   - Resolves the shared Postgres connection from the container.
 *   - Introspects the live columns of the four protected tables.
 *   - For each table present in the live database, diffs it against the
 *     preserved baseline and asserts the diff is non-destructive.
 *   - A protected table that does not yet exist is skipped (a fresh database is
 *     not a destructive change; the module migrations will create it).
 */
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PROTECTED_TABLES } from "./baseline"
import { assertTablePreserved } from "./diff"
import { baselineFor, introspectLiveSchema } from "./introspect"
import type { PgConnectionLike } from "./introspect"

/** Minimal logger shape; the Medusa logger satisfies this. */
export type GuardLogger = {
  info: (message: string) => void
  warn: (message: string) => void
}

/** Minimal container shape needed to resolve the pg connection and logger. */
export type GuardContainer = {
  resolve: <T = unknown>(key: string) => T
}

/**
 * Run the schema-preservation preflight against the live database.
 *
 * @throws {DestructiveSchemaChangeError} when any protected table would undergo
 *   a drop/rename/truncate/row-delete/column-type alteration. The thrown error
 *   halts startup/build before the change can be applied.
 */
export async function runSchemaPreflight(
  container: GuardContainer,
  logger?: GuardLogger
): Promise<void> {
  const log =
    logger ??
    (safeResolve<GuardLogger>(container, ContainerRegistrationKeys.LOGGER) ?? {
      info: () => undefined,
      warn: () => undefined,
    })

  const pg = container.resolve<PgConnectionLike>(
    ContainerRegistrationKeys.PG_CONNECTION
  )

  log.info(
    `[schema-guard] Verifying preservation of protected tables: ${PROTECTED_TABLES.join(
      ", "
    )}`
  )

  const live = await introspectLiveSchema(pg, PROTECTED_TABLES)
  const liveByTable = new Map(live.map((t) => [t.table, t]))

  let checked = 0
  for (const table of PROTECTED_TABLES) {
    const baseline = baselineFor(table)
    const observed = liveByTable.get(table)

    if (!baseline) {
      continue
    }
    if (!observed) {
      log.warn(
        `[schema-guard] Protected table "${table}" not found in the database; skipping (will be created by module migration).`
      )
      continue
    }

    // Throws DestructiveSchemaChangeError on any non-additive difference.
    assertTablePreserved(baseline, observed)
    checked += 1
  }

  log.info(
    `[schema-guard] Schema preservation verified for ${checked} protected table(s); no destructive changes detected.`
  )
}

/** Resolve a key from the container, returning undefined if it is not registered. */
function safeResolve<T>(container: GuardContainer, key: string): T | undefined {
  try {
    return container.resolve<T>(key)
  } catch {
    return undefined
  }
}
