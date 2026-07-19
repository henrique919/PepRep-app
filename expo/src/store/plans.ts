/**
 * Plans store — user-entered schedules only. Edits APPEND a ScheduleVersion;
 * deletes set archivedAt. Dose history is never touched here.
 */

import { Platform } from "react-native";
import { create } from "zustand";

import { createId } from "@/src/db/models";
import { plansRepository } from "@/src/db/repositories";
import type { Plan, ScheduleVersion } from "@/src/db/types";
import { countPlanReminderSlots, planReminderCopy } from "@/src/engine/planReminders";
import { appendScheduleVersion, dayKey, versionActiveOn } from "@/src/engine/schedule";
import {
  cancelScheduledNotification,
  scheduleWeekly,
} from "@/src/store/reminders";

export interface NewPlanInput {
  compoundName: string;
  doseValue: number;
  doseUnit: "mcg" | "mg";
  daysOfWeek: number[];
  timesLocal: string[];
  vialId?: string;
  /** Optional plan/version display name; defaults to compound name. */
  name?: string;
  /** When true (native only), schedule one weekly notification per day×time. */
  remindMe?: boolean;
  /**
   * When true (default), notification body is generic — no compound or dose.
   * When false, body may include compound + time only (never dose).
   */
  privacyMode?: boolean;
}

interface PlansState {
  plans: Plan[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addPlan: (input: NewPlanInput) => Promise<Plan>;
  appendVersion: (planId: string, input: NewPlanInput & { effectiveFrom: string }) => Promise<void>;
  archivePlan: (planId: string) => Promise<void>;
  restorePlan: (planId: string) => Promise<void>;
  reset: () => void;
}

function activePlans(plans: Plan[]): Plan[] {
  return plans.filter((plan) => plan.archivedAt === undefined);
}

function parseTimeLocal(timeLocal: string): { hour: number; minute: number } {
  const [hourText, minuteText] = timeLocal.split(":");
  return {
    hour: Number(hourText),
    minute: Number(minuteText),
  };
}

async function cancelPlanReminders(ids: string[] | undefined): Promise<void> {
  if (ids === undefined) return;
  for (const notificationId of ids) {
    await cancelScheduledNotification(notificationId);
  }
}

async function schedulePlanReminders(input: NewPlanInput): Promise<string[]> {
  if (!input.remindMe || Platform.OS === "web") return [];
  const privacyMode = input.privacyMode !== false;
  const ids: string[] = [];
  const expected = countPlanReminderSlots(input.daysOfWeek, input.timesLocal);
  if (expected === 0) return [];

  for (const dayOfWeek of input.daysOfWeek) {
    for (const timeLocal of input.timesLocal) {
      const { hour, minute } = parseTimeLocal(timeLocal);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) continue;
      const copy = planReminderCopy({
        privacyMode,
        compoundName: input.compoundName,
        timeLocal,
      });
      const notificationId = await scheduleWeekly({
        weekday: dayOfWeek + 1,
        hour,
        minute,
        title: copy.title,
        body: copy.body,
      });
      if (notificationId !== null) ids.push(notificationId);
    }
  }
  return ids;
}

function buildVersion(
  planId: string,
  input: NewPlanInput & { effectiveFrom: string },
  createdAt: string,
): ScheduleVersion {
  return {
    id: createId(),
    planId,
    effectiveFrom: input.effectiveFrom,
    effectiveTo: null,
    name: (input.name ?? input.compoundName).trim(),
    doseValue: input.doseValue,
    doseUnit: input.doseUnit,
    daysOfWeek: [...input.daysOfWeek].sort((a, b) => a - b),
    timesLocal: [...input.timesLocal],
    vialId: input.vialId,
    createdAt,
  };
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  hydrated: false,

  hydrate: async () => {
    const plans = await plansRepository.list();
    set({ plans, hydrated: true });
  },

  addPlan: async (input: NewPlanInput) => {
    const now = new Date();
    const createdAt = now.toISOString();
    const from = dayKey(createdAt);
    const planId = createId();
    const version = buildVersion(planId, { ...input, effectiveFrom: from }, createdAt);
    const reminderNotificationIds = await schedulePlanReminders(input);
    const plan: Plan = {
      id: planId,
      compoundName: input.compoundName.trim(),
      createdAt,
      versions: [version],
      reminderConfig: {
        enabled: input.remindMe === true,
        privacyMode: input.privacyMode !== false,
      },
      ...(reminderNotificationIds.length > 0 ? { reminderNotificationIds } : {}),
    };
    const plans = [plan, ...get().plans];
    set({ plans });
    await plansRepository.saveAll(plans);
    return plan;
  },

  appendVersion: async (planId, input) => {
    const existing = get().plans.find((plan) => plan.id === planId);
    if (existing === undefined) return;

    await cancelPlanReminders(existing.reminderNotificationIds);
    const version = buildVersion(planId, input, new Date().toISOString());
    const nextBase = appendScheduleVersion(existing, version);
    const reminderNotificationIds = await schedulePlanReminders(input);
    const next: Plan = {
      ...nextBase,
      compoundName: input.compoundName.trim(),
      reminderConfig: {
        enabled: input.remindMe === true,
        privacyMode: input.privacyMode !== false,
      },
      reminderNotificationIds:
        reminderNotificationIds.length > 0 ? reminderNotificationIds : undefined,
    };
    const plans = get().plans.map((plan) => (plan.id === planId ? next : plan));
    set({ plans });
    await plansRepository.saveAll(plans);
  },

  archivePlan: async (planId) => {
    const existing = get().plans.find((plan) => plan.id === planId);
    if (existing === undefined) return;

    await cancelPlanReminders(existing.reminderNotificationIds);

    const archivedAt = new Date().toISOString();
    const plans = get().plans.map((plan) =>
      plan.id === planId
        ? { ...plan, archivedAt, reminderNotificationIds: undefined }
        : plan,
    );
    set({ plans });
    await plansRepository.saveAll(plans);
  },

  restorePlan: async (planId) => {
    const existing = get().plans.find((plan) => plan.id === planId);
    if (existing === undefined || existing.archivedAt === undefined) return;

    const today = dayKey(new Date().toISOString());
    const version =
      versionActiveOn(existing, today) ?? existing.versions[existing.versions.length - 1];
    if (version === undefined) return;
    const reminderInput: NewPlanInput = {
      compoundName: existing.compoundName,
      name: version.name,
      doseValue: version.doseValue,
      doseUnit: version.doseUnit,
      daysOfWeek: version.daysOfWeek,
      timesLocal: version.timesLocal,
      vialId: version.vialId,
      remindMe: existing.reminderConfig?.enabled === true,
      privacyMode: existing.reminderConfig?.privacyMode !== false,
    };
    const reminderNotificationIds = await schedulePlanReminders(reminderInput);
    const plans = get().plans.map((plan) => {
      if (plan.id !== planId) return plan;
      const { archivedAt: _archivedAt, ...restored } = plan;
      return {
        ...restored,
        reminderNotificationIds:
          reminderNotificationIds.length > 0 ? reminderNotificationIds : undefined,
      };
    });
    set({ plans });
    await plansRepository.saveAll(plans);
  },

  reset: () => set({ plans: [], hydrated: true }),
}));

export function selectActivePlans(state: PlansState): Plan[] {
  return activePlans(state.plans);
}
