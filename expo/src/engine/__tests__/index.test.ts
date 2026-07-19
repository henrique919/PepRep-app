import {
  calculateDiluent,
  calculateDraw,
  fmt,
  mcgToMg,
  mgToMcg,
  mlToUnits,
  requiresDrawCorrection,
  roundTo,
  SYRINGES,
  U100_UNITS_PER_ML,
  unitsToMl,
} from "../index";
import type { DrawOutcome, SyringeCapacity } from "../index";

function expectOk<T extends { ok: boolean }>(outcome: T): asserts outcome is T & { ok: true } {
  expect(outcome.ok).toBe(true);
}

describe("U-100 invariant — the single most important rule", () => {
  it("is always 100 units per mL", () => {
    expect(U100_UNITS_PER_ML).toBe(100);
  });

  it("returns IDENTICAL units for the same draw regardless of syringe capacity", () => {
    const capacities: SyringeCapacity[] = [30, 50, 100];
    const results: DrawOutcome[] = capacities.map((capacity) =>
      calculateDraw({
        vialMg: 5,
        diluentMl: 2,
        doseValue: 250,
        doseUnit: "mcg",
        syringeCapacityUnits: capacity,
      }),
    );
    for (const result of results) {
      expectOk(result);
      expect(result.units).toBe(10);
      expect(result.volumeMl).toBe(0.1);
    }
  });

  it("never uses capacity as the units-per-mL multiplier (0.1 mL is 10 units on a 30-unit barrel, not 3)", () => {
    const result = calculateDraw({
      vialMg: 5,
      diluentMl: 2,
      doseValue: 250,
      doseUnit: "mcg",
      syringeCapacityUnits: 30,
    });
    expectOk(result);
    expect(result.units).toBe(10);
    expect(result.units).not.toBe(3);
  });

  it("syringe specs describe barrel volume only", () => {
    expect(SYRINGES.map((s) => s.capacityMl)).toEqual([0.3, 0.5, 1.0]);
    for (const spec of SYRINGES) {
      expect(spec.capacityUnits / spec.capacityMl).toBe(U100_UNITS_PER_ML);
    }
  });
});

