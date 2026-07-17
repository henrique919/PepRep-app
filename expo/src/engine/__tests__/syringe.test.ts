import { buildSyringeGauge, markStepFor } from "../syringe";

describe("syringe gauge geometry", () => {
  it("uses 1-unit markings on 30/50-unit barrels and 2-unit markings on 100-unit barrels", () => {
    expect(markStepFor(30)).toBe(1);
    expect(markStepFor(50)).toBe(1);
    expect(markStepFor(100)).toBe(2);
  });

  it("builds ticks spanning the full barrel", () => {
    const model = buildSyringeGauge(10, 30);
    expect(model.ticks[0]?.units).toBe(0);
    expect(model.ticks[model.ticks.length - 1]?.units).toBe(30);
    expect(model.ticks).toHaveLength(31);
    expect(model.ticks.filter((t) => t.major).map((t) => t.units)).toEqual([0, 5, 10, 15, 20, 25, 30]);
  });

  it("marks majors every 10 units on the 100-unit barrel", () => {
    const model = buildSyringeGauge(50, 100);
    expect(model.ticks).toHaveLength(51);
    expect(model.ticks.filter((t) => t.major)).toHaveLength(11);
  });

  it("reports fill as a fraction of BARREL VOLUME, never rescaling the draw", () => {
    const on30 = buildSyringeGauge(15, 30);
    const on100 = buildSyringeGauge(15, 100);
    expect(on30.fillFraction).toBe(0.5);
    expect(on100.fillFraction).toBe(0.15);
  });

  it("clamps overflow and flags it", () => {
    const model = buildSyringeGauge(45, 30);
    expect(model.fillFraction).toBe(1);
    expect(model.overflow).toBe(true);
  });

  it("snaps to the nearest printed marking", () => {
    expect(buildSyringeGauge(10.4, 30).nearestMarkUnits).toBe(10);
    expect(buildSyringeGauge(10.6, 30).nearestMarkUnits).toBe(11);
    expect(buildSyringeGauge(11, 100).nearestMarkUnits).toBe(12);
  });

  it("treats invalid draws as an empty barrel", () => {
    const model = buildSyringeGauge(NaN, 50);
    expect(model.fillFraction).toBe(0);
    expect(model.overflow).toBe(false);
  });

  it("derives capacity in mL from the U-100 constant", () => {
    expect(buildSyringeGauge(0, 30).capacityMl).toBe(0.3);
    expect(buildSyringeGauge(0, 50).capacityMl).toBe(0.5);
    expect(buildSyringeGauge(0, 100).capacityMl).toBe(1);
  });
});
