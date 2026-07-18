/**
 * Generic JSON collection persisted through the StorageAdapter.
 * Repositories are the only code that touches storage keys.
 *
 * Corrupt payloads are quarantined (copied aside) and treated as empty /
 * filtered so hydrate never fatals the app.
 */

import { getStorage, STORAGE_PREFIX } from "../adapter";
import { parseCollectionJson } from "../parseCollection";

export interface CollectionRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  saveAll(items: T[]): Promise<void>;
}

export interface AppendOnlyRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  append(item: T): Promise<void>;
  appendMany(items: T[]): Promise<void>;
}

/**
 * Append-only view over a collection: no update, no delete. Used for the
 * inventory ledger and calc snapshots, which are immutable by design.
 */
export function createAppendOnlyRepository<T extends { id: string }>(
  name: string,
): AppendOnlyRepository<T> {
  const collection = createCollectionRepository<T>(name);
  return {
    list: () => collection.list(),
    async append(item: T): Promise<void> {
      const items = await collection.list();
      await collection.saveAll([...items, item]);
    },
    async appendMany(newItems: T[]): Promise<void> {
      if (newItems.length === 0) return;
      const items = await collection.list();
      await collection.saveAll([...items, ...newItems]);
    },
  };
}

export function createCollectionRepository<T extends { id: string }>(
  name: string,
): CollectionRepository<T> {
  const key = `${STORAGE_PREFIX}${name}`;

  return {
    async list(): Promise<T[]> {
      try {
        const storage = getStorage();
        const raw = await storage.getItem(key);
        const parsed = parseCollectionJson<T>(raw);
        if (parsed.quarantined && raw !== null) {
          const quarantineKey = `${key}.quarantine.${Date.now()}`;
          await storage.setItem(quarantineKey, raw);
          console.warn(
            `[db] Quarantined corrupt collection "${name}" → ${quarantineKey}` +
              (parsed.reason !== undefined ? ` (${parsed.reason})` : ""),
          );
          // Persist only the salvageable rows so the next read is clean.
          if (parsed.items.length > 0) {
            await storage.setItem(key, JSON.stringify(parsed.items));
          } else if (parsed.reason === "invalid-json" || parsed.reason === "not-array") {
            await storage.removeItem(key);
          }
        }
        return parsed.items;
      } catch (error) {
        console.error(`[db] Failed to read collection "${name}"`, error);
        return [];
      }
    },

    async saveAll(items: T[]): Promise<void> {
      try {
        await getStorage().setItem(key, JSON.stringify(items));
      } catch (error) {
        console.error(`[db] Failed to write collection "${name}"`, error);
      }
    },
  };
}
