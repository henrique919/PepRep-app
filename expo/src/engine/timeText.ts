/**
 * Time-of-day text normalisation. The iOS numeric keypad has no colon key,
 * so users type "9.45", "0945", or "9,45" — all of which mean 09:45. This is
 * the only place time text becomes an HH:mm value. Pure; no I/O, no React.
 */

/** Normalises user-entered time text to "HH:mm", or null when it isn't a time. */
export function normalizeTimeText(text: string): string | null {
  const trimmed = text.trim().replace(/[.,;]/g, ":");

  let hoursText: string;
  let minutesText: string;

  const withSeparator = trimmed.match(/^(\d{1,2}):(\d{1,2})$/);
  if (withSeparator !== null) {
    hoursText = withSeparator[1] ?? "";
    minutesText = withSeparator[2] ?? "";
  } else if (/^\d{3,4}$/.test(trimmed)) {
    // "0945" / "945" → 09:45
    hoursText = trimmed.slice(0, -2);
    minutesText = trimmed.slice(-2);
  } else if (/^\d{1,2}$/.test(trimmed)) {
    // A bare hour: "9" → 09:00
    hoursText = trimmed;
    minutesText = "0";
  } else {
    return null;
  }

  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
  if (hours > 23 || minutes > 59) return null;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
