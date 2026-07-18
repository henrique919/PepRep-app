/**
 * Encrypted backup file format — local-first, no account (OD-4 / T1.7).
 */

export const BACKUP_MAGIC = "PEPREP-BACKUP" as const;
export const BACKUP_FORMAT_VERSION = 1 as const;
export const BACKUP_KDF = "pbkdf2-sha256" as const;
export const BACKUP_PBKDF2_ITERATIONS = 210_000;
/** Reject restore/parse of ciphertext envelopes larger than this (UTF-8 bytes). */
export const BACKUP_MAX_FILE_BYTES = 8 * 1024 * 1024;

export type BackupManifest = {
  schemaVersion: number;
  appVersion: string;
  createdAtIso: string;
  /** SHA-256 hex of the UTF-8 plaintext JSON. */
  checksumSha256: string;
  byteLength: number;
  /** Counts for restore preview — no PII beyond counts. */
  counts: {
    vials: number;
    doses: number;
    events: number;
    txns: number;
    plans: number;
    reminders: number;
  };
};

/** Plaintext payload restored into local stores. */
export type BackupPayload = {
  schemaVersion: number;
  exportedAtIso: string;
  vials: unknown[];
  doses: unknown[];
  doseEvents: unknown[];
  inventoryTxns: unknown[];
  plans: unknown[];
  reminders: unknown[];
};

export type EncryptedBackupFile = {
  magic: typeof BACKUP_MAGIC;
  version: typeof BACKUP_FORMAT_VERSION;
  kdf: typeof BACKUP_KDF;
  iterations: number;
  saltB64: string;
  ivB64: string;
  ciphertextB64: string;
  manifest: BackupManifest;
};

export type BackupValidationOk = {
  ok: true;
  file: EncryptedBackupFile;
  plaintext: BackupPayload;
};

export type BackupValidationErr = {
  ok: false;
  reason:
    | "invalid-json"
    | "bad-magic"
    | "unsupported-version"
    | "wrong-password"
    | "checksum-mismatch"
    | "corrupt"
    | "schema-too-new"
    | "oversized";
  message: string;
};

export type BackupValidationResult = BackupValidationOk | BackupValidationErr;
