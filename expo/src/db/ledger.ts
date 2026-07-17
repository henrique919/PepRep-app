/**
 * Pure, deterministic ledger mappers. All ids and timestamps are passed in;
 * nothing here reads the clock or touches storage. The invariants:
 *
 * - A dose debits exactly ONE vialId — the one on the event.
 * - Un-logging appends a compensating 'void' txn with the exact opposite
 *   delta of the original 'dose' txn, so the balance returns to precisely
 *   its prior value. The original txn is never mutated or deleted.
 */

import { mgToMcg } from "../engine";
import type { DoseEntry, Vial } from "./models";
import type { DoseEvent, InventoryTxn } from "./types";

/** Opening 'initial' txn crediting a vial's full labelled contents. */
export function initialTxnForVial(vial: Vial, id: string): InventoryTxn {
  return {
    id,
    vialId: vial.id,
    type: "initial",
    deltaMcg: mgToMcg(Number.isFinite(vial.vialMg) && vial.vialMg > 0 ? vial.vialMg : 0),
    occurredAt: vial.reconstitutedAtIso,
  };
}

/** Immutable denormalised copy of a logged dose entry. Same id as the entry. */
export function doseEventFromEntry(dose: DoseEntry): DoseEvent {
  return {
    id: dose.id,
    status: "completed",
    compoundName: dose.peptideName,
    doseValue: dose.doseValue,
    doseUnit: dose.doseUnit,
    doseMcg: dose.doseMcg,
    volumeMl: dose.volumeMl ?? undefined,
    units: dose.units ?? undefined,
    vialId: dose.vialId ?? undefined,
    siteId: dose.site ?? undefined,
    occurredAt: dose.atIso,
    note: dose.note.length > 0 ? dose.note : undefined,
    snapshotId: dose.snapshotId,
  };
}

/**
 * The single 'dose' debit for an event, against the ONE vial chosen at log
 * time. Returns null when the event has no vial or no usable mass — the
 * event is still kept; it simply doesn't move inventory.
 */
export function doseTxnForEvent(event: DoseEvent, id: string): InventoryTxn | null {
  if (event.vialId === undefined) return null;
  const mcg = event.doseMcg;
  if (mcg === undefined || !Number.isFinite(mcg) || mcg <= 0) return null;
  return {
    id,
    vialId: event.vialId,
    type: "dose",
    deltaMcg: -mcg,
    sourceEventId: event.id,
    occurredAt: event.occurredAt,
  };
}

/**
 * Compensating 'void' txn for an un-logged event: the exact opposite delta
 * of the original 'dose' txn. Returns null when there is nothing to
 * compensate (no dose txn) or the event was already voided.
 */
export function voidTxnForEvent(
  txns: InventoryTxn[],
  eventId: string,
  id: string,
  occurredAt: string,
): InventoryTxn | null {
  const original = txns.find((txn) => txn.type === "dose" && txn.sourceEventId === eventId);
  if (original === undefined) return null;
  const alreadyVoided = txns.some(
    (txn) => txn.type === "void" && txn.sourceEventId === eventId,
  );
  if (alreadyVoided) return null;
  return {
    id,
    vialId: original.vialId,
    type: "void",
    deltaMcg: -original.deltaMcg,
    sourceEventId: eventId,
    occurredAt,
    note: "compensates un-logged dose",
  };
}
