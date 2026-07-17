/**
 * Dose log store — the auditable record of what the user actually did.
 * Ordering uses the engine's date comparators; no arithmetic lives here.
 */

import { create } from "zustand";

import { doseEventFromEntry, doseTxnForEvent, voidTxnForEvent } from "@/src/db/ledger";
import type { DoseEntry } from "@/src/db/models";
import { createId } from "@/src/db/models";
import { doseEventsRepository, dosesRepository, txnsRepository } from "@/src/db/repositories";
import { compareIsoDesc } from "@/src/engine/schedule";

export type NewDoseEntry = Omit<DoseEntry, "id">;

interface DosesState {
  doses: DoseEntry[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addDose: (input: NewDoseEntry) => Promise<DoseEntry>;
  removeDose: (id: string) => Promise<void>;
  reset: () => void;
}

function sortedByTime(doses: DoseEntry[]): DoseEntry[] {
  return [...doses].sort((a, b) => compareIsoDesc(a.atIso, b.atIso));
}

export const useDosesStore = create<DosesState>((set, get) => ({
  doses: [],
  hydrated: false,

  hydrate: async () => {
    const doses = await dosesRepository.list();
    set({ doses: sortedByTime(doses), hydrated: true });
  },

  addDose: async (input: NewDoseEntry) => {
    const dose: DoseEntry = { ...input, id: createId() };
    const doses = sortedByTime([dose, ...get().doses]);
    set({ doses });
    await dosesRepository.saveAll(doses);
    // Append the immutable event and its single 'dose' debit against the ONE
    // vial chosen at log time (if any).
    const event = doseEventFromEntry(dose);
    await doseEventsRepository.append(event);
    const txn = doseTxnForEvent(event, createId());
    if (txn !== null) await txnsRepository.append(txn);
    return dose;
  },

  removeDose: async (id: string) => {
    const doses = get().doses.filter((dose) => dose.id !== id);
    set({ doses });
    await dosesRepository.saveAll(doses);
    // Un-log: mark the event voided and append a compensating 'void' txn so
    // the vial balance returns to exactly its prior value. Neither the event
    // nor the original txn is ever deleted or mutated.
    const voidedAt = new Date().toISOString();
    await doseEventsRepository.markVoided(id, voidedAt);
    const txns = await txnsRepository.list();
    const voidTxn = voidTxnForEvent(txns, id, createId(), voidedAt);
    if (voidTxn !== null) await txnsRepository.append(voidTxn);
  },

  reset: () => set({ doses: [], hydrated: true }),
}));

/** Doses drawn from a specific vial (for inventory bookkeeping). */
export function selectDosesForVial(state: DosesState, vialId: string): DoseEntry[] {
  return state.doses.filter((dose) => dose.vialId === vialId);
}
