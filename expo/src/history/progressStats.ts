/**
 * Progress screen aggregates — recorded counts only, derived from the
 * ledger's own DoseEvent history. Never scores or evaluates the routine.
 */

import { addDays, format, parseISO } from "date-fns";

import type { DoseEvent } from "@/src/db/types";
import { eventDayKey } from "@/src/history/display";
import { dayKey } from "@/src/engine/schedule";

export interface DayAdherence {
  dayKey: string;
  weekday: string;
  logged: number;
  skipped: number;
  missed: number;
}

/** Last 7 calendar days (oldest first, ending today) with recorded outcomes per day. */
export function last7DayAdherence(events: DoseEvent[], nowIso: string): DayAdherence[] {
  const today = parseISO(dayKey(nowIso));
  const days: DayAdherence[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = addDays(today, -offset);
    const key = format(date, "yyyy-MM-dd");
    let logged = 0;
    let skipped = 0;
    let missed = 0;
    for (const event of events) {
      if (event.voidedAt !== undefined) continue;
      if (eventDayKey(event) !== key) continue;
      if (event.status === "completed") logged += 1;
      else if (event.status === "skipped") skipped += 1;
      else if (event.status === "missed") missed += 1;
    }
    days.push({ dayKey: key, weekday: format(date, "EEE"), logged, skipped, missed });
  }
  return days;
}

export interface CompoundTotal {
  compoundName: string;
  logged: number;
  totalMcg: number | null;
}

/** All-time logged counts per compound, most-logged first. Never invents a total for events missing doseMcg. */
export function compoundTotals(events: DoseEvent[]): CompoundTotal[] {
  const byCompound = new Map<string, { logged: number; mcgSum: number; mcgCount: number }>();
  for (const event of events) {
    if (event.voidedAt !== undefined) continue;
    if (event.status !== "completed") continue;
    const entry = byCompound.get(event.compoundName) ?? { logged: 0, mcgSum: 0, mcgCount: 0 };
    entry.logged += 1;
    if (event.doseMcg !== undefined) {
      entry.mcgSum += event.doseMcg;
      entry.mcgCount += 1;
    }
    byCompound.set(event.compoundName, entry);
  }
  return [...byCompound.entries()]
    .map(([compoundName, entry]) => ({
      compoundName,
      logged: entry.logged,
      totalMcg: entry.mcgCount > 0 ? entry.mcgSum : null,
    }))
    .sort((a, b) => b.logged - a.logged);
}
