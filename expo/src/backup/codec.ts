/**
 * Build / parse encrypted PepRep backup files.
 */

import { SCHEMA_VERSION } from "../db/schemaVersion";

import {
  base64ToBytes,
  bytesToBase64,
  decryptUtf8,
  encryptUtf8,
  sha256Hex,
} from "./crypto";
import type {
  BackupManifest,
  BackupPayload,
  BackupValidationResult,
  EncryptedBackupFile,
} from "./types";
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_KDF,
  BACKUP_MAGIC,
  BACKUP_MAX_FILE_BYTES,
} from "./types";

const APP_VERSION = "1.0.0";

export function buildBackupPayload(input: {
  vials: unknown[];
  doses: unknown[];
  doseEvents: unknown[];
  inventoryTxns: unknown[];
  plans: unknown[];
  reminders: unknown[];
  exportedAtIso: string;
}): BackupPayload {
  return {
    schemaVersion: SCHEMA_VERSION,
    exportedAtIso: input.exportedAtIso,
    vials: input.vials,
    doses: input.doses,
    doseEvents: input.doseEvents,
    inventoryTxns: input.inventoryTxns,
    plans: input.plans,
    reminders: input.reminders,
  };
}

export function buildManifest(plaintext: string, payload: BackupPayload): BackupManifest {
  return {
    schemaVersion: payload.schemaVersion,
    appVersion: APP_VERSION,
    createdAtIso: payload.exportedAtIso,
    checksumSha256: sha256Hex(plaintext),
    byteLength: new TextEncoder().encode(plaintext).length,
    counts: {
      vials: payload.vials.length,
      doses: payload.doses.length,
      events: payload.doseEvents.length,
      txns: payload.inventoryTxns.length,
      plans: payload.plans.length,
      reminders: payload.reminders.length,
    },
  };
}

export function createEncryptedBackup(
  payload: BackupPayload,
  password: string,
): EncryptedBackupFile {
  const plaintext = JSON.stringify(payload);
  const encrypted = encryptUtf8(plaintext, password);
  return {
    magic: BACKUP_MAGIC,
    version: BACKUP_FORMAT_VERSION,
    kdf: BACKUP_KDF,
    iterations: encrypted.iterations,
    saltB64: bytesToBase64(encrypted.salt),
    ivB64: bytesToBase64(encrypted.iv),
    ciphertextB64: bytesToBase64(encrypted.ciphertext),
    manifest: buildManifest(plaintext, payload),
  };
}

export function serializeBackupFile(file: EncryptedBackupFile): string {
  return `${JSON.stringify(file, null, 2)}\n`;
}

export function parseBackupFileJson(raw: string): EncryptedBackupFile | null {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (obj.magic !== BACKUP_MAGIC) return null;
    if (obj.version !== BACKUP_FORMAT_VERSION) return null;
    if (obj.kdf !== BACKUP_KDF) return null;
    if (typeof obj.iterations !== "number") return null;
    if (typeof obj.saltB64 !== "string") return null;
    if (typeof obj.ivB64 !== "string") return null;
    if (typeof obj.ciphertextB64 !== "string") return null;
    if (typeof obj.manifest !== "object" || obj.manifest === null) return null;
    return obj as EncryptedBackupFile;
  } catch {
    return null;
  }
}

export function decryptAndValidateBackup(
  rawFile: string,
  password: string,
): BackupValidationResult {
  if (new TextEncoder().encode(rawFile).length > BACKUP_MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: "oversized",
      message: "This backup file is too large to restore safely.",
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawFile);
  } catch {
    return {
      ok: false,
      reason: "invalid-json",
      message: "This file is not valid JSON.",
    };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, reason: "corrupt", message: "Backup file is corrupt." };
  }

  const obj = parsed as Record<string, unknown>;
  if (obj.magic !== BACKUP_MAGIC) {
    return {
      ok: false,
      reason: "bad-magic",
      message: "This is not a PepRep backup file.",
    };
  }
  if (typeof obj.version !== "number" || obj.version > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      reason: "unsupported-version",
      message: "This backup was made with a newer PepRep and cannot be opened here.",
    };
  }
  if (obj.version !== BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      reason: "unsupported-version",
      message: "Unsupported backup version.",
    };
  }

  const file = parseBackupFileJson(rawFile);
  if (file === null) {
    return { ok: false, reason: "corrupt", message: "Backup file is corrupt." };
  }

  if (file.manifest.schemaVersion > SCHEMA_VERSION) {
    return {
      ok: false,
      reason: "schema-too-new",
      message: "This backup needs a newer PepRep to restore.",
    };
  }

  const plaintext = decryptUtf8(
    base64ToBytes(file.ciphertextB64),
    password,
    base64ToBytes(file.saltB64),
    base64ToBytes(file.ivB64),
    file.iterations,
  );
  if (plaintext === null) {
    return {
      ok: false,
      reason: "wrong-password",
      message: "Wrong password, or the file is damaged.",
    };
  }

  if (sha256Hex(plaintext) !== file.manifest.checksumSha256) {
    return {
      ok: false,
      reason: "checksum-mismatch",
      message: "Backup checksum failed — file may be tampered or truncated.",
    };
  }

  if (plaintext.length !== file.manifest.byteLength) {
    return {
      ok: false,
      reason: "checksum-mismatch",
      message: "Backup size does not match the manifest.",
    };
  }

  let payload: BackupPayload;
  try {
    payload = JSON.parse(plaintext) as BackupPayload;
  } catch {
    return { ok: false, reason: "corrupt", message: "Decrypted payload is not valid JSON." };
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !Array.isArray(payload.vials) ||
    !Array.isArray(payload.doses)
  ) {
    return { ok: false, reason: "corrupt", message: "Decrypted payload is missing required data." };
  }

  return { ok: true, file, plaintext: payload };
}

/** Filename with no PII — date stamp only. */
export function encryptedBackupFileName(dayKey: string): string {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(dayKey) ? dayKey : "undated";
  return `peprep-backup-${day}.peprep.json`;
}
