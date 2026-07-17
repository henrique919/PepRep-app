import { MemoryStorageAdapter, setStorageAdapter } from "../adapter";
import {
  collectMissedEvents,
  daysToRollover,
  getLastRollover,
  runMissedRollover,
  setLastRollover,
} from "../rollover";
import type { DoseEvent, Plan, ScheduleVersion } from "../types";

function version(
  partial: Partial<ScheduleVersion> & Pick<ScheduleVersion, "id" | "effectiveFrom">,
): ScheduleVersion {
  return {
    id: partial.id,
    planId: "plan-1",
    effectiveFrom: partial.effectiveFrom,
    effectiveTo: partial.effectiveTo ?? null,
    name: "Plan",
    doseValue: 250,
    doseUnit: "mcg",
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    timesLocal: ["08:00"],
    createdAt: "2026-07-01T08:00:00.000Z",
  };
}

const plan: Plan = {
  id: "plan-1",
  compoundName: "Compound",
  createdAt: "2026-07-01T08:00:00.000Z",
  versions: [version({ id: "v1", effectiveFrom: "2026-07-01" })],
};

describe("missed rollover", () => {
  beforeEach(() => {
    setStorageAdapter(new MemoryStorageAdapter());
  });

  it("daysToRollover skips first run and same-day re-entry", () => {
    expect(daysToRollover(null, "2026-07-17")).toEqual([]);
    expect(daysToRollover("2026-07-17", "2026-07-17")).toEqual([]);
    expect(daysToRollover("2026-07-15", "2026-07-17")).toEqual(["2026-07-16"]);
  });

  it("marks yesterday's unacted occurrence missed", () => {
    const missed = collectMissedEvents(plan.versions.length > 0 ? [plan] : [], [], ["2026-07-16"]);
    expect(missed).toHaveLength(1);
    expect(missed[0]?.status).toBe("missed");
    expect(missed[0]?.occurrenceKey).toBe("2026-07-16|08:00|plan-1");
  });

  it("does not duplicate when an event already exists for the occurrence", () => {
    const existing: DoseEvent[] = [
      {
        id: "evt-1",
        planId: "plan-1",
        scheduleVersionId: "v1",
        occurrenceKey: "2026-07-16|08:00|plan-1",
        status: "completed",
        compoundName: "Compound",
        doseValue: 250,
        doseUnit: "mcg",
        occurredAt: "2026-07-16T08:00:00.000Z",
      },
    ];
    expect(collectMissedEvents([plan], existing, ["2026-07-16"])).toHaveLength(0);
  });

  it("runMissedRollover twice creates no duplicates", async () => {
    await setLastRollover("2026-07-15");
    const first = await runMissedRollover({
      plans: [plan],
      events: [],
      today: "2026-07-17",
    });
    expect(first.created).toHaveLength(1);
    expect(await getLastRollover()).toBe("2026-07-17");

    const second = await runMissedRollover({
      plans: [plan],
      events: first.created,
      today: "2026-07-17",
    });
    expect(second.created).toHaveLength(0);
  });
});
