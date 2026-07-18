/**
 * Export filenames — date-stamped, no PII (no compound names, emails, or device ids).
 */

export type ExportKind = "doses-csv" | "data-json";

/** `dayKey` is a `yyyy-MM-dd` calendar day. */
export function exportFileName(kind: ExportKind, dayKey: string): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dayKey) ? dayKey : "undated";
  switch (kind) {
    case "doses-csv":
      return `peprep-doses-${day}.csv`;
    case "data-json":
      return `peprep-data-${day}.json`;
  }
}

export const EXPORT_PLAINTEXT_WARNING =
  "Exports are unencrypted plaintext of your health-adjacent records. Anyone with the file can read it. Share only with people and apps you trust.";
