import {
  compareIsoDesc,
  countInLastDays,
  dayKey,
  daysSince,
  formatClock,
  formatDayHeading,
  formatNextOccurrence,
  formatTimeOfDay,
  nextDailyOccurrence,
} from "../schedule";

const NOW = "2026-07-17T10:00:00.000Z";

describe("log grouping", () => {
  it("produces a stable day key", () => {
    expect(dayKey("2026-07-17T08:30:00.000Z")).toBe(dayKey("2026-07-17T23:59:00.000Z"));
  });

  it("labels today and yesterday", () => {
    expect(formatDayHeading(dayKey(NOW), NOW)).toBe("Today");
    expect(formatDayHeading("2026-07-16", NOW)).toBe("Yesterday");
    expect(formatDayHeading("2026-07-10", NOW)).toBe("Friday 10 Jul");
  });

  it("sorts newest first", () => {
    const isos = ["2026-07-15T08:00:00.000Z", "2026-07-17T08:00:00.000Z", "2026-07-16T08:00:00.000Z"];
    const sorted = [...isos].sort(compareIsoDesc);
    expect(sorted[0]).toBe("2026-07-17T08:00:00.000Z");
    expect(sorted[2]).toBe("2026-07-15T08:00:00.000Z");
  });

  it("counts entries in a rolling window of calendar days", () => {
    const isos = [
      "2026-07-17T08:00:00.000Z",
      "2026-07-15T08:00:00.000Z",
      "2026-07-11T08:00:00.000Z",
      "2026-06-01T08:00:00.000Z",
    ];
    expect(countInLastDays(isos, NOW, 7)).toBe(3);
    expect(countInLastDays(isos, NOW, 1)).toBe(1);
  });

  it("computes whole days since a timestamp", () => {
    expect(daysSince("2026-07-14T23:00:00.000Z", NOW)).toBe(3);
    expect(daysSince(NOW, NOW)).toBe(0);
  });

  it("formats clock strings", () => {
    expect(formatClock("2026-07-17T08:05:00.000Z")).toMatch(/^\d{2}:\d{2}$/);
  });
});

describe("daily reminder occurrences", () => {
  it("picks later today when the time has not passed", () => {
    const now = new Date(2026, 6, 17, 6, 0, 0).toISOString();
    const next = new Date(nextDailyOccurrence({ hour: 8, minute: 30 }, now));
    expect(next.getDate()).toBe(17);
    expect(next.getHours()).toBe(8);
    expect(next.getMinutes()).toBe(30);
  });

  it("rolls to tomorrow when the time has passed", () => {
    const now = new Date(2026, 6, 17, 9, 0, 0).toISOString();
    const next = new Date(nextDailyOccurrence({ hour: 8, minute: 30 }, now));
    expect(next.getDate()).toBe(18);
    expect(next.getHours()).toBe(8);
  });

  it("describes the next firing in words", () => {
    const morning = new Date(2026, 6, 17, 6, 0, 0).toISOString();
    const evening = new Date(2026, 6, 17, 22, 0, 0).toISOString();
    expect(formatNextOccurrence({ hour: 8, minute: 0 }, morning)).toBe("today 08:00");
    expect(formatNextOccurrence({ hour: 8, minute: 0 }, evening)).toBe("tomorrow 08:00");
  });

  it("zero-pads time-of-day labels", () => {
    expect(formatTimeOfDay({ hour: 8, minute: 5 })).toBe("08:05");
    expect(formatTimeOfDay({ hour: 21, minute: 45 })).toBe("21:45");
  });
});
