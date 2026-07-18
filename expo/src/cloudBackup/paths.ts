/**
 * Storage object path convention for encrypted cloud backups (PF6).
 *
 * Paths MUST be `{userId}/{backupId}.peprepbackup` — the storage RLS policies in
 * `supabase/migrations/20260718120000_peprep_encrypted_backups.sql` enforce that the first
 * path segment equals `auth.uid()::text`. `validateOwnedPath` re-checks that same invariant
 * client-side before any download/delete, as defense in depth (never trust the server alone).
 */

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BACKUP_EXTENSION = ".peprepbackup";

function getRandomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  const webCrypto = globalThis.crypto;
  if (webCrypto !== undefined && typeof webCrypto.getRandomValues === "function") {
    webCrypto.getRandomValues(out);
    return out;
  }
  // Node / Jest fallback (no Web Crypto).
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- Node-only path
  const nodeCrypto = require("crypto") as typeof import("crypto");
  return new Uint8Array(nodeCrypto.randomBytes(length));
}

/** Random UUIDv4, used as the backup id (and manifest primary key). */
export function generateBackupId(): string {
  const bytes = getRandomBytes(16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Builds the canonical Storage object path for a user's backup. */
export function objectPath(userId: string, backupId: string): string {
  if (!UUID_PATTERN.test(userId)) {
    throw new Error("Invalid user id for backup object path.");
  }
  if (!UUID_PATTERN.test(backupId)) {
    throw new Error("Invalid backup id for backup object path.");
  }
  return `${userId}/${backupId}${BACKUP_EXTENSION}`;
}

export type PathOwnershipResult =
  | { ok: true; backupId: string }
  | { ok: false; reason: "not-owned" | "malformed" };

/**
 * Client-side re-check that a manifest/object path's owning segment matches the signed-in
 * user. Never trust a path from a network response without this check.
 */
export function validateOwnedPath(path: string, userId: string): PathOwnershipResult {
  const segments = path.split("/");
  if (segments.length !== 2) return { ok: false, reason: "malformed" };
  const [owner, fileName] = segments;
  if (owner === undefined || fileName === undefined || fileName.length === 0) {
    return { ok: false, reason: "malformed" };
  }
  if (!fileName.endsWith(BACKUP_EXTENSION)) return { ok: false, reason: "malformed" };
  const backupId = fileName.slice(0, -BACKUP_EXTENSION.length);
  if (!UUID_PATTERN.test(backupId)) return { ok: false, reason: "malformed" };
  if (owner !== userId) return { ok: false, reason: "not-owned" };
  return { ok: true, backupId };
}
