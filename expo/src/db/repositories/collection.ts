/**
 * Generic JSON collection persisted through the StorageAdapter.
 * Repositories are the only code that touches storage keys.
 */

import { getStorage, STORAGE_PREFIX } from "../adapter";

export interface CollectionRepository<T extends { id: string }> {
  list(): Promise<T[]>;
  saveAll(items: T[]): Promise<void>;
}

function hasStringId(value: unknown): value is { id: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof (value as { id: unknown }).id === "string"
  );
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
        const raw = await getStorage().getItem(key);
        if (raw === null) return [];
        const parsed: unknown = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(hasStringId) as T[];
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
