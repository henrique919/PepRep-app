/**
 * Orphaned-notification selection — pure decision logic, no I/O.
 *
 * A repeating (daily/weekly/calendar) notification the app did not track in
 * its current state is an orphan: its plan or reminder is gone (erased,
 * restored-over, or lost to an old bug) but iOS/Android will keep firing it
 * forever. One-shot notifications (snoozes) are left alone.
 */

export interface ScheduledNotificationRow {
  identifier: string;
  /** True for daily/weekly/calendar-style repeating triggers. */
  repeating: boolean;
}

/** Identifiers of repeating notifications not present in the known set. */
export function selectOrphanedRepeatingIds(
  scheduled: ScheduledNotificationRow[],
  knownIds: readonly (string | null | undefined)[],
): string[] {
  const known = new Set(
    knownIds.filter((id): id is string => typeof id === "string" && id.length > 0),
  );
  return scheduled
    .filter((row) => row.repeating && !known.has(row.identifier))
    .map((row) => row.identifier);
}

/** Trigger types (both platforms) that repeat on a clock/calendar basis. */
const REPEATING_TRIGGER_TYPES = new Set(["daily", "weekly", "monthly", "yearly", "calendar"]);

/** Maps a native trigger object to our repeating flag. Unknown shapes are treated as non-repeating (never cancelled). */
export function isRepeatingTrigger(trigger: unknown): boolean {
  if (typeof trigger !== "object" || trigger === null) return false;
  const type = (trigger as { type?: unknown }).type;
  if (typeof type === "string" && REPEATING_TRIGGER_TYPES.has(type)) return true;
  // iOS calendar triggers may surface as { type: "calendar", repeats: true } or
  // legacy shapes with only a repeats flag.
  const repeats = (trigger as { repeats?: unknown }).repeats;
  return repeats === true;
}
