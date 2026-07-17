/**
 * Date arithmetic for the log and reminders — pure date-fns logic.
 * Every function receives "now" explicitly; nothing here reads the clock.
 */

import {
  addDays,
  differenceInCalendarDays,
  format,
  getDay,
  isAfter,
  parseISO,
  set,
  startOfDay,
  subDays,
} from "date-fns";

import type { Plan, ScheduleVersion } from "../db/types";
import { occurrenceKey as buildOccurrenceKey } from "../db/occurrence";

export interface TimeOfDay {
  hour: number;
  minute: number;
}

/** Stable day key ("2026-07-17") used to group log entries. */
export function dayKey(iso: string): string {
  return format(parseISO(iso), "yyyy-MM-dd");
}

/** "Today" / "Yesterday" / "Tuesday 14 Jul" heading for a day key. */
export function formatDayHeading(key: string, nowIso: string): string {
  const day = startOfDay(parseISO(key));
  const today = startOfDay(parseISO(nowIso));
  const diff = differenceInCalendarDays(today, day);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return format(day, "EEEE d MMM");
}

/** 24-hour clock string for a timestamp ("08:30"). */
export function formatClock(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

/** Full date line for detail views ("17 Jul 2026, 08:30"). */
export function formatDateTime(iso: string): string {
  return format(parseISO(iso), "d MMM yyyy, HH:mm");
}

/** Whole calendar days from `iso` to `nowIso`. */
export function daysSince(iso: string, nowIso: string): number {
  return differenceInCalendarDays(parseISO(nowIso), parseISO(iso));
}

/** Sort comparator: newest ISO timestamp first. */
export function compareIsoDesc(a: string, b: string): number {
  return parseISO(b).getTime() - parseISO(a).getTime();
}

/** Count of timestamps falling within the last `days` calendar days. */
export function countInLastDays(isos: string[], nowIso: string, days: number): number {
  const cutoff = startOfDay(subDays(parseISO(nowIso), days - 1));
  return isos.filter((iso) => !isAfter(cutoff, parseISO(iso))).length;
}

/** Next occurrence of a daily reminder time, strictly after `nowIso`. */
export function nextDailyOccurrence(time: TimeOfDay, nowIso: string): string {
  const now = parseISO(nowIso);
  const todayAt = set(now, {
    hours: time.hour,
    minutes: time.minute,
    seconds: 0,
    milliseconds: 0,
  });
  const next = isAfter(todayAt, now) ? todayAt : addDays(todayAt, 1);
  return next.toISOString();
}

/** Human description of the next reminder firing ("today 08:00"). */
export function formatNextOccurrence(time: TimeOfDay, nowIso: string): string {
  const next = parseISO(nextDailyOccurrence(time, nowIso));
  const dayDiff = differenceInCalendarDays(startOfDay(next), startOfDay(parseISO(nowIso)));
  const clock = format(next, "HH:mm");
  return dayDiff === 0 ? `today ${clock}` : `tomorrow ${clock}`;
}

/**
 * The schedule version active on a given 'yyyy-MM-dd' day key — the version
 * active THEN, never simply the newest. Day-key strings compare
 * lexicographically, which is DST-safe.
 */
export function versionActiveOn(plan: Plan, key: string): ScheduleVersion | undefined {
  return plan.versions.reduce<ScheduleVersion | undefined>((best, version) => {
    const covers =
      version.effectiveFrom <= key &&
      (version.effectiveTo === null || key <= version.effectiveTo);
    if (!covers) return best;
    if (best === undefined) return version;
    if (version.effectiveFrom > best.effectiveFrom) return version;
    if (version.effectiveFrom === best.effectiveFrom && version.createdAt > best.createdAt) {
      return version;
    }
    return best;
  }, undefined);
}

/** Whether the plan has a dose due on a day key, per its version active then. */
export function dueOnDay(plan: Plan, key: string): boolean {
  if (plan.archivedAt !== undefined && key > dayKey(plan.archivedAt)) return false;
  const version = versionActiveOn(plan, key);
  if (version === undefined) return false;
  return version.daysOfWeek.includes(getDay(parseISO(key)));
}

/**
 * Plan edits APPEND a version; nothing is mutated in place. Any open version
 * that started before the new one is closed the day before the new
 * `effectiveFrom`. Returns a new Plan object.
 */
export function appendScheduleVersion(plan: Plan, version: ScheduleVersion): Plan {
  const dayBefore = format(subDays(parseISO(version.effectiveFrom), 1), "yyyy-MM-dd");
  const closed = plan.versions.map((existing) =>
    existing.effectiveTo === null && existing.effectiveFrom < version.effectiveFrom
      ? { ...existing, effectiveTo: dayBefore }
      : existing,
  );
  return { ...plan, versions: [...closed, version] };
}

/**
 * Inclusive walk of calendar day keys using date-fns `addDays`.
 * Never divides epoch ms by 86400000 — correct across DST boundaries.
 */
export function eachDayKey(fromKey: string, toKey: string): string[] {
  if (fromKey > toKey) return [];
  const keys: string[] = [];
  let cursor = startOfDay(parseISO(fromKey));
  const end = startOfDay(parseISO(toKey));
  while (cursor.getTime() <= end.getTime()) {
    keys.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return keys;
}

/** Local wall-clock ISO for a day key + "HH:mm" (DST-safe via date-fns). */
export function localDateTimeIso(day: string, timeLocal: string): string {
  const [hourText, minuteText] = timeLocal.split(":");
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  const base = startOfDay(parseISO(day));
  return set(base, {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
    seconds: 0,
    milliseconds: 0,
  }).toISOString();
}

export interface PlannedOccurrence {
  planId: string;
  compoundName: string;
  version: ScheduleVersion;
  timeLocal: string;
  occurrenceKey: string;
  dayKey: string;
}

/**
 * Occurrences due on a day key from the ScheduleVersion active ON THAT DATE
 * (via versionActiveOn / dueOnDay) — never from the newest version alone.
 */
export function occurrencesOnDay(plans: Plan[], day: string): PlannedOccurrence[] {
  const rows: PlannedOccurrence[] = [];
  for (const plan of plans) {
    if (!dueOnDay(plan, day)) continue;
    const version = versionActiveOn(plan, day);
    if (version === undefined) continue;
    for (const timeLocal of version.timesLocal) {
      rows.push({
        planId: plan.id,
        compoundName: plan.compoundName,
        version,
        timeLocal,
        occurrenceKey: buildOccurrenceKey(day, timeLocal, plan.id),
        dayKey: day,
      });
    }
  }
  return rows.sort((a, b) => a.timeLocal.localeCompare(b.timeLocal));
}

/** Zero-padded "08:05" label for a reminder time. */
export function formatTimeOfDay(time: TimeOfDay): string {
  const hour = String(time.hour).padStart(2, "0");
  const minute = String(time.minute).padStart(2, "0");
  return `${hour}:${minute}`;
}
