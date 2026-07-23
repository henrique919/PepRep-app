/**
 * Retention-loop wiring: a saved vial must produce calculator route params
 * that restore the same user-entered numbers (no invented defaults).
 */

import { vialLinkIntact, vialToCalculatorParams } from "../vialCalcParams";

describe("vialToCalculatorParams", () => {
  it("round-trips user vial numbers into calculator params", () => {
    expect(
      vialToCalculatorParams({
        id: "vial-1",
        name: "My peptide",
        vialMg: 10,
        diluentMl: 1.5,
        syringeCapacityUnits: 30,
      }),
    ).toEqual({
      vialId: "vial-1",
      compoundName: "My peptide",
      vialMg: "10",
      diluentMl: "1.5",
      syringeCapacity: "30",
    });
  });
});

describe("vialLinkIntact", () => {
  const source = { id: "vial-1", vialMg: "10", diluentMl: "1.5" };

  it("is true when the calculator fields still match the linked vial", () => {
    expect(vialLinkIntact(source, { vialText: "10", waterText: "1.5" })).toBe(true);
  });

  it("is true for an equivalent comma-decimal entry", () => {
    expect(vialLinkIntact(source, { vialText: "10", waterText: "1,5" })).toBe(true);
  });

  it("is false once the user edits the vial amount past the source", () => {
    expect(vialLinkIntact(source, { vialText: "20", waterText: "1.5" })).toBe(false);
  });

  it("is false once the user edits the water amount past the source", () => {
    expect(vialLinkIntact(source, { vialText: "10", waterText: "2" })).toBe(false);
  });

  it("is false when either field is unparseable", () => {
    expect(vialLinkIntact(source, { vialText: "", waterText: "1.5" })).toBe(false);
  });
});
