/**
 * Ledger store — DoseEvents + InventoryTxns. Logging from Today writes one
 * denormalised DoseEvent and exactly one 'dose' txn against the chosen vial.
 * Un-log sets voidedAt and appends a compensating 'void' txn.
 */

import { create } from "zustand";

import { doseTxnForEvent, restoreTxnForEvent, voidTxnForEvent } from "@/src/db/ledger";
import type { DoseEntry, Vial } from "@/src/db/models";
import { createId } from "@/src/db/models";
import {
  doseEventsRepository,
  dosesRepository,
  snapshotsRepository,
  txnsRepository,
} from "@/src/db/repositories";
import { snapshotFromDraw } from "@/src/db/snapshot";
import type { DoseEvent, InventoryTxn } from "@/src/db/types";
import { calculateDraw, mgToMcg, type MassUnit } from "@/src/engine";
import { compareIsoDesc } from "@/src/engine/schedule";
import { useDosesStore } from "@/src/store/doses";

export interface LogOccurrenceInput {
  planId: string;
  scheduleVersionId: string;
  occurrenceKey: string;
  compoundName: string;
  doseValue: number;
  doseUnit: MassUnit;
  vialId?: string;
  note?: string;
  /** ISO timestamp; defaults to now if omitted. */
  occurredAt?: string;
  vial?: Vial;
}

