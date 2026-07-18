import { remainingMcg } from "../../engine/inventory";
import { migrateV1 } from "../migrate-v1";
import type { DoseEntry, Vial } from "../models";
import type { InventoryTxn } from "../types";

const vials: Vial[] = [
  {
    id: "vial-a",
    name: "Compound A",
    vialMg: 5,
    diluentMl: 2,
    syringeCapacityUnits: 100,
    note: "",
    reconstitutedAtIso: "2026-06-01T08:00:00.000Z",
    archivedAtIso: null,
    expiresAtIso: null,
    lot: "",
    lowStockThresholdPercent: null,
  },
  {
    id: "vial-b",
    name: "Compound B",
    vialMg: 10,
    diluentMl: 1,
    syringeCapacityUnits: 30,
    note: "",
    reconstitutedAtIso: "2026-06-10T08:00:00.000Z",
    archivedAtIso: null,
    expiresAtIso: null,
    lot: "",
    lowStockThresholdPercent: null,
  },
];

function dose(id: string, vialId: string | null, doseMcg: number): DoseEntry {
  return {
    id,
    vialId,
    peptideName: "Compound A",
    doseValue: doseMcg,
    doseUnit: "mcg",
    doseMcg,
    units: 10,
    volumeMl: 0.1,
    site: "abdomen-left",
    note: "",
    atIso: "2026-06-15T08:00:00.000Z",
  };
}

const doses: DoseEntry[] = [
  dose("d1", "vial-a", 250),
  dose("d2", "vial-a", 250),
  dose("d3", "vial-b", 1000),
  dose("d4", null, 300), // logged without choosing a vial — must still survive
];

function forVial(txns: InventoryTxn[], vialId: string): InventoryTxn[] {
  return txns.filter((txn) => txn.vialId === vialId);
}

describe("v1 → v2 migration mapping", () => {
  const result = migrateV1(vials, doses);

  it("has zero row loss: every legacy dose becomes a DoseEvent", () => {
    expect(result.doseEvents).toHaveLength(doses.length);
    const ids = result.doseEvents.map((event) => event.id).sort();
    expect(ids).toEqual(["d1", "d2", "d3", "d4"]);
  });

  it("reproduces each vial's previously displayed remaining value exactly", () => {
    // v1 display: remaining = vialMg * 1000 - sum(doses logged against the vial)
    expect(remainingMcg(forVial(result.txns, "vial-a"))).toBe(5000 - 250 - 250);
    expect(remainingMcg(forVial(result.txns, "vial-b"))).toBe(10000 - 1000);
  });

  it("denormalises the copy — events carry their own compound and dose fields", () => {
    const event = result.doseEvents.find((candidate) => candidate.id === "d1");
    expect(event?.compoundName).toBe("Compound A");
    expect(event?.doseMcg).toBe(250);
    expect(event?.units).toBe(10);
    expect(event?.status).toBe("completed");
  });

  it("keeps vial-less rows as events without inventing a txn", () => {
    const event = result.doseEvents.find((candidate) => candidate.id === "d4");
    expect(event).toBeDefined();
    expect(event?.vialId).toBeUndefined();
    expect(result.txns.some((txn) => txn.sourceEventId === "d4")).toBe(false);
  });

  it("flags rows a ledger txn could not be produced for, without dropping them", () => {
    const withBadMass = [dose("d5", "vial-a", Number.NaN)];
    const flagged = migrateV1(vials, withBadMass);
    expect(flagged.doseEvents).toHaveLength(1);
    expect(flagged.unmapped.map((row) => row.id)).toEqual(["d5"]);
  });
});
