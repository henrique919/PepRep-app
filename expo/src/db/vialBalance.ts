/**
 * Derive vial display balance from the inventory ledger.
 * Arithmetic comes from the engine; this only assembles a VialSummary.
 */

import type { InventoryTxn } from "@/src/db/types";
import { mcgToMg, mgToMcg } from "@/src/engine";
import { remainingDoses, remainingMcg, type VialSummary } from "@/src/engine/inventory";

/** Active (non-voided) dose txn count against this vial's txn list. */
export function activeDoseCount(txns: InventoryTxn[]): number {
  const voided = new Set(
    txns
      .filter((txn) => txn.type === "void" && txn.sourceEventId !== undefined)
      .map((txn) => txn.sourceEventId as string),
  );
  return txns.filter(
    (txn) => txn.type === "dose" && (txn.sourceEventId === undefined || !voided.has(txn.sourceEventId)),
  ).length;
}

/** Build a VialSummary from ledger txns — never from a stored balance field. */
export function summaryFromTxns(
  vialMg: number,
  txns: InventoryTxn[],
  perDoseMcg?: number,
): VialSummary {
  const rem = remainingMcg(txns);
  const totalMcg = mgToMcg(vialMg);
  const usedMcg = Math.max(0, totalMcg - rem);
  const remainingPercent =
    totalMcg > 0 ? Math.max(0, Math.min(100, (rem / totalMcg) * 100)) : 0;
  return {
    totalMcg,
    usedMcg,
    remainingMcg: rem,
    remainingMg: mcgToMg(rem),
    remainingPercent,
    dosesLogged: activeDoseCount(txns),
    fullDosesLeft:
      perDoseMcg !== undefined && perDoseMcg > 0 ? remainingDoses(rem, perDoseMcg) : null,
  };
}
