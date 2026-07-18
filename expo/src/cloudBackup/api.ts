/**
 * Optional Supabase encrypted cloud backup — network operations (PF6).
 *
 * Every exported function calls `assertPepRepProjectRef()` first and aborts if the configured
 * project ref is not PepRep's own (`opbqlsmwljqkkdvguojh`). This module only ever handles
 * ciphertext produced by `src/backup/codec.ts` (`createEncryptedBackup` / `serializeBackupFile`)
 * — it never sees a passphrase, a derived key, or plaintext health data. Manifests stored in
 * Postgres hold only non-health metadata (size, checksum, versions, timestamp, device label).
 */
import { getSupabase } from "./client";
import { assertPepRepProjectRef } from "./config";
import { generateBackupId, objectPath, validateOwnedPath } from "./paths";

const BUCKET = "peprep-encrypted-backups";
const TABLE = "peprep_backup_manifests";

export type BackupManifestRow = {
  id: string;
  userId: string;
  objectPath: string;
  createdAtIso: string;
  formatVersion: number;
  schemaVersion: number;
  appVersion: string;
  byteSize: number;
  checksumSha256: string;
  deviceLabel: string | null;
};

export type ApiResult<T> = { ok: true; value: T } | { ok: false; message: string };

function mapManifestRow(row: Record<string, unknown>): BackupManifestRow {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    objectPath: String(row.object_path),
    createdAtIso: String(row.created_at),
    formatVersion: Number(row.format_version),
    schemaVersion: Number(row.schema_version),
    appVersion: String(row.app_version),
    byteSize: Number(row.byte_size),
    checksumSha256: String(row.checksum_sha256),
    deviceLabel:
      row.device_label === null || row.device_label === undefined
        ? null
        : String(row.device_label),
  };
}

async function requireSignedInUserId(): Promise<string> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user === null) {
    throw new Error("Sign in required before this cloud backup action.");
  }
  return data.user.id;
}

/** Sends a one-time passcode to `email`. Call `verifyEmailOtp` next to complete sign-in. */
export async function signInWithOtp(email: string): Promise<ApiResult<null>> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) return { ok: false, message: error.message };
  return { ok: true, value: null };
}

/** Completes email OTP sign-in with the 6-digit code sent by `signInWithOtp`. */
export async function verifyEmailOtp(email: string, token: string): Promise<ApiResult<null>> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { ok: false, message: error.message };
  return { ok: true, value: null };
}

export async function getSignedInEmail(): Promise<string | null> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function signOut(): Promise<void> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  await supabase.auth.signOut();
}

export async function listManifests(): Promise<BackupManifestRow[]> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapManifestRow(row as Record<string, unknown>));
}

export type UploadEncryptedBackupInput = {
  /** The full serialized ciphertext envelope from `serializeBackupFile()` — never plaintext. */
  rawCiphertextJson: string;
  checksumSha256: string;
  byteSize: number;
  formatVersion: number;
  schemaVersion: number;
  appVersion: string;
  deviceLabel?: string | null;
};

export async function uploadEncryptedBackup(
  input: UploadEncryptedBackupInput,
): Promise<BackupManifestRow> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const userId = await requireSignedInUserId();
  const backupId = generateBackupId();
  const path = objectPath(userId, backupId);
  const ownership = validateOwnedPath(path, userId);
  if (!ownership.ok) {
    throw new Error("Refusing to upload — backup path failed the ownership check.");
  }

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
    path,
    input.rawCiphertextJson,
    { contentType: "application/json", upsert: true },
  );
  if (uploadError) throw new Error(uploadError.message);

  const { data, error: insertError } = await supabase
    .from(TABLE)
    .insert({
      id: backupId,
      user_id: userId,
      object_path: path,
      format_version: input.formatVersion,
      schema_version: input.schemaVersion,
      app_version: input.appVersion,
      byte_size: input.byteSize,
      checksum_sha256: input.checksumSha256,
      device_label: input.deviceLabel ?? null,
    })
    .select("*")
    .single();

  if (insertError || data === null) {
    try {
      await supabase.storage.from(BUCKET).remove([path]);
    } catch {
      // Best-effort cleanup only — surfaced error below is what the caller sees.
    }
    throw new Error(insertError?.message ?? "Failed to save the backup manifest.");
  }
  return mapManifestRow(data as Record<string, unknown>);
}

/** Downloads and returns the raw ciphertext JSON for a manifest — never decrypted here. */
export async function downloadBackup(manifest: BackupManifestRow): Promise<string> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const userId = await requireSignedInUserId();
  const ownership = validateOwnedPath(manifest.objectPath, userId);
  if (!ownership.ok) {
    throw new Error("Refusing to download — object path is not owned by the signed-in user.");
  }
  const { data, error } = await supabase.storage.from(BUCKET).download(manifest.objectPath);
  if (error || data === null) {
    throw new Error(error?.message ?? "Download failed.");
  }
  return await data.text();
}

export async function deleteBackup(manifest: BackupManifestRow): Promise<void> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const userId = await requireSignedInUserId();
  const ownership = validateOwnedPath(manifest.objectPath, userId);
  if (!ownership.ok) {
    throw new Error("Refusing to delete — object path is not owned by the signed-in user.");
  }
  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([manifest.objectPath]);
  if (storageError) throw new Error(storageError.message);

  const { error: dbError } = await supabase.from(TABLE).delete().eq("id", manifest.id);
  if (dbError) throw new Error(dbError.message);
}
