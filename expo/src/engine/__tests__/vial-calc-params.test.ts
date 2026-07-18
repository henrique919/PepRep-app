/**
 * Retention-loop wiring: a saved vial must produce calculator route params
 * that restore the same user-entered numbers (no invented defaults).
 */

import type { Vial } from "../../db/models";

function calcParamsFromVial(vial: Pick<Vial, "name" | "vialMg" | "diluentMl" | "syringeCapacityUnits">) {
  return {
    compoundName: vial.name,
    vialMg: String(vial.vialMg),
    diluentMl: String(vial.diluentMl),
    syringeCapacity: String(vial.syringeCapacityUnits),
  };
}

describe("calcParamsFromVial", () => {
  it("round-trips user vial numbers into calculator params", () => {
    expect(
      calcParamsFromVial({
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
