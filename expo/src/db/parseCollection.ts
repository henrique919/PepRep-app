/**
 * Corruption-tolerant JSON collection parse.
 * Malformed payloads and non-row entries are rejected without throwing.
 */

export type ParseCollectionResult<T extends { id: string }> = {
  items: T[];
  /** True when the raw payload was unusable or contained discarded rows. */
  quarantined: boolean;
  reason?: string;
};

function hasStringId(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
}

/**
 * Parse a stored collection JSON string into typed rows.
 * Never throws — corrupt JSON yields empty items + quarantined=true.
 */
export function parseCollectionJson<T extends { id: string }>(
  raw: string | null,
): ParseCollectionResult<T> {
  if (raw === null) {
    return { items: [], quarantined: false };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      items: [],
      quarantined: true,
      reason: "invalid-json",
    };
  }
  if (!Array.isArray(parsed)) {
    return {
      items: [],
      quarantined: true,
      reason: "not-array",
    };
  }
  const items = parsed.filter(hasStringId) as T[];
  const quarantined = items.length !== parsed.length;
  return {
    items,
    quarantined,
    ...(quarantined ? { reason: "dropped-malformed-rows" } : {}),
  };
}
