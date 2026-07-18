import { countPlanReminderSlots, planReminderCopy } from "../planReminders";

describe("countPlanReminderSlots", () => {
  it("returns N for N day×time combinations", () => {
    expect(countPlanReminderSlots([1, 3, 5], ["08:00", "20:00"])).toBe(6);
    expect(countPlanReminderSlots([], ["08:00"])).toBe(0);
    expect(countPlanReminderSlots([1], [])).toBe(0);
  });
});

describe("planReminderCopy", () => {
  it("uses generic lock-screen copy in privacy mode", () => {
    expect(
      planReminderCopy({
        privacyMode: true,
        compoundName: "Secret",
        timeLocal: "08:00",
      }),
    ).toEqual({
      title: "PepRep",
      body: "Scheduled dose reminder",
    });
  });

  it("never includes dose text even when privacy is off", () => {
    const copy = planReminderCopy({
      privacyMode: false,
      compoundName: "My vial",
      timeLocal: "09:30",
    });
    expect(copy.body).toContain("My vial");
    expect(copy.body).toContain("09:30");
    expect(copy.body.toLowerCase()).not.toMatch(/\d+\s*(mcg|mg|iu)\b/);
  });
});
