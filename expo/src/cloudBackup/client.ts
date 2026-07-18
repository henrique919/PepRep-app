/**
 * Supabase client for optional cloud backup (PF6).
 *
 * Only ever constructed on demand via `getSupabase()`, which calls `assertPepRepProjectRef()`
 * first — nothing here initializes a network client at module load time, and local-only mode
 * (no `EXPO_PUBLIC_SUPABASE_*` env vars) never touches this file's client at all.
 *
 * Session tokens are stored via `expo-secure-store` (iOS Keychain / Android Keystore), never
 * AsyncStorage. SecureStore values are capped at ~2048 bytes, so the adapter below chunks
 * larger values (Supabase sessions routinely exceed that with a refresh token attached).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";

import { assertPepRepProjectRef } from "./config";

const SESSION_STORAGE_KEY = "peprep-cloud-backup-session";
/** Stay comfortably under SecureStore's ~2048-byte-per-value limit. */
const CHUNK_SIZE = 1600;

function chunkString(value: string, size: number): string[] {
  const chunks: string[] = [];
  for (let index = 0; index < value.length; index += size) {
    chunks.push(value.slice(index, index + size));
  }
  return chunks.length > 0 ? chunks : [""];
}

const chunkedSecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await SecureStore.getItemAsync(`${key}__count`);
    if (countRaw === null) return null;
    const count = Number.parseInt(countRaw, 10);
    if (!Number.isFinite(count) || count <= 0) return null;
    const parts: string[] = [];
    for (let index = 0; index < count; index += 1) {
      const part = await SecureStore.getItemAsync(`${key}__${index}`);
      if (part === null) return null;
      parts.push(part);
    }
    return parts.join("");
  },
  async setItem(key: string, value: string): Promise<void> {
    await chunkedSecureStoreAdapter.removeItem(key);
    const chunks = chunkString(value, CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}__count`, String(chunks.length));
    await Promise.all(
      chunks.map((chunk, index) => SecureStore.setItemAsync(`${key}__${index}`, chunk)),
    );
  },
  async removeItem(key: string): Promise<void> {
    const countRaw = await SecureStore.getItemAsync(`${key}__count`);
    const count = countRaw !== null ? Number.parseInt(countRaw, 10) : 0;
    const deletions: Promise<void>[] = [SecureStore.deleteItemAsync(`${key}__count`)];
    for (let index = 0; index < count; index += 1) {
      deletions.push(SecureStore.deleteItemAsync(`${key}__${index}`));
    }
    await Promise.all(deletions);
  },
};

let cachedClient: SupabaseClient | null = null;
let cachedProjectRef: string | null = null;

/** Returns the shared Supabase client, guarded by the project-ref assertion on every call. */
export function getSupabase(): SupabaseClient {
  const config = assertPepRepProjectRef();
  if (cachedClient !== null && cachedProjectRef === config.projectRef) {
    return cachedClient;
  }
  cachedClient = createClient(config.url, config.anonKey, {
    auth: {
      storage: chunkedSecureStoreAdapter,
      storageKey: SESSION_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  cachedProjectRef = config.projectRef;
  return cachedClient;
}

/** Test/sign-out helper — drops the cached client so the next call re-validates config. */
export function resetSupabaseClient(): void {
  cachedClient = null;
  cachedProjectRef = null;
}
