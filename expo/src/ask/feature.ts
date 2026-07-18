/**
 * Ask feature gate for store builds.
 * OD-1 (2026-07-18): removed from v1 — re-enable after T3.1 human sign-off.
 *
 * Tests may override via `globalThis.__PEPREP_ASK_V1__ = true`.
 */

declare global {
  var __PEPREP_ASK_V1__: boolean | undefined;
}

/** Production default. */
export const ASK_V1_DEFAULT = false;

/** Runtime gate — respects test override. */
export function isAskV1Enabled(): boolean {
  if (typeof globalThis !== "undefined" && typeof globalThis.__PEPREP_ASK_V1__ === "boolean") {
    return globalThis.__PEPREP_ASK_V1__;
  }
  return ASK_V1_DEFAULT;
}

/**
 * Import-time constant for UI hide/show (always the production default).
 * Network path must use `isAskV1Enabled()`.
 */
export const ASK_V1_ENABLED = ASK_V1_DEFAULT;
