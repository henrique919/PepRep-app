import type { DoseEvent } from "@/src/db/types";

import { compoundTotals, last7DayAdherence } from "../progressStats";

const NOW_ISO = "2026-01-15T12:00:00.000Z";

function event(overrides: Partial<DoseEvent> & Pick<DoseEvent, "id">): DoseEvent {
  return {
    status: "completed",
    compoundName: "Test peptide",
    doseValue: 250,
    doseUnit: "mcg",
    occurredAt: NOW_ISO,
    ...overrides,
  };
}

describe("last7DayAdherence", () => {
  it("returns 7 days ending today, oldest first", () => {
    const days = last7DayAdherence([], NOW_ISO);
    expect(days).toHaveLength(7);
    expect(days[6]?.dayKey).toBe("2026-01-15");
    expect(days[0]?.dayKey).toBe("2026-01-09");
  });

  it("buckets events into the correct day by status", () => {
    const events: DoseEvent[] = [
      event({ id: "1", status: "completed", occurredAt: "2026-01-15T09:00:00.000Z" }),
      event({ id: "2", status: "skipped", occurredAt: "2026-01-15T10:00:00.000Z" }),
      event({ id: "3", status: "missed", occurredAt: "2026-01-14T09:00:00.000Z" }),
    ];
    const days = last7DayAdherence(events, NOW_ISO);
    const today = days.find((day) => day.dayKey === "2026-01-15");
    const yesterday = days.find((day) => day.dayKey === "2026-01-14");
    expect(today).toEqual({ dayKey: "2026-01-15", weekday: "Thu", logged: 1, skipped: 1, missed: 0 });
    expect(yesterday?.missed).toBe(1);
  });

  it("excludes voided events", () => {
    const events: DoseEvent[] = [
      event({ id: "1", status: "completed", occurredAt: NOW_ISO, voidedAt: "2026-01-15T13:00:00.000Z" }),
    ];
    const days = last7DayAdherence(events, NOW_ISO);
    const today = days.find((day) => day.dayKey === "2026-01-15");
    expect(today?.logged).toBe(0);
  });

  it("prefers the occurrenceKey day over occurredAt when both are present", () => {
    const events: DoseEvent[] = [
      event({
        id: "1",
        status: "completed",
        occurrenceKey: "2026-01-10|slot-1",
        occurredAt: NOW_ISO,
      }),
    ];
    const days = last7DayAdherence(events, NOW_ISO);
    const target = days.find((day) => day.dayKey === "2026-01-10");
    expect(target?.logged).toBe(1);
  });

  it("ignores events outside the 7-day window", () => {
    const events: DoseEvent[] = [
      event({ id: "1", status: "completed", occurredAt: "2025-12-01T09:00:00.000Z" }),
    ];
    const days = last7DayAdherence(events, NOW_ISO);
    const total = days.reduce((sum, day) => sum + day.logged, 0);
    expect(total).toBe(0);
  });
});

describe("compoundTotals", () => {
  it("counts only completed, non-voided events, most-logged first", () => {
    const events: DoseEvent[] = [
      event({ id: "1", compoundName: "A", status: "completed", doseMcg: 250 }),
      event({ id: "2", compoundName: "A", status: "completed", doseMcg: 250 }),
      event({ id: "3", compoundName: "B", status: "completed", doseMcg: 500 }),
      event({ id: "4", compoundName: "A", status: "skipped" }),
      event({ id: "5", compoundName: "B", status: "completed", doseMcg: 500, voidedAt: NOW_ISO }),
    ];
    expect(compoundTotals(events)).toEqual([
      { compoundName: "A", logged: 2, totalMcg: 500 },
      { compoundName: "B", logged: 1, totalMcg: 500 },
    ]);
  });

  it("does not invent a total for events missing doseMcg", () => {
    const events: DoseEvent[] = [
      event({ id: "1", compoundName: "A", status: "completed", doseMcg: undefined }),
    ];
    expect(compoundTotals(events)).toEqual([{ compoundName: "A", logged: 1, totalMcg: null }]);
  });

  it("returns an empty list when there are no completed events", () => {
    expect(compoundTotals([])).toEqual([]);
  });
});
