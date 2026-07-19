/**
 * StorageAdapter — the only boundary between PepRep and on-device persistence.
 * Local-first: calculator, inventory, history, and settings live here with no
 * cloud sync. Optional Ask (when the user enables it) may call Rork AI Cloud
 * for reference answers — that path does not go through this adapter.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

import { base64ToBytes, bytesToBase64 } from "../backup/crypto";
import { getSecureRandomBytes } from "../util/secureRandom";

import {
  decryptStorageValue,
  encryptStorageValue,
  isEncryptedStorageValue,
  LOCAL_STORAGE_IV_BYTES,
  LOCAL_STORAGE_KEY_BYTES,
} from "./encryption";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export const STORAGE_PREFIX = "peprep.";
const DEVICE_KEY_NAME = "peprep-local-storage-key-v1";

type SecureStoreModule = typeof import("expo-secure-store");
let deviceKeyPromise: Promise<Uint8Array> | null = null;

function isBrowser(): boolean {
  return typeof document !== "undefined";
}

function getSecureStore(): SecureStoreModule {
  // Native-only lazy import keeps the web and Jest paths independent of Keychain/Keystore.
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- native-only Expo module
  return require("expo-secure-store") as SecureStoreModule;
}

async function getOrCreateDeviceKey(): Promise<Uint8Array> {
  if (deviceKeyPromise !== null) return deviceKeyPromise;

  deviceKeyPromise = (async () => {
    const secureStore = getSecureStore();
    const existing = await secureStore.getItemAsync(DEVICE_KEY_NAME);
    if (existing !== null) {
      const key = base64ToBytes(existing);
      if (key.length !== LOCAL_STORAGE_KEY_BYTES) {
        throw new Error("PepRep's local encryption key is invalid.");
      }
      return key;
    }

    const key = getSecureRandomBytes(LOCAL_STORAGE_KEY_BYTES);
    await secureStore.setItemAsync(DEVICE_KEY_NAME, bytesToBase64(key), {
      keychainAccessible: secureStore.WHEN_UNLOCKED,
    });
    return key;
  })().catch((error: unknown) => {
    deviceKeyPromise = null;
    throw error;
  });

  return deviceKeyPromise;
}

async function removeDeviceKey(): Promise<void> {
  if (isBrowser()) return;
  await getSecureStore().deleteItemAsync(DEVICE_KEY_NAME);
  deviceKeyPromise = null;
}

class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    if (stored === null || isBrowser()) return stored;

    const deviceKey = await getOrCreateDeviceKey();
    if (isEncryptedStorageValue(stored)) {
      try {
        return decryptStorageValue(stored, deviceKey);
      } catch {
        throw new Error("PepRep could not decrypt local data. The stored record was not changed.");
      }
    }

    // Migrate legacy plaintext on first read without changing the public storage contract.
    await this.setItem(key, stored);
    return stored;
  }
  async setItem(key: string, value: string): Promise<void> {
    if (isBrowser()) {
      await AsyncStorage.setItem(key, value);
      return;
    }

    const deviceKey = await getOrCreateDeviceKey();
    const iv = getSecureRandomBytes(LOCAL_STORAGE_IV_BYTES);
    await AsyncStorage.setItem(key, encryptStorageValue(value, deviceKey, iv));
  }
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  }
  async getAllKeys(): Promise<string[]> {
    const keys = await AsyncStorage.getAllKeys();
    return [...keys];
  }
}

/** In-memory adapter used by tests; never touches the device. */
export class MemoryStorageAdapter implements StorageAdapter {
  private readonly store = new Map<string, string>();

  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
  async getAllKeys(): Promise<string[]> {
    return [...this.store.keys()];
  }
}

let activeAdapter: StorageAdapter = new AsyncStorageAdapter();

export function getStorage(): StorageAdapter {
  return activeAdapter;
}

/** Swaps the backing store (tests only). */
export function setStorageAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}

/** Removes every PepRep key from the device. Irreversible. */
export async function clearAllData(): Promise<void> {
  const keys = await activeAdapter.getAllKeys();
  const ours = keys.filter((key) => key.startsWith(STORAGE_PREFIX));
  await Promise.all(ours.map((key) => activeAdapter.removeItem(key)));
  if (activeAdapter instanceof AsyncStorageAdapter) await removeDeviceKey();
}
