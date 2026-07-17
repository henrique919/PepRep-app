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

/** Local-calendar anchors — date-fns day helpers use the host timezone. */
const NOW = new Date(2026, 6, 17, 10, 0, 0).toISOString();
const DAY_KEY_TODAY = "2026-07-17";

describe("log grouping", () => {
  it("produces a stable day key", () => {
    const morning = new Date(2026, 6, 17, 8, 30, 0).toISOString();
    const evening = new Date(2026, 6, 17, 23, 59, 0).toISOString();
    expect(dayKey(morning)).toBe(dayKey(evening));
    expect(dayKey(morning)).toBe(DAY_KEY_TODAY);
  });

  it("labels today and yesterday", () => {
    expect(formatDayHeading(dayKey(NOW), NOW)).toBe("Today");
    expect(formatDayHeading("2026-07-16", NOW)).toBe("Yesterday");
    expect(formatDayHeading("2026-07-10", NOW)).toBe("Friday 10 Jul");
  });

  it("sorts newest first", () => {
    const a = new Date(2026, 6, 15, 8, 0, 0).toISOString();
    const b = new Date(2026, 6, 17, 8, 0, 0).toISOString();
    const c = new Date(2026, 6, 16, 8, 0, 0).toISOString();
    const sorted = [a, b, c].sort(compareIsoDesc);
    expect(sorted[0]).toBe(b);
    expect(sorted[2]).toBe(a);
  });

  it("counts entries in a rolling window of calendar days", () => {
    const isos = [
      new Date(2026, 6, 17, 8, 0, 0).toISOString(),
      new Date(2026, 6, 15, 8, 0, 0).toISOString(),
      new Date(2026, 6, 11, 8, 0, 0).toISOString(),
      new Date(2026, 5, 1, 8, 0, 0).toISOString(),
    ];
    expect(countInLastDays(isos, NOW, 7)).toBe(3);
    expect(countInLastDays(isos, NOW, 1)).toBe(1);
  });

  it("computes whole days since a timestamp", () => {
    const threeDaysAgo = new Date(2026, 6, 14, 23, 0, 0).toISOString();
    expect(daysSince(threeDaysAgo, NOW)).toBe(3);
    expect(daysSince(NOW, NOW)).toBe(0);
  });

  it("formats clock strings", () => {
    expect(formatClock(new Date(2026, 6, 17, 8, 5, 0).toISOString())).toMatch(/^\d{2}:\d{2}$/);
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
