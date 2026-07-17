/**
 * Versioned local schema. Run once at startup before any repository is read.
 * Migrations are ordered and forward-only; each step commits its version
 * number before the next runs.
 */

import { getStorage, STORAGE_PREFIX } from "./adapter";
import { migrateV1 } from "./migrate-v1";
import {
  doseEventsRepository,
  dosesRepository,
  txnsRepository,
  vialsRepository,
} from "./repositories";

export const SCHEMA_VERSION = 3;

const VERSION_KEY = `${STORAGE_PREFIX}schemaVersion`;

/**
 * v1 → v2: derive the DoseEvent history and InventoryTxn ledger from the
 * legacy vials + doses collections. The legacy collections are left intact
 * (the current screens still read them) — nothing is deleted or rewritten,
 * so the migration is loss-free by construction.
 */
async function migrateV1toV2(): Promise<void> {
  const [vials, doses, existingEvents, existingTxns] = await Promise.all([
    vialsRepository.list(),
    dosesRepository.list(),
    doseEventsRepository.list(),
    txnsRepository.list(),
  ]);

  // Guard against double back-fill if the version write ever failed mid-run.
  if (existingEvents.length > 0 || existingTxns.length > 0) return;

  const { doseEvents, txns, unmapped } = migrateV1(vials, doses);
  await doseEventsRepository.appendMany(doseEvents);
  await txnsRepository.appendMany(txns);
  for (const row of unmapped) {
    console.warn(`[db] v1→v2: kept dose row "${row.id}" but could not map it to a ledger txn`);
  }
}

/**
 * v2 → v3: additive optional `snapshotId` on Vial / DoseEntry / DoseEvent.
 * Existing JSON rows are left untouched; missing fields simply mean "no
 * linked CalcSnapshot". Loss-free by construction.
 */
async function migrateV2toV3(): Promise<void> {
  return undefined;
}

const MIGRATIONS: { to: number; run: () => Promise<void> }[] = [
  // v0 → v1: initial schema; nothing to transform.
  { to: 1, run: async () => undefined },
  { to: 2, run: migrateV1toV2 },
  { to: 3, run: migrateV2toV3 },
];

export async function runMigrations(): Promise<void> {
  const storage = getStorage();
  try {
    const raw = await storage.getItem(VERSION_KEY);
    let current = raw !== null ? Number.parseInt(raw, 10) : 0;
    if (!Number.isFinite(current)) current = 0;

    for (const migration of MIGRATIONS) {
      if (current >= migration.to) continue;
      await migration.run();
      await storage.setItem(VERSION_KEY, String(migration.to));
      current = migration.to;
    }
  } catch (error) {
    console.error("[db] Migration failed", error);
  }
}
