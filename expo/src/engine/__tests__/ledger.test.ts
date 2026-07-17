import type { InventoryTxn } from "../../db/types";
import { remainingDoses, remainingMcg } from "../inventory";

function txn(partial: Partial<InventoryTxn> & Pick<InventoryTxn, "type" | "deltaMcg">): InventoryTxn {
  return {
    id: partial.id ?? `t-${Math.random().toString(36).slice(2)}`,
    vialId: partial.vialId ?? "vial-a",
    type: partial.type,
    deltaMcg: partial.deltaMcg,
    sourceEventId: partial.sourceEventId,
    occurredAt: partial.occurredAt ?? "2026-07-01T08:00:00.000Z",
    note: partial.note,
  };
}

describe("remainingMcg — derived inventory", () => {
  it("returns 0 for an empty ledger", () => {
    expect(remainingMcg([])).toBe(0);
  });

  it("initial(+5000) then dose(-250) -> 4750", () => {
    const txns = [
      txn({ type: "initial", deltaMcg: 5000 }),
      txn({ type: "dose", deltaMcg: -250 }),
    ];
    expect(remainingMcg(txns)).toBe(4750);
  });

  it("ignores non-finite deltas rather than corrupting the balance", () => {
    const txns = [
      txn({ type: "initial", deltaMcg: 5000 }),
      txn({ type: "adjustment", deltaMcg: Number.NaN }),
    ];
    expect(remainingMcg(txns)).toBe(5000);
  });
});

describe("remainingDoses", () => {
  it("floors full draws at the reference dose", () => {
    expect(remainingDoses(4750, 250)).toBe(19);
    expect(remainingDoses(499, 250)).toBe(1);
  });

  it("returns 0 for empty or invalid inputs", () => {
    expect(remainingDoses(0, 250)).toBe(0);
    expect(remainingDoses(1000, 0)).toBe(0);
    expect(remainingDoses(Number.NaN, 250)).toBe(0);
  });
});
