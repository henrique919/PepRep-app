import type { DoseEvent, Plan, ScheduleVersion } from "../../db/types";
import { appendScheduleVersion, dueOnDay, versionActiveOn } from "../schedule";

function version(partial: Partial<ScheduleVersion> & Pick<ScheduleVersion, "id" | "effectiveFrom" | "effectiveTo">): ScheduleVersion {
  return {
    id: partial.id,
    planId: partial.planId ?? "plan-1",
    effectiveFrom: partial.effectiveFrom,
    effectiveTo: partial.effectiveTo,
    name: partial.name ?? "Plan",
    doseValue: partial.doseValue ?? 250,
    doseUnit: partial.doseUnit ?? "mcg",
    daysOfWeek: partial.daysOfWeek ?? [1, 3, 5],
    timesLocal: partial.timesLocal ?? ["08:00"],
    vialId: partial.vialId,
    createdAt: partial.createdAt ?? "2026-06-01T08:00:00.000Z",
  };
}

const v1 = version({
  id: "v1",
  effectiveFrom: "2026-06-01",
  effectiveTo: "2026-06-30",
  daysOfWeek: [1, 2, 3, 4, 5],
  createdAt: "2026-06-01T08:00:00.000Z",
});
const v2 = version({
  id: "v2",
  effectiveFrom: "2026-07-01",
  effectiveTo: null,
  daysOfWeek: [6],
  createdAt: "2026-07-01T08:00:00.000Z",
});

const plan: Plan = {
  id: "plan-1",
  compoundName: "User compound",
  createdAt: "2026-06-01T08:00:00.000Z",
  versions: [v1, v2],
};

describe("versionActiveOn — history resolves against the version active THEN", () => {
  it("resolves a past day key to the old version, not the newest", () => {
    expect(versionActiveOn(plan, "2026-06-15")?.id).toBe("v1");
  });

  it("resolves a current day key to the open version", () => {
    expect(versionActiveOn(plan, "2026-07-17")?.id).toBe("v2");
  });

  it("returns undefined before any version existed", () => {
    expect(versionActiveOn(plan, "2026-05-01")).toBeUndefined();
  });
});

describe("dueOnDay", () => {
  it("uses the day-of-week set from the version active on that day", () => {
    // 2026-06-15 is a Monday (1) — due under v1, which covers weekdays.
    expect(dueOnDay(plan, "2026-06-15")).toBe(true);
    // 2026-06-13 is a Saturday (6) — v1 was active then and excludes it.
    expect(dueOnDay(plan, "2026-06-13")).toBe(false);
    // 2026-07-04 is a Saturday (6) — v2 is active and includes it.
    expect(dueOnDay(plan, "2026-07-04")).toBe(true);
  });

  it("is never due without a covering version", () => {
    expect(dueOnDay(plan, "2026-05-01")).toBe(false);
  });
});

describe("appendScheduleVersion — plan edits append, never mutate", () => {
  const openPlan: Plan = {
    id: "plan-2",
    compoundName: "User compound",
    createdAt: "2026-06-01T08:00:00.000Z",
    versions: [version({ id: "a", effectiveFrom: "2026-06-01", effectiveTo: null })],
  };
  const newVersion = version({ id: "b", effectiveFrom: "2026-07-10", effectiveTo: null });

  it("closes the open version the day before the new one starts", () => {
    const next = appendScheduleVersion(openPlan, newVersion);
    expect(next.versions).toHaveLength(2);
    expect(next.versions[0]?.effectiveTo).toBe("2026-07-09");
    expect(next.versions[1]?.id).toBe("b");
  });

  it("does not mutate the original plan object", () => {
    const before = JSON.stringify(openPlan);
    appendScheduleVersion(openPlan, newVersion);
    expect(JSON.stringify(openPlan)).toBe(before);
    expect(openPlan.versions[0]?.effectiveTo).toBeNull();
  });

  it("supersedes an earlier version edited on the same day", () => {
    const sameDayPlan: Plan = {
      ...openPlan,
      versions: [
        version({
          id: "same-day-old",
          effectiveFrom: "2026-07-10",
          effectiveTo: null,
          createdAt: "2026-07-10T08:00:00.000Z",
        }),
      ],
    };
    const sameDayNew = version({
      id: "same-day-new",
      effectiveFrom: "2026-07-10",
      effectiveTo: null,
      createdAt: "2026-07-10T09:00:00.000Z",
    });
    const next = appendScheduleVersion(sameDayPlan, sameDayNew);
    expect(next.versions[0]?.effectiveTo).toBe("2026-07-09");
    expect(versionActiveOn(next, "2026-07-10")?.id).toBe("same-day-new");
  });

  it("leaves every pre-existing DoseEvent byte-identical", () => {
    const events: DoseEvent[] = [
      {
        id: "evt-1",
        planId: "plan-2",
        scheduleVersionId: "a",
        status: "completed",
        compoundName: "User compound",
        doseValue: 250,
        doseUnit: "mcg",
        doseMcg: 250,
        units: 10,
        volumeMl: 0.1,
        vialId: "vial-a",
        occurredAt: "2026-06-20T08:00:00.000Z",
      },
    ];
    const before = JSON.stringify(events);
    appendScheduleVersion(openPlan, newVersion);
    expect(JSON.stringify(events)).toBe(before);
  });
});
