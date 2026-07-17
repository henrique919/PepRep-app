/**
 * Vials store — thin state layer over the vials repository.
 * All persistence goes through the repository; nothing here computes numbers.
 */

import { create } from "zustand";

import { initialTxnForVial } from "@/src/db/ledger";
import type { Vial } from "@/src/db/models";
import { createId } from "@/src/db/models";
import { txnsRepository, vialsRepository } from "@/src/db/repositories";
import { useLedgerStore } from "@/src/store/ledger";

export type NewVial = Omit<Vial, "id">;

interface VialsState {
  vials: Vial[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addVial: (input: NewVial) => Promise<Vial>;
  updateVial: (id: string, patch: Partial<NewVial>) => Promise<void>;
  removeVial: (id: string) => Promise<void>;
  reset: () => void;
}

export const useVialsStore = create<VialsState>((set, get) => ({
  vials: [],
  hydrated: false,

  hydrate: async () => {
    const vials = await vialsRepository.list();
    set({ vials, hydrated: true });
  },

  addVial: async (input: NewVial) => {
    const vial: Vial = { ...input, id: createId() };
    const vials = [vial, ...get().vials];
    set({ vials });
    await vialsRepository.saveAll(vials);
    // Open the vial's ledger with its full labelled contents. Remaining is
    // always derived from txns; there is no editable balance anywhere.
    const txn = initialTxnForVial(vial, createId());
    await txnsRepository.append(txn);
    useLedgerStore.setState((state) => ({ txns: [...state.txns, txn] }));
    return vial;
  },

  updateVial: async (id: string, patch: Partial<NewVial>) => {
    const vials = get().vials.map((vial) => (vial.id === id ? { ...vial, ...patch } : vial));
    set({ vials });
    await vialsRepository.saveAll(vials);
  },

  removeVial: async (id: string) => {
    const vials = get().vials.filter((vial) => vial.id !== id);
    set({ vials });
    await vialsRepository.saveAll(vials);
  },

  reset: () => set({ vials: [], hydrated: true }),
}));

/** Active (non-archived) vials, newest first. */
export function selectActiveVials(state: VialsState): Vial[] {
  return state.vials.filter((vial) => vial.archivedAtIso === null);
}
