import { isRepeatingTrigger, selectOrphanedRepeatingIds } from "../orphans";

describe("selectOrphanedRepeatingIds", () => {
  const scheduled = [
    { identifier: "known-weekly", repeating: true },
    { identifier: "orphan-weekly", repeating: true },
    { identifier: "orphan-daily", repeating: true },
    { identifier: "pending-snooze", repeating: false },
  ];

  it("selects repeating notifications the app no longer tracks", () => {
    expect(selectOrphanedRepeatingIds(scheduled, ["known-weekly"])).toEqual([
      "orphan-weekly",
      "orphan-daily",
    ]);
  });

  it("never selects one-shot notifications (snoozes)", () => {
    expect(selectOrphanedRepeatingIds(scheduled, [])).not.toContain("pending-snooze");
  });

  it("ignores null/undefined/empty known ids", () => {
    expect(selectOrphanedRepeatingIds(scheduled, [null, undefined, ""])).toEqual([
      "known-weekly",
      "orphan-weekly",
      "orphan-daily",
    ]);
  });

  it("selects nothing when everything is tracked", () => {
    expect(
      selectOrphanedRepeatingIds(scheduled, ["known-weekly", "orphan-weekly", "orphan-daily"]),
    ).toEqual([]);
  });
});

describe("isRepeatingTrigger", () => {
  it("recognises daily/weekly/calendar trigger types", () => {
    expect(isRepeatingTrigger({ type: "daily" })).toBe(true);
    expect(isRepeatingTrigger({ type: "weekly" })).toBe(true);
    expect(isRepeatingTrigger({ type: "calendar" })).toBe(true);
  });

  it("recognises legacy repeats flags", () => {
    expect(isRepeatingTrigger({ repeats: true })).toBe(true);
  });

  it("treats one-shot and unknown shapes as non-repeating", () => {
    expect(isRepeatingTrigger({ type: "timeInterval", seconds: 1800 })).toBe(false);
    expect(isRepeatingTrigger(null)).toBe(false);
    expect(isRepeatingTrigger(undefined)).toBe(false);
    expect(isRepeatingTrigger("weekly")).toBe(false);
  });
});
