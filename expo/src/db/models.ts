/**
 * Persisted record shapes. All values are entered by the user; PepRep never
 * fills in a plan of its own.
 */

import type { MassUnit, SyringeCapacity } from "@/src/engine";

export type InjectionSite =
  | "deltoid-left"
  | "deltoid-right"
  | "abdomen-left"
  | "abdomen-right"
  | "glute-left"
  | "glute-right"
  | "thigh-left"
  | "thigh-right";

export const ALL_SITES: InjectionSite[] = [
  "deltoid-left",
  "deltoid-right",
  "abdomen-left",
  "abdomen-right",
  "glute-left",
  "glute-right",
  "thigh-left",
  "thigh-right",
];

export const SITE_LABELS: Record<InjectionSite, string> = {
  "deltoid-left": "Deltoid · L",
  "deltoid-right": "Deltoid · R",
  "abdomen-left": "Abdomen · L",
  "abdomen-right": "Abdomen · R",
  "glute-left": "Glute · L",
  "glute-right": "Glute · R",
  "thigh-left": "Thigh · L",
  "thigh-right": "Thigh · R",
};

export interface Vial {
  id: string;
  /** User's own label for the contents. */
  name: string;
  vialMg: number;
  diluentMl: number;
  syringeCapacityUnits: SyringeCapacity;
  note: string;
  reconstitutedAtIso: string;
  archivedAtIso: string | null;
  /** Optional link to the CalcSnapshot taken when this vial was saved from a draw. */
  snapshotId?: string;
}

export interface DoseEntry {
  id: string;
  vialId: string | null;
  peptideName: string;
  doseValue: number;
  doseUnit: MassUnit;
  /** Normalized by the engine at save time. */
  doseMcg: number;
  /** U-100 syringe units actually drawn, if recorded. */
  units: number | null;
  volumeMl: number | null;
  site: InjectionSite | null;
  note: string;
  atIso: string;
  /** Optional link to a CalcSnapshot (immutable math) for this log. */
  snapshotId?: string;
}

export interface Reminder {
  id: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  /** Scheduled local notification id, when enabled on this device. */
  notificationId: string | null;
}

/** Collision-resistant local id; nothing here ever leaves the device. */
export function createId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${time}-${rand}`;
}
