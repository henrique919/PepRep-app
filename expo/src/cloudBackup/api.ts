/**
 * Optional Supabase encrypted cloud backup — network operations (PF6).
 *
 * Every exported function calls `assertPepRepProjectRef()` first and aborts if the configured
 * project ref is not PepRep's own (`opbqlsmwljqkkdvguojh`). This module only ever handles
 * ciphertext produced by `src/backup/codec.ts` (`createEncryptedBackup` / `serializeBackupFile`)
 * — it never sees a passphrase, a derived key, or plaintext health data. Manifests stored in
 * Postgres hold only non-health metadata (size, checksum, versions, timestamp, device label).
 */
import * as Linking from "expo-linking";

import { getSupabase } from "./client";
import { assertPepRepProjectRef } from "./config";
import { generateBackupId, objectPath, validateOwnedPath } from "./paths";

/** Deep-link target for magic-link / confirm-email redirects (must be allow-listed in Supabase). */
export function getAuthRedirectUrl(): string {
  return Linking.createURL("auth/callback");
}

function parseAuthCallbackParams(url: string): Record<string, string> {
  const hash = url.includes("#") ? (url.split("#")[1] ?? "") : "";
  const queryPart = url.includes("?") ? (url.split("?")[1]?.split("#")[0] ?? "") : "";
  const combined = hash.length > 0 ? hash : queryPart;
  const params: Record<string, string> = {};
  for (const pair of combined.split("&")) {
    if (pair.length === 0) continue;
    const [rawKey, rawValue = ""] = pair.split("=");
    if (rawKey === undefined || rawKey.length === 0) continue;
    params[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
  }
  return params;
}

/**
 * Completes sign-in when the user opens a Supabase magic/confirm link that deep-links into the app.
 * Supports implicit tokens (`access_token` + `refresh_token`) and PKCE (`code`).
 */
export async function createSessionFromUrl(url: string): Promise<ApiResult<null>> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const params = parseAuthCallbackParams(url);
  if (params.error !== undefined || params.error_description !== undefined) {
    return {
      ok: false,
      message: params.error_description ?? params.error ?? "Sign-in link failed.",
    };
  }
  if (params.code !== undefined && params.code.length > 0) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) return { ok: false, message: error.message };
    return { ok: true, value: null };
  }
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken !== undefined && refreshToken !== undefined) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) return { ok: false, message: error.message };
    return { ok: true, value: null };
  }
  return { ok: false, message: "Sign-in link did not include a session." };
}

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

/**
 * Sends a magic-link email (default Supabase template). Prefer opening the link on this device;
 * optional 6-digit OTP works only if the project email template includes `{{ .Token }}`.
 */
export async function signInWithOtp(email: string): Promise<ApiResult<null>> {
  assertPepRepProjectRef();
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: getAuthRedirectUrl(),
    },
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate limit") || message.includes("email rate")) {
      return {
        ok: false,
        message:
          "Email send limit reached (Supabase default mail is capped). Wait about an hour, or use an address you already confirmed, or set custom SMTP.",
      };
    }
    return { ok: false, message: error.message };
  }
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
