import type { DoseEntry, Reminder, Vial } from "../models";
import { normaliseVialRecord } from "../normaliseVial";
import type { CalcSnapshot, DoseEvent, InventoryTxn, Plan } from "../types";
import { createAppendOnlyRepository, createCollectionRepository } from "./collection";

const vialsCollection = createCollectionRepository<Vial>("vials");

/** Vials collection with additive-field normalisation for schema v4+. */
export const vialsRepository = {
  async list(): Promise<Vial[]> {
    const rows = await vialsCollection.list();
    return rows.map(normaliseVialRecord);
  },
  async saveAll(items: Vial[]): Promise<void> {
    await vialsCollection.saveAll(items.map(normaliseVialRecord));
  },
};
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
        ? {
            ...event,
            voidedAt: voidedAtIso,
            corrections: [
              ...(event.corrections ?? []),
              { id: `void-${id}-${voidedAtIso}`, type: "void" as const, occurredAt: voidedAtIso },
            ],
          }
        : event,
    );
    await doseEventsCollection.saveAll(next);
  },

  async markRestored(id: string, restoredAtIso: string): Promise<void> {
    const events = await doseEventsCollection.list();
    const next = events.map((event) => {
      if (event.id !== id || event.voidedAt === undefined) return event;
      const { voidedAt: _voidedAt, ...activeEvent } = event;
      return {
        ...activeEvent,
        corrections: [
          ...(event.corrections ?? []),
          { id: `restore-${id}-${restoredAtIso}`, type: "restore" as const, occurredAt: restoredAtIso },
        ],
      };
    });
    await doseEventsCollection.saveAll(next);
  },
};
