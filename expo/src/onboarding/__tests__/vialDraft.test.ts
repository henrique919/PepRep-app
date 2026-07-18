import { parseOnboardingVialDraft } from "../vialDraft";

describe("parseOnboardingVialDraft", () => {
  it("rejects empty demo-like drafts with no numbers", () => {
    const result = parseOnboardingVialDraft({
      name: "",
      vialText: "",
      waterText: "",
      capacity: 50,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("accepts a user-entered vial and returns persisted fields", () => {
    const result = parseOnboardingVialDraft({
      name: "  My vial  ",
      vialText: "10",
      waterText: "2",
      capacity: 100,
    });
    expect(result).toEqual({
      ok: true,
      vial: {
        name: "My vial",
        vialMg: 10,
        diluentMl: 2,
        syringeCapacityUnits: 100,
        note: "",
      },
    });
  });

  it("does not invent values when only a label is present", () => {
    const result = parseOnboardingVialDraft({
      name: "BPC",
      vialText: "",
      waterText: "",
      capacity: 50,
    });
    expect(result.ok).toBe(false);
  });
});
