import { summarizeVial, vialConcentration } from "../inventory";

describe("vialConcentration", () => {
  it("computes mg/mL and mcg/mL", () => {
    expect(vialConcentration(5, 2)).toEqual({ mgPerMl: 2.5, mcgPerMl: 2500 });
    expect(vialConcentration(10, 1)).toEqual({ mgPerMl: 10, mcgPerMl: 10000 });
  });

  it("returns null for invalid inputs", () => {
    expect(vialConcentration(0, 2)).toBeNull();
    expect(vialConcentration(5, 0)).toBeNull();
    expect(vialConcentration(NaN, 2)).toBeNull();
  });
});

describe("summarizeVial", () => {
  it("tracks remaining material from logged doses", () => {
    const summary = summarizeVial(5, [250, 250, 500]);
    expect(summary.totalMcg).toBe(5000);
    expect(summary.usedMcg).toBe(1000);
    expect(summary.remainingMcg).toBe(4000);
    expect(summary.remainingMg).toBe(4);
    expect(summary.remainingPercent).toBe(80);
    expect(summary.dosesLogged).toBe(3);
  });

  it("reports full doses left at the user's own reference dose", () => {
    const summary = summarizeVial(5, [250, 250], 250);
    expect(summary.fullDosesLeft).toBe(18);
  });

  it("omits the doses-left figure without a reference dose", () => {
    expect(summarizeVial(5, [250]).fullDosesLeft).toBeNull();
    expect(summarizeVial(5, [250], 0).fullDosesLeft).toBeNull();
  });

  it("never goes below empty", () => {
    const summary = summarizeVial(1, [800, 400]);
    expect(summary.remainingMcg).toBe(0);
    expect(summary.remainingPercent).toBe(0);
    expect(summary.usedMcg).toBe(1000);
  });

  it("ignores invalid logged values", () => {
    const summary = summarizeVial(2, [NaN, -100, 500]);
    expect(summary.usedMcg).toBe(500);
    expect(summary.remainingMcg).toBe(1500);
  });

  it("handles a fresh vial", () => {
    const summary = summarizeVial(10, []);
    expect(summary.remainingPercent).toBe(100);
    expect(summary.dosesLogged).toBe(0);
  });
});
