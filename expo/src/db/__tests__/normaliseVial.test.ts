import { normaliseVialRecord } from "../normaliseVial";
import type { Vial } from "../models";

describe("normaliseVialRecord", () => {
  it("back-fills v4 inventory fields without dropping legacy data", () => {
    const legacy = {
      id: "v1",
      name: "Legacy",
      vialMg: 5,
      diluentMl: 2,
      syringeCapacityUnits: 100 as const,
      note: "keep me",
      reconstitutedAtIso: "2026-01-01T00:00:00.000Z",
      archivedAtIso: null,
    } as Vial;

    const normalised = normaliseVialRecord(legacy);
    expect(normalised.name).toBe("Legacy");
    expect(normalised.note).toBe("keep me");
    expect(normalised.expiresAtIso).toBeNull();
    expect(normalised.lot).toBe("");
    expect(normalised.lowStockThresholdPercent).toBeNull();
  });
});
