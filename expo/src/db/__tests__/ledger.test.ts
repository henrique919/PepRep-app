import { remainingMcg } from "../../engine/inventory";
import { doseEventFromEntry, doseTxnForEvent, initialTxnForVial, voidTxnForEvent } from "../ledger";
import type { DoseEntry, Vial } from "../models";
import type { InventoryTxn } from "../types";

function makeVial(id: string, vialMg: number): Vial {
  return {
    id,
    name: "User compound",
    vialMg,
    diluentMl: 2,
    syringeCapacityUnits: 100,
    note: "",
    reconstitutedAtIso: "2026-07-01T08:00:00.000Z",
    archivedAtIso: null,
    expiresAtIso: null,
    lot: "",
    lowStockThresholdPercent: null,
  };
}

function makeDose(id: string, vialId: string | null, doseMcg: number): DoseEntry {
  return {
    id,
    vialId,
    peptideName: "User compound",
    doseValue: doseMcg,
    doseUnit: "mcg",
    doseMcg,
    units: null,
    volumeMl: null,
    site: null,
    note: "",
    atIso: "2026-07-02T08:00:00.000Z",
  };
}

function forVial(txns: InventoryTxn[], vialId: string): InventoryTxn[] {
  return txns.filter((txn) => txn.vialId === vialId);
}

describe("log → un-log round trip", () => {
  it("void txn returns the balance to EXACTLY its pre-log value", () => {
    const txns: InventoryTxn[] = [initialTxnForVial(makeVial("vial-a", 5), "t-init")];
    const before = remainingMcg(txns);
    expect(before).toBe(5000);

    const event = doseEventFromEntry(makeDose("evt-1", "vial-a", 250));
    const doseTxn = doseTxnForEvent(event, "t-dose");
    expect(doseTxn).not.toBeNull();
    if (doseTxn !== null) txns.push(doseTxn);
    expect(remainingMcg(txns)).toBe(4750);

    const voidTxn = voidTxnForEvent(txns, "evt-1", "t-void", "2026-07-02T09:00:00.000Z");
    expect(voidTxn).not.toBeNull();
    if (voidTxn !== null) txns.push(voidTxn);
    expect(remainingMcg(txns)).toBe(before);
  });

  it("never double-compensates: a second void for the same event is null", () => {
    const txns: InventoryTxn[] = [initialTxnForVial(makeVial("vial-a", 5), "t-init")];
    const event = doseEventFromEntry(makeDose("evt-1", "vial-a", 250));
    const doseTxn = doseTxnForEvent(event, "t-dose");
    if (doseTxn !== null) txns.push(doseTxn);
    const firstVoid = voidTxnForEvent(txns, "evt-1", "t-void", "2026-07-02T09:00:00.000Z");
    if (firstVoid !== null) txns.push(firstVoid);

    expect(voidTxnForEvent(txns, "evt-1", "t-void-2", "2026-07-02T10:00:00.000Z")).toBeNull();
  });

  it("produces no txn when no vial was chosen — the event alone is kept", () => {
    const event = doseEventFromEntry(makeDose("evt-2", null, 250));
    expect(doseTxnForEvent(event, "t-x")).toBeNull();
  });
});

describe("one dose debits exactly ONE vial", () => {
  it("two vials of the same compound: the other vial is untouched", () => {
    const txns: InventoryTxn[] = [
      initialTxnForVial(makeVial("vial-a", 5), "t-init-a"),
      initialTxnForVial(makeVial("vial-b", 5), "t-init-b"),
    ];
    const event = doseEventFromEntry(makeDose("evt-1", "vial-a", 250));
    const doseTxn = doseTxnForEvent(event, "t-dose");
    if (doseTxn !== null) txns.push(doseTxn);

    expect(remainingMcg(forVial(txns, "vial-a"))).toBe(4750);
    expect(remainingMcg(forVial(txns, "vial-b"))).toBe(5000);
  });
});