describe("calculateDraw", () => {
  it("computes the flagship example: 5 mg + 2 mL, 250 mcg dose", () => {
    const result = calculateDraw({ vialMg: 5, diluentMl: 2, doseValue: 250, doseUnit: "mcg" });
    expectOk(result);
    expect(result.concentrationMgPerMl).toBe(2.5);
    expect(result.concentrationMcgPerMl).toBe(2500);
    expect(result.doseMcg).toBe(250);
    expect(result.volumeMl).toBe(0.1);
    expect(result.units).toBe(10);
    expect(result.dosesPerVial).toBe(20);
    expect(result.warnings).toHaveLength(0);
    expect(result.steps).toHaveLength(4);
  });

  it("accepts doses entered in mg", () => {
    const result = calculateDraw({ vialMg: 10, diluentMl: 1, doseValue: 0.5, doseUnit: "mg" });
    expectOk(result);
    expect(result.doseMcg).toBe(500);
    expect(result.units).toBe(5);
  });

  it("floors doses-per-vial to full doses only", () => {
    const result = calculateDraw({ vialMg: 5, diluentMl: 2, doseValue: 300, doseUnit: "mcg" });
    expectOk(result);
    expect(result.dosesPerVial).toBe(16);
  });

  it("does not lose exact divisions to float error", () => {
    const result = calculateDraw({ vialMg: 10, diluentMl: 3, doseValue: 250, doseUnit: "mcg" });
    expectOk(result);
    expect(result.dosesPerVial).toBe(40);
  });

  it("rejects non-positive and non-finite inputs with one error per field", () => {
    const result = calculateDraw({ vialMg: 0, diluentMl: -1, doseValue: NaN, doseUnit: "mcg" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toHaveLength(3);
      expect(result.errors[0]).toContain("Vial amount");
    }
  });

  it("warns when the dose exceeds the whole vial", () => {
    const result = calculateDraw({ vialMg: 1, diluentMl: 1, doseValue: 2, doseUnit: "mg" });
    expectOk(result);
    expect(result.warnings.some((w) => w.includes("larger than the total amount"))).toBe(true);
  });

  it("warns when the draw overflows the selected barrel", () => {
    const result = calculateDraw({
      vialMg: 5,
      diluentMl: 2,
      doseValue: 1,
      doseUnit: "mg",
      syringeCapacityUnits: 30,
    });
    expectOk(result);
    expect(result.units).toBe(40);
    expect(result.warnings.some((w) => w.includes("more than a 30-unit syringe"))).toBe(true);
    expect(requiresDrawCorrection(result, 30)).toBe(true);
  });

  it("blocks logging when the entered dose is larger than the whole vial", () => {
    const result = calculateDraw({ vialMg: 1, diluentMl: 1, doseValue: 2, doseUnit: "mg" });
    expectOk(result);
    expect(requiresDrawCorrection(result, 100)).toBe(true);
  });

  it("does not block a valid draw", () => {
    const result = calculateDraw({ vialMg: 5, diluentMl: 2, doseValue: 250, doseUnit: "mcg" });
    expectOk(result);
    expect(requiresDrawCorrection(result, 50)).toBe(false);
  });

  it("warns on sub-2-unit draws that are hard to measure", () => {
    const result = calculateDraw({ vialMg: 10, diluentMl: 1, doseValue: 100, doseUnit: "mcg" });
    expectOk(result);
    expect(result.units).toBe(1);
    expect(result.warnings.some((w) => w.includes("under 2 units"))).toBe(true);
  });

  it("warns when the draw lands between printed markings", () => {
    const result = calculateDraw({ vialMg: 5, diluentMl: 2, doseValue: 260, doseUnit: "mcg" });
    expectOk(result);
    expect(result.units).toBe(10.4);
    expect(result.warnings.some((w) => w.includes("between syringe markings"))).toBe(true);
  });
});

describe("calculateDiluent (reverse mode)", () => {
  it("finds the water volume for a target draw", () => {
    const result = calculateDiluent({ vialMg: 5, doseValue: 250, doseUnit: "mcg", targetUnits: 10 });
    expectOk(result);
    expect(result.diluentMl).toBe(2);
    expect(result.concentrationMcgPerMl).toBe(2500);
    expect(result.concentrationMgPerMl).toBe(2.5);
    expect(result.dosesPerVial).toBe(20);
    expect(result.warnings).toHaveLength(0);
    expect(result.steps).toHaveLength(4);
  });

  it("round-trips with calculateDraw", () => {
    const reverse = calculateDiluent({ vialMg: 8, doseValue: 400, doseUnit: "mcg", targetUnits: 12 });
    expectOk(reverse);
    const forward = calculateDraw({
      vialMg: 8,
      diluentMl: reverse.diluentMl,
      doseValue: 400,
      doseUnit: "mcg",
    });
    expectOk(forward);
    expect(forward.units).toBeCloseTo(12, 5);
  });

  it("warns when the required water exceeds typical vial capacity", () => {
    const result = calculateDiluent({ vialMg: 10, doseValue: 100, doseUnit: "mcg", targetUnits: 5 });
    expectOk(result);
    expect(result.diluentMl).toBe(5);
    expect(result.warnings.some((w) => w.includes("more than many small vials hold"))).toBe(true);
  });

  it("warns when the required water is too little to mix accurately", () => {
    const result = calculateDiluent({ vialMg: 5, doseValue: 2.5, doseUnit: "mg", targetUnits: 10 });
    expectOk(result);
    expect(result.diluentMl).toBe(0.2);
    expect(result.warnings.some((w) => w.includes("very little liquid"))).toBe(true);
  });

  it("rejects invalid input", () => {
    const result = calculateDiluent({ vialMg: -5, doseValue: 0, doseUnit: "mcg", targetUnits: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(3);
  });
});

describe("conversions and formatting", () => {
  it("converts mass units both ways", () => {
    expect(mgToMcg(5)).toBe(5000);
    expect(mgToMcg(0.25)).toBe(250);
    expect(mcgToMg(250)).toBe(0.25);
  });

  it("converts U-100 units and millilitres both ways", () => {
    expect(unitsToMl(10)).toBe(0.1);
    expect(unitsToMl(33)).toBe(0.33);
    expect(mlToUnits(0.1)).toBe(10);
    expect(mlToUnits(1)).toBe(100);
  });

  it("rounds half away from zero at the epsilon boundary", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.675, 2)).toBe(2.68);
    expect(roundTo(10.44, 1)).toBe(10.4);
  });

  it("formats numbers with locale-stable separators", () => {
    expect(fmt(2500)).toBe("2,500");
    expect(fmt(0.18)).toBe("0.18");
    expect(fmt(10.44, 1)).toBe("10.4");
  });
});
