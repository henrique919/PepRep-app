/**
 * Calculator draft — persists the user's own last-entered numbers so a
 * relaunch restores them instead of an empty form. Restored values are the
 * user's prior entries verbatim; nothing here invents or suggests a value.
 */

import { create } from "zustand";

import { getStorage, STORAGE_PREFIX } from "@/src/db/adapter";
import type { MassUnit, SyringeCapacity } from "@/src/engine";
import type { VialLinkSource } from "@/src/engine/vialCalcParams";

const CALC_DRAFT_KEY = `${STORAGE_PREFIX}calcDraft.v1`;

export interface CalcDraft {
  mode: "draw" | "water";
  compoundLabel: string;
  vialText: string;
  waterText: string;
  doseText: string;
  doseUnit: MassUnit;
  targetUnitsText: string;
  capacity: SyringeCapacity;
  sourceVial: VialLinkSource | null;
}

function isMassUnit(value: unknown): value is MassUnit {
  return value === "mg" || value === "mcg";
}

function isCapacity(value: unknown): value is SyringeCapacity {
  return value === 30 || value === 50 || value === 100;
}

function isSourceVial(value: unknown): value is VialLinkSource {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.vialMg === "string" &&
    typeof row.diluentMl === "string"
  );
}

/** Never throws — corrupt or shape-mismatched storage yields null. */
export function parseCalcDraft(raw: string | null): CalcDraft | null {
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const row = parsed as Record<string, unknown>;
  if (row.mode !== "draw" && row.mode !== "water") return null;
  if (typeof row.compoundLabel !== "string") return null;
  if (typeof row.vialText !== "string") return null;
  if (typeof row.waterText !== "string") return null;
  if (typeof row.doseText !== "string") return null;
  if (!isMassUnit(row.doseUnit)) return null;
  if (typeof row.targetUnitsText !== "string") return null;
  if (!isCapacity(row.capacity)) return null;
  if (row.sourceVial !== null && !isSourceVial(row.sourceVial)) return null;

  return {
    mode: row.mode,
    compoundLabel: row.compoundLabel,
    vialText: row.vialText,
    waterText: row.waterText,
    doseText: row.doseText,
    doseUnit: row.doseUnit,
    targetUnitsText: row.targetUnitsText,
    capacity: row.capacity,
    sourceVial: row.sourceVial ?? null,
  };
}

/** True when the draft has any user-entered content worth restoring. */
export function draftHasContent(draft: CalcDraft): boolean {
  return (
    draft.compoundLabel.length > 0 ||
    draft.vialText.length > 0 ||
    draft.waterText.length > 0 ||
    draft.doseText.length > 0 ||
    draft.targetUnitsText.length > 0
  );
}

interface CalcDraftState {
  draft: CalcDraft | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (draft: CalcDraft) => Promise<void>;
  reset: () => void;
}

export const useCalcDraftStore = create<CalcDraftState>((set) => ({
  draft: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await getStorage().getItem(CALC_DRAFT_KEY);
      set({ draft: parseCalcDraft(raw), hydrated: true });
    } catch (error) {
      console.error("[calcDraft] Failed to hydrate", error);
      set({ draft: null, hydrated: true });
    }
  },

  save: async (draft: CalcDraft) => {
    set({ draft, hydrated: true });
    try {
      await getStorage().setItem(CALC_DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error("[calcDraft] Failed to persist", error);
    }
  },

  reset: () => set({ draft: null, hydrated: true }),
}));
