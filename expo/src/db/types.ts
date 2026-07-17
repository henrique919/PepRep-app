/**
 * Ledger & planning record shapes (schema v2).
 *
 * Pure type declarations only — this module imports nothing and is safe to
 * reference from the engine. Key invariants encoded here:
 *
 * - Inventory is DERIVED: remaining = sum of signed InventoryTxn deltas.
 *   There is no editable balance anywhere.
 * - History is IMMUTABLE: DoseEvent stores a denormalised copy of what was
 *   done. Un-logging sets `voidedAt` and appends a compensating 'void' txn;
 *   nothing is ever deleted or mutated back.
 * - Schedule edits APPEND a new ScheduleVersion; versions are never mutated
 *   in place.
 */

export type InventoryTxnType =
  | "initial"
  | "reconstitute"
  | "dose"
  | "adjustment"
  | "discard"
  | "void";

export interface InventoryTxn {
  id: string;
  vialId: string;
  type: InventoryTxnType;
  /** SIGNED micrograms. Debits are negative. */
  deltaMcg: number;
  /** DoseEvent id this txn was written for (dose / void txns). */
  sourceEventId?: string;
  occurredAt: string;
  note?: string;
}

export interface CalcSnapshot {
  id: string;
  kind: "draw" | "diluent";
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  engineVersion: string;
  createdAt: string;
}

export interface ScheduleVersion {
  id: string;
  planId: string;
  /** 'yyyy-MM-dd' day key, inclusive. */
  effectiveFrom: string;
  /** 'yyyy-MM-dd' day key, inclusive; null while the version is open. */
  effectiveTo: string | null;
  name: string;
  doseValue: number;
  doseUnit: "mcg" | "mg";
  /** User-chosen only (0 = Sunday … 6 = Saturday). No default pattern. */
  daysOfWeek: number[];
  /** "HH:mm" local times, user-chosen only. */
  timesLocal: string[];
  vialId?: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  compoundName: string;
  createdAt: string;
  /** Delete = archive. History is never removed. */
  archivedAt?: string;
  versions: ScheduleVersion[];
}

export type DoseEventStatus = "completed" | "skipped" | "missed";

export interface DoseEvent {
  id: string;
  planId?: string;
  scheduleVersionId?: string;
  occurrenceKey?: string;
  status: DoseEventStatus;
  /** DENORMALISED COPY — never a live join. This is what freezes history. */
  compoundName: string;
  doseValue: number;
  doseUnit: "mcg" | "mg";
  doseMcg?: number;
  volumeMl?: number;
  units?: number;
  vialId?: string;
  siteId?: string;
  occurredAt: string;
  note?: string;
  /** Set when un-logged; the event itself is never deleted. */
  voidedAt?: string;
}
