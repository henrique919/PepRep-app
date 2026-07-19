import { remainingMcg } from "../../engine/inventory";
import {
  doseEventFromEntry,
  doseTxnForEvent,
  initialTxnForVial,
  restoreTxnForEvent,
  voidTxnForEvent,
} from "../ledger";
import type { DoseEntry, Vial } from "../models";
import type { DoseEvent, InventoryTxn } from "../types";

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

  it("supports repeated void/restore cycles without ever double-debiting", () => {
    const txns: InventoryTxn[] = [initialTxnForVial(makeVial("vial-a", 5), "t-init")];
    const event = doseEventFromEntry(makeDose("evt-1", "vial-a", 250));
    const doseTxn = doseTxnForEvent(event, "t-dose");
    if (doseTxn !== null) txns.push(doseTxn);
    expect(remainingMcg(txns)).toBe(4750);

    const voidOne = voidTxnForEvent(txns, event.id, "t-void-1", "2026-07-02T09:00:00.000Z");
    if (voidOne !== null) txns.push(voidOne);
    expect(remainingMcg(txns)).toBe(5000);
    expect(restoreTxnForEvent(txns, event.id, "t-restore-1", "2026-07-02T10:00:00.000Z")).not.toBeNull();
    const restoreOne = restoreTxnForEvent(txns, event.id, "t-restore-1", "2026-07-02T10:00:00.000Z");
    if (restoreOne !== null) txns.push(restoreOne);
    expect(remainingMcg(txns)).toBe(4750);
    expect(restoreTxnForEvent(txns, event.id, "t-restore-duplicate", "2026-07-02T10:01:00.000Z")).toBeNull();

    const voidTwo = voidTxnForEvent(txns, event.id, "t-void-2", "2026-07-02T11:00:00.000Z");
    if (voidTwo !== null) txns.push(voidTwo);
    expect(remainingMcg(txns)).toBe(5000);
    const restoreTwo = restoreTxnForEvent(txns, event.id, "t-restore-2", "2026-07-02T12:00:00.000Z");
    if (restoreTwo !== null) txns.push(restoreTwo);
    expect(remainingMcg(txns)).toBe(4750);
  });

  it("produces no txn when no vial was chosen — the event alone is kept", () => {
    const event = doseEventFromEntry(makeDose("evt-2", null, 250));
    expect(doseTxnForEvent(event, "t-x")).toBeNull();
  });
});

describe.each(["direct vial", "calculator", "scheduled", "manual"])(
  "%s logging path",
  (entryPoint) => {
    it("persists the selected vial relationship and debits exactly once", () => {
      const event: DoseEvent = {
        ...doseEventFromEntry(makeDose(`evt-${entryPoint}`, "vial-a", 250)),
        ...(entryPoint === "scheduled"
          ? {
              planId: "plan-1",
              scheduleVersionId: "version-1",
              occurrenceKey: "2026-07-02|08:00|plan-1",
            }
          : {}),
      };
      const txns: InventoryTxn[] = [initialTxnForVial(makeVial("vial-a", 5), "t-init")];
      const txn = doseTxnForEvent(event, `txn-${entryPoint}`);
      expect(event.vialId).toBe("vial-a");
      expect(txn?.vialId).toBe("vial-a");
      if (txn !== null) txns.push(txn);
      expect(remainingMcg(txns)).toBe(4750);
    });
  },
);

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
