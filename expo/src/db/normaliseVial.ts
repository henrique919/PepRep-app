import type { Vial } from "./models";

/**
 * Back-fill additive v4 inventory fields on legacy vial JSON without data loss.
 */
export function normaliseVialRecord(raw: Vial): Vial {
  return {
    ...raw,
    expiresAtIso: raw.expiresAtIso ?? null,
    lot: typeof raw.lot === "string" ? raw.lot : "",
    lowStockThresholdPercent:
      raw.lowStockThresholdPercent === undefined ? null : raw.lowStockThresholdPercent,
  };
}
