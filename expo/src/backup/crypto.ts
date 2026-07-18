/**
 * Password-based AES-256-GCM for backup files.
 * Pure JS (@noble) — runs in Jest and Expo without native crypto modules.
 */

import { gcm } from "@noble/ciphers/aes";
import { pbkdf2 } from "@noble/hashes/pbkdf2";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";

import { BACKUP_PBKDF2_ITERATIONS } from "./types";

const KEY_LEN = 32;
const IV_LEN = 12;
const SALT_LEN = 16;

function getRandomBytes(length: number): Uint8Array {
  const out = new Uint8Array(length);
  // Prefer Web Crypto when available (Expo / modern browsers).
  const subtleCrypto = globalThis.crypto;
  if (subtleCrypto !== undefined && typeof subtleCrypto.getRandomValues === "function") {
    subtleCrypto.getRandomValues(out);
    return out;
  }
  // Node / Jest fallback.
  const nodeCrypto = require("crypto") as typeof import("crypto");
  return new Uint8Array(nodeCrypto.randomBytes(length));
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function sha256Hex(text: string): string {
  return bytesToHex(sha256(utf8ToBytes(text)));
}

export function deriveKey(
  password: string,
  salt: Uint8Array,
  iterations: number = BACKUP_PBKDF2_ITERATIONS,
): Uint8Array {
  return pbkdf2(sha256, utf8ToBytes(password), salt, {
    c: iterations,
    dkLen: KEY_LEN,
  });
}

export type EncryptResult = {
  salt: Uint8Array;
  iv: Uint8Array;
  ciphertext: Uint8Array;
  iterations: number;
};

export function encryptUtf8(plaintext: string, password: string): EncryptResult {
  const salt = getRandomBytes(SALT_LEN);
  const iv = getRandomBytes(IV_LEN);
  const key = deriveKey(password, salt);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(utf8ToBytes(plaintext));
  return { salt, iv, ciphertext, iterations: BACKUP_PBKDF2_ITERATIONS };
}

export function decryptUtf8(
  ciphertext: Uint8Array,
  password: string,
  salt: Uint8Array,
  iv: Uint8Array,
  iterations: number,
): string | null {
  try {
    const key = deriveKey(password, salt, iterations);
    const cipher = gcm(key, iv);
    const plain = cipher.decrypt(ciphertext);
    return new TextDecoder().decode(plain);
  } catch {
    return null;
  }
}

/** Exported for tests that need deterministic vectors. */
export function encryptUtf8With(
  plaintext: string,
  password: string,
  salt: Uint8Array,
  iv: Uint8Array,
  iterations: number = BACKUP_PBKDF2_ITERATIONS,
): Uint8Array {
  const key = deriveKey(password, salt, iterations);
  return gcm(key, iv).encrypt(utf8ToBytes(plaintext));
}
