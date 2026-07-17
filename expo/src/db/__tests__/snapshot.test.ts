import { calculateDraw } from "../../engine";
import { doseEventFromEntry } from "../ledger";
import type { DoseEntry } from "../models";
import { snapshotFromDraw } from "../snapshot";

describe("CalcSnapshot on save/log", () => {
  it("persists draw steps that History can rehydrate verbatim", () => {
    const input = {
      vialMg: 5,
      diluentMl: 2,
      doseValue: 250,
      doseUnit: "mcg" as const,
      syringeCapacityUnits: 100 as const,
    };
    const draw = calculateDraw(input);
    expect(draw.ok).toBe(true);
    if (!draw.ok) return;

    const snapshot = snapshotFromDraw(input, draw, "snap-1", "2026-07-17T12:00:00.000Z");
    expect(snapshot.kind).toBe("draw");
    expect(snapshot.engineVersion).toBe("1");
    expect(snapshot.inputs.vialMg).toBe(5);
    expect(snapshot.outputs.units).toBe(draw.units);
    expect(snapshot.outputs.steps).toEqual(draw.steps);
    expect(Array.isArray(snapshot.outputs.steps)).toBe(true);
    expect((snapshot.outputs.steps as unknown[]).length).toBeGreaterThan(0);
  });

  it("doseEventFromEntry carries snapshotId for History linking", () => {
    const dose: DoseEntry = {
      id: "dose-1",
      vialId: "vial-a",
      peptideName: "User compound",
      doseValue: 250,
      doseUnit: "mcg",
      doseMcg: 250,
      units: 10,
      volumeMl: 0.1,
      site: null,
      note: "",
      atIso: "2026-07-17T12:00:00.000Z",
      snapshotId: "snap-1",
    };
    const event = doseEventFromEntry(dose);
    expect(event.snapshotId).toBe("snap-1");
    expect(event.units).toBe(10);
  });
});
