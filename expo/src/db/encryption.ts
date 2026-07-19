import { gcm } from "@noble/ciphers/aes";
import { utf8ToBytes } from "@noble/hashes/utils";

import { base64ToBytes, bytesToBase64 } from "../backup/crypto";

export const LOCAL_STORAGE_ENVELOPE_PREFIX = "peprep-enc-v1:";
export const LOCAL_STORAGE_KEY_BYTES = 32;
export const LOCAL_STORAGE_IV_BYTES = 12;

export function isEncryptedStorageValue(value: string): boolean {
  return value.startsWith(LOCAL_STORAGE_ENVELOPE_PREFIX);
}

export function encryptStorageValue(
  plaintext: string,
  key: Uint8Array,
  iv: Uint8Array,
): string {
  if (key.length !== LOCAL_STORAGE_KEY_BYTES) throw new Error("Invalid local storage key.");
  if (iv.length !== LOCAL_STORAGE_IV_BYTES) throw new Error("Invalid local storage nonce.");

  const ciphertext = gcm(key, iv).encrypt(utf8ToBytes(plaintext));
  const envelope = new Uint8Array(iv.length + ciphertext.length);
  envelope.set(iv, 0);
  envelope.set(ciphertext, iv.length);
  return `${LOCAL_STORAGE_ENVELOPE_PREFIX}${bytesToBase64(envelope)}`;
}

export function decryptStorageValue(value: string, key: Uint8Array): string {
  if (!isEncryptedStorageValue(value)) throw new Error("Unsupported local storage envelope.");
  if (key.length !== LOCAL_STORAGE_KEY_BYTES) throw new Error("Invalid local storage key.");

  const envelope = base64ToBytes(value.slice(LOCAL_STORAGE_ENVELOPE_PREFIX.length));
  if (envelope.length <= LOCAL_STORAGE_IV_BYTES) throw new Error("Invalid local storage envelope.");

  const iv = envelope.slice(0, LOCAL_STORAGE_IV_BYTES);
  const ciphertext = envelope.slice(LOCAL_STORAGE_IV_BYTES);
  const plaintext = gcm(key, iv).decrypt(ciphertext);
  return new TextDecoder().decode(plaintext);
}
