/**
 * StorageAdapter — the only boundary between PepRep and the device.
 * Everything is stored locally; there is no network anywhere in the app.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

export const STORAGE_PREFIX = "peprep.";

class AsyncStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  }
  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
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
}
