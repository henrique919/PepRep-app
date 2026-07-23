/**
 * Input parsing — the only place user-entered text becomes numbers.
 * Pure; no I/O, no React.
 */

/**
 * Parses user-entered decimal text into a finite number.
 * Accepts "2.5" and "2,5". Returns null for empty or invalid input.
 */
export function parseNumeric(text: string): number | null {
  const normalized = text.trim().replace(/,/g, ".");
  if (normalized.length === 0 || normalized === ".") return null;
  if (!/^\d*\.?\d*$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** True when the text parses to a number greater than zero. */
export function isPositiveNumeric(text: string): boolean {
  const value = parseNumeric(text);
  return value !== null && value > 0;
}
