/**
 * Stable occurrence key for a scheduled slot on a day.
 * Format: dayKey|timeLocal|planId
 */

export function occurrenceKey(day: string, timeLocal: string, planId: string): string {
  return `${day}|${timeLocal}|${planId}`;
}

export function parseOccurrenceKey(key: string): {
  day: string;
  timeLocal: string;
  planId: string;
} | null {
  const parts = key.split("|");
  if (parts.length !== 3) return null;
  const [day, timeLocal, planId] = parts;
  if (day.length === 0 || timeLocal.length === 0 || planId.length === 0) return null;
  return { day, timeLocal, planId };
}
