/**
 * Retention-loop wiring: a saved vial must produce calculator route params
 * that restore the same user-entered numbers (no invented defaults).
 */

import { vialToCalculatorParams } from "../vialCalcParams";

describe("vialToCalculatorParams", () => {
  it("round-trips user vial numbers into calculator params", () => {
    expect(
      vialToCalculatorParams({
        name: "My peptide",
        vialMg: 10,
        diluentMl: 1.5,
        syringeCapacityUnits: 30,
      }),
    ).toEqual({
      compoundName: "My peptide",
      vialMg: "10",
      diluentMl: "1.5",
      syringeCapacity: "30",
    });
  });
});
