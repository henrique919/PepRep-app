/**
 * Vial inventory arithmetic — remaining material derived from what the user
 * actually logged. Pure bookkeeping; no recommendations.
 */

import type { InventoryTxn } from "../db/types";
import { mgToMcg, roundTo } from "./index";

/**
 * Remaining material in a vial: the sum of its signed ledger deltas.
 * That is all — there is no editable balance anywhere in PepRep.
 */
export function remainingMcg(txns: InventoryTxn[]): number {
  return txns.reduce(
    (sum, txn) => sum + (Number.isFinite(txn.deltaMcg) ? txn.deltaMcg : 0),
    0,
  );
}

/** Full draws left at the user's own reference dose. Floor; never rounds up. */
export function remainingDoses(remaining: number, doseMcg: number): number {
  if (!Number.isFinite(remaining) || remaining <= 0) return 0;
  if (!Number.isFinite(doseMcg) || doseMcg <= 0) return 0;
  return Math.floor(remaining / doseMcg + 1e-9);
}

export interface ConcentrationInfo {
  mgPerMl: number;
  mcgPerMl: number;
}

/** Concentration of a reconstituted vial, or null when inputs are invalid. */
export function vialConcentration(vialMg: number, diluentMl: number): ConcentrationInfo | null {
  if (!Number.isFinite(vialMg) || vialMg <= 0) return null;
  if (!Number.isFinite(diluentMl) || diluentMl <= 0) return null;
  const mcgPerMl = mgToMcg(vialMg) / diluentMl;
  return {
    mgPerMl: roundTo(mcgPerMl / 1000, 4),
    mcgPerMl: roundTo(mcgPerMl, 2),
  };
}

export interface VialSummary {
  totalMcg: number;
  usedMcg: number;
  remainingMcg: number;
  remainingMg: number;
  /** 0–100, for progress display. */
  remainingPercent: number;
  dosesLogged: number;
  /** Full draws left at `perDoseMcg`, or null when no reference dose given. */
  fullDosesLeft: number | null;
}

/**
 * Summarizes a vial from its logged doses. `perDoseMcg` is the user's own
 * reference dose (e.g. their last logged draw) — never a suggestion.
 */
export function summarizeVial(
  vialMg: number,
  loggedDoseMcg: number[],
  perDoseMcg?: number,
): VialSummary {
  const totalMcg = mgToMcg(Number.isFinite(vialMg) && vialMg > 0 ? vialMg : 0);
  const usedRaw = loggedDoseMcg.reduce(
    (sum, dose) => sum + (Number.isFinite(dose) && dose > 0 ? dose : 0),
    0,
  );
  const remainingMcg = roundTo(Math.max(totalMcg - usedRaw, 0), 3);
  const usedMcg = roundTo(Math.min(usedRaw, totalMcg), 3);
  const remainingPercent = totalMcg > 0 ? roundTo((remainingMcg / totalMcg) * 100, 1) : 0;
  const hasReference = perDoseMcg !== undefined && Number.isFinite(perDoseMcg) && perDoseMcg > 0;

  return {
    totalMcg,
    usedMcg,
    remainingMcg,
    remainingMg: roundTo(remainingMcg / 1000, 4),
    remainingPercent,
    dosesLogged: loggedDoseMcg.length,
    fullDosesLeft: hasReference ? Math.floor(remainingMcg / (perDoseMcg ?? 1) + 1e-9) : null,
  };
}
