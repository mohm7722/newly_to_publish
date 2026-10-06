/**
 * Schema-preservation guard.
 *
 * Barrel for the `src/lib/schema-guard` module. Re-exports the shared types,
 * the typed error, the preserved baseline + whitelist, the pure diff/assertion
 * logic (the unit tested by Property 2), the live introspection helpers, and
 * the startup/build preflight runner.
 *
 * Wiring: the runner is invoked at backend startup by the `schema-guard` module
 * loader (`src/modules/schema-guard`).
 */

export * from "./types"
export * from "./errors"
export * from "./baseline"
export * from "./diff"
export * from "./scan"
export * from "./introspect"
export * from "./preflight"
