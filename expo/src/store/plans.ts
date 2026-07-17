/**
 * Plans store — user-entered schedules only. Edits APPEND a ScheduleVersion;
 * deletes set archivedAt. Dose history is never touched here.
 */

import { create } from "zustand";

import { createId } from "@/src/db/models";
import { plansRepository } from "@/src/db/repositories";
import type { Plan, ScheduleVersion } from "@/src/db/types";
import { appendScheduleVersion, dayKey } from "@/src/engine/schedule";

export interface NewPlanInput {
  compoundName: string;
  doseValue: number;
  doseUnit: "mcg" | "mg";
  daysOfWeek: number[];
  timesLocal: string[];
  vialId?: string;
  /** Optional plan/version display name; defaults to compound name. */
  name?: string;
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
    const plan: Plan = {
      id: planId,
      compoundName: input.compoundName.trim(),
      createdAt,
      versions: [version],
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
    const archivedAt = new Date().toISOString();
    const plans = get().plans.map((plan) =>
      plan.id === planId ? { ...plan, archivedAt } : plan,
    );
    set({ plans });
    await plansRepository.saveAll(plans);
  },

  reset: () => set({ plans: [], hydrated: true }),
}));

export function selectActivePlans(state: PlansState): Plan[] {
  return activePlans(state.plans);
}
