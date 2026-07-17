/**
 * Display helpers for History — no storage writes.
 */

import type { InjectionSite } from "@/src/db/models";
import { ALL_SITES, SITE_LABELS } from "@/src/db/models";
import type { DoseEvent, DoseEventStatus } from "@/src/db/types";
import type { MathStep } from "@/src/engine";
import { dayKey } from "@/src/engine/schedule";

export function siteLabel(siteId: string | undefined): string | null {
  if (siteId === undefined) return null;
  if ((ALL_SITES as string[]).includes(siteId)) {
    return SITE_LABELS[siteId as InjectionSite];
  }
  return siteId;
}

export function statusLabel(status: DoseEventStatus): string {
  return status;
}

/** Day key for an event — prefer occurrenceKey day, else occurredAt. */
export function eventDayKey(event: DoseEvent): string {
  if (event.occurrenceKey !== undefined) {
    const day = event.occurrenceKey.split("|")[0];
    if (day !== undefined && day.length === 10) return day;
  }
  return dayKey(event.occurredAt);
}

export function eventsOnDay(events: DoseEvent[], day: string): DoseEvent[] {
  return events.filter((event) => eventDayKey(event) === day);
}

export interface DayMarkers {
  completed: boolean;
  skipped: boolean;
  missed: boolean;
}

export function dayMarkers(events: DoseEvent[], day: string): DayMarkers {
  const markers: DayMarkers = { completed: false, skipped: false, missed: false };
  for (const event of eventsOnDay(events, day)) {
    if (event.voidedAt !== undefined) continue;
    if (event.status === "completed") markers.completed = true;
    if (event.status === "skipped") markers.skipped = true;
    if (event.status === "missed") markers.missed = true;
  }
  return markers;
}

/** Pull MathStep[] from a CalcSnapshot.outputs bag, if present. */
export function stepsFromSnapshotOutputs(outputs: Record<string, unknown>): MathStep[] {
  const raw = outputs.steps;
  if (!Array.isArray(raw)) return [];
  const steps: MathStep[] = [];
  for (const item of raw) {
    if (typeof item !== "object" || item === null) continue;
    const row = item as Record<string, unknown>;
    if (
      typeof row.label === "string" &&
      typeof row.expression === "string" &&
      typeof row.result === "string"
    ) {
      steps.push({
        label: row.label,
        expression: row.expression,
        result: row.result,
      });
    }
  }
  return steps;
}
