/**
 * Plans store — user-entered schedules only. Edits APPEND a ScheduleVersion;
 * deletes set archivedAt. Dose history is never touched here.
 */

import { Platform } from "react-native";
import { create } from "zustand";

import { createId } from "@/src/db/models";
import { plansRepository } from "@/src/db/repositories";
import type { Plan, ScheduleVersion } from "@/src/db/types";
import { fmt } from "@/src/engine";
import { appendScheduleVersion, dayKey } from "@/src/engine/schedule";
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
}

interface PlansState {
  plans: Plan[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addPlan: (input: NewPlanInput) => Promise<Plan>;
  appendVersion: (planId: string, input: NewPlanInput & { effectiveFrom: string }) => Promise<void>;
  archivePlan: (planId: string) => Promise<void>;
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

async function schedulePlanReminders(input: NewPlanInput): Promise<string[]> {
  if (!input.remindMe || Platform.OS === "web") return [];
  const compound = input.compoundName.trim();
  const doseLabel = `${fmt(input.doseValue)} ${input.doseUnit}`;
  const ids: string[] = [];
  for (const dayOfWeek of input.daysOfWeek) {
    for (const timeLocal of input.timesLocal) {
      const { hour, minute } = parseTimeLocal(timeLocal);
      const copy = `${compound} — ${doseLabel} planned, ${timeLocal}`;
      const notificationId = await scheduleWeekly({
        weekday: dayOfWeek + 1,
        hour,
        minute,
        title: copy,
        body: copy,
      });
      if (notificationId !== null) ids.push(notificationId);
    }
  }
  return ids;
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
    const version: ScheduleVersion = {
      id: createId(),
      planId,
      effectiveFrom: from,
      effectiveTo: null,
      name: (input.name ?? input.compoundName).trim(),
      doseValue: input.doseValue,
      doseUnit: input.doseUnit,
      daysOfWeek: [...input.daysOfWeek].sort((a, b) => a - b),
      timesLocal: [...input.timesLocal],
      vialId: input.vialId,
      createdAt,
    };
    const reminderNotificationIds = await schedulePlanReminders(input);
    const plan: Plan = {
      id: planId,
      compoundName: input.compoundName.trim(),
      createdAt,
      versions: [version],
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
    const version: ScheduleVersion = {
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
      createdAt: new Date().toISOString(),
    };
    const next = appendScheduleVersion(existing, version);
    const plans = get().plans.map((plan) => (plan.id === planId ? next : plan));
    set({ plans });
    await plansRepository.saveAll(plans);
  },

  archivePlan: async (planId) => {
    const existing = get().plans.find((plan) => plan.id === planId);
    if (existing === undefined) return;
    for (const notificationId of existing.reminderNotificationIds ?? []) {
      await cancelScheduledNotification(notificationId);
    }
    const archivedAt = new Date().toISOString();
    const plans = get().plans.map((plan) =>
      plan.id === planId
        ? { ...plan, archivedAt, reminderNotificationIds: undefined }
        : plan,
    );
    set({ plans });
    await plansRepository.saveAll(plans);
  },

  reset: () => set({ plans: [], hydrated: true }),
}));

export function selectActivePlans(state: PlansState): Plan[] {
  return activePlans(state.plans);
}
