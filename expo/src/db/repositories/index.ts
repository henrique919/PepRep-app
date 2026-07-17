import type { DoseEntry, Reminder, Vial } from "../models";
import type { CalcSnapshot, DoseEvent, InventoryTxn, Plan } from "../types";
import { createAppendOnlyRepository, createCollectionRepository } from "./collection";

export const vialsRepository = createCollectionRepository<Vial>("vials");
export const dosesRepository = createCollectionRepository<DoseEntry>("doses");
export const remindersRepository = createCollectionRepository<Reminder>("reminders");

/** Inventory ledger — append-only. Balances are derived, never edited. */
export const txnsRepository = createAppendOnlyRepository<InventoryTxn>("inventoryTxns");

/** Saved calculator snapshots — append-only. */
export const snapshotsRepository = createAppendOnlyRepository<CalcSnapshot>("calcSnapshots");

/** Plans (with their appended ScheduleVersions). */
export const plansRepository = createCollectionRepository<Plan>("plans");

const doseEventsCollection = createCollectionRepository<DoseEvent>("doseEvents");
const doseEventsAppendOnly = createAppendOnlyRepository<DoseEvent>("doseEvents");

/**
 * Dose events — append-only, with exactly ONE permitted mutation: setting
 * `voidedAt` when a dose is un-logged. Events are never deleted and no other
 * field is ever updated after the fact.
 */
export const doseEventsRepository = {
  list: (): Promise<DoseEvent[]> => doseEventsAppendOnly.list(),
  append: (event: DoseEvent): Promise<void> => doseEventsAppendOnly.append(event),
  appendMany: (events: DoseEvent[]): Promise<void> => doseEventsAppendOnly.appendMany(events),

  async markVoided(id: string, voidedAtIso: string): Promise<void> {
    const events = await doseEventsCollection.list();
    const next = events.map((event) =>
      event.id === id && event.voidedAt === undefined
        ? { ...event, voidedAt: voidedAtIso }
        : event,
    );
    await doseEventsCollection.saveAll(next);
  },
};
