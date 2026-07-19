import {
  decryptStorageValue,
  encryptStorageValue,
  isEncryptedStorageValue,
  LOCAL_STORAGE_ENVELOPE_PREFIX,
} from "../encryption";
import { base64ToBytes, bytesToBase64 } from "../../backup/crypto";

describe("native local-storage encryption", () => {
  const key = new Uint8Array(32).fill(7);
  const iv = new Uint8Array(12).fill(3);

  it("round-trips UTF-8 without exposing plaintext", () => {
    const plaintext = JSON.stringify({ compound: "Example peptide", note: "private ✓" });
    const encrypted = encryptStorageValue(plaintext, key, iv);

    expect(isEncryptedStorageValue(encrypted)).toBe(true);
    expect(encrypted).not.toContain("Example peptide");
    expect(decryptStorageValue(encrypted, key)).toBe(plaintext);
  });

  it("rejects modified authenticated ciphertext", () => {
    const encrypted = encryptStorageValue("sensitive", key, iv);
    const envelope = base64ToBytes(encrypted.slice(LOCAL_STORAGE_ENVELOPE_PREFIX.length));
    const tamperIndex = LOCAL_STORAGE_ENVELOPE_PREFIX.length % envelope.length;
    envelope[tamperIndex] = envelope[tamperIndex]! ^ 1;
    const tampered = `${LOCAL_STORAGE_ENVELOPE_PREFIX}${bytesToBase64(envelope)}`;

    expect(() => decryptStorageValue(tampered, key)).toThrow();
  });

  it("does not mistake legacy plaintext for an encrypted envelope", () => {
    expect(isEncryptedStorageValue('{"legacy":true}')).toBe(false);
    expect(isEncryptedStorageValue(LOCAL_STORAGE_ENVELOPE_PREFIX)).toBe(true);
  });
});
