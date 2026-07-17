/**
 * v1 → v2 mapping — a PURE function so the migration is testable without
 * storage. Converts the legacy doses store into immutable DoseEvent rows and
 * back-fills an InventoryTxn ledger so that remainingMcg() reproduces each
 * vial's previously displayed remaining value exactly
 * (total mgToMcg(vialMg) minus the doses logged against that vial).
 *
 * Zero data loss: every legacy dose row becomes a DoseEvent, mappable or
 * not. Rows that cannot move inventory (no vial chosen, or an unusable
 * mass) are additionally reported in `unmapped` so the caller can log them —
 * they are never dropped.
 */

import { doseEventFromEntry, doseTxnForEvent, initialTxnForVial } from "./ledger";
import type { DoseEntry, Vial } from "./models";
import type { DoseEvent, InventoryTxn } from "./types";

export interface V1MigrationResult {
  doseEvents: DoseEvent[];
  txns: InventoryTxn[];
  /** Legacy rows kept as events but unable to produce an inventory txn. */
  unmapped: DoseEntry[];
}

export function migrateV1(vials: Vial[], doses: DoseEntry[]): V1MigrationResult {
  const txns: InventoryTxn[] = [];
  const doseEvents: DoseEvent[] = [];
  const unmapped: DoseEntry[] = [];

  for (const vial of vials) {
    txns.push(initialTxnForVial(vial, `txn-initial-${vial.id}`));
  }

  for (const dose of doses) {
    const event = doseEventFromEntry(dose);
    doseEvents.push(event);
    const txn = doseTxnForEvent(event, `txn-dose-${dose.id}`);
    if (txn !== null) {
      txns.push(txn);
    } else if (dose.vialId !== null) {
      // A vial was chosen but the mass is unusable — keep the event, flag the row.
      unmapped.push(dose);
    }
  }

  return { doseEvents, txns, unmapped };
}