interface LedgerState {
  events: DoseEvent[];
  txns: InventoryTxn[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  logOccurrence: (input: LogOccurrenceInput) => Promise<DoseEvent>;
  skipOccurrence: (input: Omit<LogOccurrenceInput, "vialId" | "vial" | "note">) => Promise<DoseEvent>;
  unlogEvent: (eventId: string) => Promise<void>;
  restoreEvent: (eventId: string) => Promise<void>;
  /** Append missed events from rollover (idempotent at the collector layer). */
  appendEvents: (events: DoseEvent[]) => Promise<void>;
  reset: () => void;
}

function sortEvents(events: DoseEvent[]): DoseEvent[] {
  return [...events].sort((a, b) => compareIsoDesc(a.occurredAt, b.occurredAt));
}

export const useLedgerStore = create<LedgerState>((set, get) => ({
  events: [],
  txns: [],
  hydrated: false,

  hydrate: async () => {
    const [events, txns] = await Promise.all([
      doseEventsRepository.list(),
      txnsRepository.list(),
    ]);
    set({ events: sortEvents(events), txns, hydrated: true });
  },

  logOccurrence: async (input) => {
    const existing = get().events.find(
      (event) => event.occurrenceKey === input.occurrenceKey && event.voidedAt === undefined,
    );
    if (existing !== undefined) return existing;

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const doseMcg =
      input.doseUnit === "mg" ? mgToMcg(input.doseValue) : input.doseValue;

    let volumeMl: number | undefined;
    let units: number | undefined;
    let snapshotId: string | undefined;
    if (input.vial !== undefined) {
      const drawInput = {
        vialMg: input.vial.vialMg,
        diluentMl: input.vial.diluentMl,
        doseValue: input.doseValue,
        doseUnit: input.doseUnit,
        syringeCapacityUnits: input.vial.syringeCapacityUnits,
      };
      const draw = calculateDraw(drawInput);
      if (draw.ok) {
        volumeMl = draw.volumeMl;
        units = draw.units;
        const snapshot = snapshotFromDraw(drawInput, draw, createId(), occurredAt);
        await snapshotsRepository.append(snapshot);
        snapshotId = snapshot.id;
      }
    }

    const event: DoseEvent = {
      id: createId(),
      planId: input.planId,
      scheduleVersionId: input.scheduleVersionId,
      occurrenceKey: input.occurrenceKey,
      status: "completed",
      compoundName: input.compoundName.trim(),
      doseValue: input.doseValue,
      doseUnit: input.doseUnit,
      doseMcg,
      volumeMl,
      units,
      vialId: input.vialId,
      occurredAt,
      note: input.note !== undefined && input.note.trim().length > 0 ? input.note.trim() : undefined,
      snapshotId,
    };

    await doseEventsRepository.append(event);
    const txn = doseTxnForEvent(event, createId());
    if (txn !== null) await txnsRepository.append(txn);

    // Dual-write DoseEntry so History (untouched) still sees the log.
    const entry: DoseEntry = {
      id: event.id,
      vialId: event.vialId ?? null,
      peptideName: event.compoundName,
      doseValue: event.doseValue,
      doseUnit: event.doseUnit,
      doseMcg,
      units: units ?? null,
      volumeMl: volumeMl ?? null,
      site: null,
      note: event.note ?? "",
      atIso: occurredAt,
      snapshotId,
    };
    const existingDoses = await dosesRepository.list();
    const nextDoses = [entry, ...existingDoses].sort((a, b) =>
      compareIsoDesc(a.atIso, b.atIso),
    );
    await dosesRepository.saveAll(nextDoses);
    useDosesStore.setState({ doses: nextDoses });

    const txns = txn !== null ? [...get().txns, txn] : get().txns;
    set({ events: sortEvents([event, ...get().events]), txns });
    return event;
  },

  skipOccurrence: async (input) => {
    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const doseMcg =
      input.doseUnit === "mg" ? mgToMcg(input.doseValue) : input.doseValue;
    const event: DoseEvent = {
      id: createId(),
      planId: input.planId,
      scheduleVersionId: input.scheduleVersionId,
      occurrenceKey: input.occurrenceKey,
      status: "skipped",
      compoundName: input.compoundName.trim(),
      doseValue: input.doseValue,
      doseUnit: input.doseUnit,
      doseMcg,
      occurredAt,
    };
    await doseEventsRepository.append(event);
    set({ events: sortEvents([event, ...get().events]) });
    return event;
  },

  unlogEvent: async (eventId) => {
    const existing = get().events.find((event) => event.id === eventId);
    if (existing === undefined || existing.voidedAt !== undefined) return;
    const voidedAt = new Date().toISOString();
    await doseEventsRepository.markVoided(eventId, voidedAt);
    const txns = await txnsRepository.list();
    const voidTxn = voidTxnForEvent(txns, eventId, createId(), voidedAt);
    if (voidTxn !== null) await txnsRepository.append(voidTxn);

    // Remove dual-written DoseEntry so History no longer shows it as active.
    // The DoseEvent itself is never deleted — only voidedAt is set.
    const doses = (await dosesRepository.list()).filter((dose) => dose.id !== eventId);
    await dosesRepository.saveAll(doses);
    useDosesStore.setState({ doses });

    const events = get().events.map((event) =>
      event.id === eventId ? { ...event, voidedAt } : event,
    );
    set({
      events: sortEvents(events),
      txns: voidTxn !== null ? [...get().txns, voidTxn] : get().txns,
    });
  },

  restoreEvent: async (eventId) => {
    const existing = get().events.find((event) => event.id === eventId);
    if (existing === undefined || existing.voidedAt === undefined) return;

    const restoredAt = new Date().toISOString();
    const txns = await txnsRepository.list();
    const restoreTxn = restoreTxnForEvent(txns, eventId, createId(), restoredAt);
    if (restoreTxn !== null) await txnsRepository.append(restoreTxn);
    await doseEventsRepository.markRestored(eventId, restoredAt);

    if (existing.status === "completed") {
      const doses = await dosesRepository.list();
      if (!doses.some((dose) => dose.id === existing.id)) {
        const restoredDose: DoseEntry = {
          id: existing.id,
          vialId: existing.vialId ?? null,
          peptideName: existing.compoundName,
          doseValue: existing.doseValue,
          doseUnit: existing.doseUnit,
          doseMcg:
            existing.doseMcg ??
            (existing.doseUnit === "mg" ? mgToMcg(existing.doseValue) : existing.doseValue),
          units: existing.units ?? null,
          volumeMl: existing.volumeMl ?? null,
          site: (existing.siteId as DoseEntry["site"]) ?? null,
          note: existing.note ?? "",
          atIso: existing.occurredAt,
          snapshotId: existing.snapshotId,
        };
        const nextDoses = [restoredDose, ...doses].sort((a, b) =>
          compareIsoDesc(a.atIso, b.atIso),
        );
        await dosesRepository.saveAll(nextDoses);
        useDosesStore.setState({ doses: nextDoses });
      }
    }

    const events = get().events.map((event) => {
      if (event.id !== eventId) return event;
      const { voidedAt: _voidedAt, ...activeEvent } = event;
      return {
        ...activeEvent,
        corrections: [
          ...(event.corrections ?? []),
          { id: `restore-${eventId}-${restoredAt}`, type: "restore" as const, occurredAt: restoredAt },
        ],
      };
    });
    set({
      events: sortEvents(events),
      txns: restoreTxn !== null ? [...get().txns, restoreTxn] : get().txns,
    });
  },

  appendEvents: async (events) => {
    if (events.length === 0) return;
    await doseEventsRepository.appendMany(events);
    set({ events: sortEvents([...events, ...get().events]) });
  },

  reset: () => set({ events: [], txns: [], hydrated: true }),
}));

/** Non-voided event for an occurrence key, if any. */
export function selectEventForOccurrence(
  state: LedgerState,
  occurrenceKey: string,
): DoseEvent | undefined {
  return state.events.find(
    (event) => event.occurrenceKey === occurrenceKey && event.voidedAt === undefined,
  );
}

export function selectTxnsForVial(state: LedgerState, vialId: string): InventoryTxn[] {
  return state.txns.filter((txn) => txn.vialId === vialId);
}
