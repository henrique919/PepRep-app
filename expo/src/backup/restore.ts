/**
 * Apply a validated backup payload to local storage.
 * Caller must confirm with the user first — never silent overwrite.
 */

import type { DoseEntry, Reminder, Vial } from "../db/models";
import { normaliseVialRecord } from "../db/normaliseVial";
import { createCollectionRepository } from "../db/repositories/collection";
import type { DoseEvent, InventoryTxn, Plan } from "../db/types";
import type { BackupPayload } from "./types";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function applyBackupPayload(payload: BackupPayload): Promise<void> {
  const vials = asArray<Vial>(payload.vials).map(normaliseVialRecord);
  const doses = asArray<DoseEntry>(payload.doses);
  const events = asArray<DoseEvent>(payload.doseEvents);
  const txns = asArray<InventoryTxn>(payload.inventoryTxns);
  const plans = asArray<Plan>(payload.plans);
  const reminders = asArray<Reminder>(payload.reminders);

  const vialsRepo = createCollectionRepository<Vial>("vials");
  const dosesRepo = createCollectionRepository<DoseEntry>("doses");
  const eventsRepo = createCollectionRepository<DoseEvent>("doseEvents");
  const txnsRepo = createCollectionRepository<InventoryTxn>("inventoryTxns");
  const plansRepo = createCollectionRepository<Plan>("plans");
  const remindersRepo = createCollectionRepository<Reminder>("reminders");

  await Promise.all([
    vialsRepo.saveAll(vials),
    dosesRepo.saveAll(doses),
    eventsRepo.saveAll(events),
    txnsRepo.saveAll(txns),
    plansRepo.saveAll(plans),
    remindersRepo.saveAll(reminders),
  ]);
}
