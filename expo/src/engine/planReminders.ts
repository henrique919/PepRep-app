/**
 * Pure helpers for plan → local notification wiring.
 * Notification copy must never invent a dose; privacy mode omits compound too.
 */

export type PlanReminderCopy = {
  title: string;
  body: string;
};

export function countPlanReminderSlots(
  daysOfWeek: readonly number[],
  timesLocal: readonly string[],
): number {
  return daysOfWeek.length * timesLocal.length;
}

/**
 * Build notification title/body for a plan reminder slot.
 * Privacy mode: generic copy only (safe for lock-screen).
 * Open mode: may name the compound and time — never the dose.
 */
export function planReminderCopy(input: {
  privacyMode: boolean;
  compoundName: string;
  timeLocal: string;
}): PlanReminderCopy {
  if (input.privacyMode) {
    return {
      title: "PepRep",
      body: "Scheduled dose reminder",
    };
  }
  const compound = input.compoundName.trim();
  const label = compound.length > 0 ? compound : "your plan";
  return {
    title: "PepRep",
    body: `Reminder for ${label} at ${input.timeLocal}`,
  };
}
