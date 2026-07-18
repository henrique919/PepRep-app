/**
 * Factual vial status checks — never prescribe discard or restock action.
 */

/** True when an expiry/BUD date is set and is on or before the given day. */
export function isExpiredOrDue(
  expiresAtIso: string | null | undefined,
  nowIso: string,
): boolean {
  if (expiresAtIso == null || expiresAtIso.trim().length === 0) return false;
  const expiryMs = Date.parse(expiresAtIso);
  const nowMs = Date.parse(nowIso);
  if (!Number.isFinite(expiryMs) || !Number.isFinite(nowMs)) return false;
  return expiryMs <= nowMs;
}

export const DEFAULT_LOW_STOCK_PERCENT = 25;

/**
 * True when remaining percent is at or below the vial's threshold
 * (or the default when the vial has none set).
 */
export function isLowStock(
  remainingPercent: number,
  thresholdPercent: number | null | undefined,
  defaultThreshold: number = DEFAULT_LOW_STOCK_PERCENT,
): boolean {
  if (!Number.isFinite(remainingPercent)) return false;
  const threshold =
    thresholdPercent !== null &&
    thresholdPercent !== undefined &&
    Number.isFinite(thresholdPercent)
      ? thresholdPercent
      : defaultThreshold;
  return remainingPercent <= threshold;
}
