/**
 * Lazy missed-occurrence rollover — pure collectors + storage for lastRollover.
 * Idempotent: an existing non-voided event for an occurrenceKey blocks a duplicate.
 */

import { addDays, format, parseISO, subDays } from "date-fns";

import { getStorage, STORAGE_PREFIX } from "./adapter";
import { createId } from "./models";
import type { DoseEvent, Plan } from "./types";
import {
  eachDayKey,
  localDateTimeIso,
  occurrencesOnDay,
} from "../engine/schedule";

const LAST_ROLLOVER_KEY = `${STORAGE_PREFIX}lastRollover`;

export async function getLastRollover(): Promise<string | null> {
  const raw = await getStorage().getItem(LAST_ROLLOVER_KEY);
  if (raw === null || raw.trim().length === 0) return null;
  return raw.trim();
}

export async function setLastRollover(day: string): Promise<void> {
  await getStorage().setItem(LAST_ROLLOVER_KEY, day);
}

/**
 * Day keys strictly after `lastRollover` and strictly before `today`.
 * First run (null lastRollover) yields [] — stamp today without backfilling.
 */
export function daysToRollover(lastRollover: string | null, today: string): string[] {
  if (lastRollover === null) return [];
  if (lastRollover >= today) return [];
  const start = format(addDays(parseISO(lastRollover), 1), "yyyy-MM-dd");
  const end = format(subDays(parseISO(today), 1), "yyyy-MM-dd");
  if (start > end) return [];
  return eachDayKey(start, end);
}

function actedKeys(events: DoseEvent[]): Set<string> {
  const keys = new Set<string>();
  for (const event of events) {
    if (event.voidedAt !== undefined) continue;
    if (event.occurrenceKey !== undefined && event.occurrenceKey.length > 0) {
      keys.add(event.occurrenceKey);
    }
  }
  return keys;
}

/** Build missed DoseEvents for unacted occurrences on the given days. */
export function collectMissedEvents(
  plans: Plan[],
  events: DoseEvent[],
  days: string[],
): DoseEvent[] {
  const existing = actedKeys(events);
  const missed: DoseEvent[] = [];
  for (const day of days) {
    for (const occurrence of occurrencesOnDay(plans, day)) {
      if (existing.has(occurrence.occurrenceKey)) continue;
      existing.add(occurrence.occurrenceKey);
      missed.push({
        id: createId(),
        planId: occurrence.planId,
        scheduleVersionId: occurrence.version.id,
        occurrenceKey: occurrence.occurrenceKey,
        status: "missed",
        compoundName: occurrence.compoundName,
        doseValue: occurrence.version.doseValue,
        doseUnit: occurrence.version.doseUnit,
        occurredAt: localDateTimeIso(day, occurrence.timeLocal),
      });
    }
  }
  return missed;
}

/**
 * Walk lastRollover → today, persist missed events, stamp lastRollover = today.
 * Safe to call twice on the same day — second call creates no duplicates.
 */
export async function runMissedRollover(input: {
  plans: Plan[];
  events: DoseEvent[];
  today: string;
}): Promise<{ created: DoseEvent[]; lastRollover: string }> {
  const previous = await getLastRollover();
  const days = daysToRollover(previous, input.today);
  const created = collectMissedEvents(input.plans, input.events, days);
  await setLastRollover(input.today);
  return { created, lastRollover: input.today };
}
