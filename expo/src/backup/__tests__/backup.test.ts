import {
  buildBackupPayload,
  createEncryptedBackup,
  decryptAndValidateBackup,
  encryptedBackupFileName,
  serializeBackupFile,
} from "../codec";
import { encryptUtf8With, sha256Hex } from "../crypto";
import { BACKUP_MAGIC, BACKUP_MAX_FILE_BYTES } from "../types";

describe("encrypted backup round-trip", () => {
  it("encrypts and restores an identical payload", () => {
    const payload = buildBackupPayload({
      vials: [{ id: "v1", name: "Mine" }],
      doses: [{ id: "d1" }],
      doseEvents: [],
      inventoryTxns: [{ id: "t1" }],
      plans: [],
      reminders: [],
      exportedAtIso: "2026-07-18T12:00:00.000Z",
    });
    const file = createEncryptedBackup(payload, "correct-horse-battery");
    expect(file.magic).toBe(BACKUP_MAGIC);
    expect(file.manifest.counts.vials).toBe(1);
    expect(file.manifest.checksumSha256).toBe(sha256Hex(JSON.stringify(payload)));

    const raw = serializeBackupFile(file);
    const result = decryptAndValidateBackup(raw, "correct-horse-battery");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plaintext.vials).toEqual(payload.vials);
      expect(result.plaintext.doses).toEqual(payload.doses);
    }
  });

  it("rejects a wrong password without throwing", () => {
    const payload = buildBackupPayload({
      vials: [],
      doses: [],
      doseEvents: [],
      inventoryTxns: [],
      plans: [],
      reminders: [],
      exportedAtIso: "2026-07-18T12:00:00.000Z",
    });
    const raw = serializeBackupFile(createEncryptedBackup(payload, "secret"));
    const result = decryptAndValidateBackup(raw, "nope");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("wrong-password");
  });

  it("rejects tampered ciphertext via checksum", () => {
    const payload = buildBackupPayload({
      vials: [{ id: "v1" }],
      doses: [],
      doseEvents: [],
      inventoryTxns: [],
      plans: [],
      reminders: [],
      exportedAtIso: "2026-07-18T12:00:00.000Z",
    });
    const file = createEncryptedBackup(payload, "secret");
    // Flip a character in the ciphertext blob.
    const chars = file.ciphertextB64.split("");
    chars[10] = chars[10] === "A" ? "B" : "A";
    file.ciphertextB64 = chars.join("");
    const result = decryptAndValidateBackup(JSON.stringify(file), "secret");
    expect(result.ok).toBe(false);
  });

  it("uses a PII-free backup filename", () => {
    expect(encryptedBackupFileName("2026-07-18")).toBe("peprep-backup-2026-07-18.peprep.json");
  });

  it("rejects oversized envelopes before parse work", () => {
    const huge = "x".repeat(BACKUP_MAX_FILE_BYTES + 1);
    const result = decryptAndValidateBackup(huge, "pw");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("oversized");
  });

  it("rejects truncated / invalid JSON", () => {
    const result = decryptAndValidateBackup("{not-json", "pw");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid-json");
  });

  it("rejects unsupported future format versions", () => {
    const payload = buildBackupPayload({
      vials: [],
      doses: [],
      doseEvents: [],
      inventoryTxns: [],
      plans: [],
      reminders: [],
      exportedAtIso: "2026-07-18T12:00:00.000Z",
    });
    const file = createEncryptedBackup(payload, "secret");
    const future = { ...file, version: 99 };
    const result = decryptAndValidateBackup(JSON.stringify(future), "secret");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("unsupported-version");
  });

  it("round-trips an empty dataset", () => {
    const payload = buildBackupPayload({
      vials: [],
      doses: [],
      doseEvents: [],
      inventoryTxns: [],
      plans: [],
      reminders: [],
      exportedAtIso: "2026-07-18T12:00:00.000Z",
    });
    const raw = serializeBackupFile(createEncryptedBackup(payload, "empty-ok"));
    const result = decryptAndValidateBackup(raw, "empty-ok");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plaintext.vials).toEqual([]);
      expect(result.file.manifest.counts.vials).toBe(0);
    }
  });
});

describe("encryptUtf8With", () => {
  it("is deterministic for fixed salt/iv", () => {
    const salt = new Uint8Array(16).fill(1);
    const iv = new Uint8Array(12).fill(2);
    const a = encryptUtf8With("hello", "pw", salt, iv, 1000);
    const b = encryptUtf8With("hello", "pw", salt, iv, 1000);
    expect(a).toEqual(b);
  });
});
