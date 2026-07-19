/**
 * Route params that carry a saved vial's own numbers into the calculator
 * screen, so a vial the user just saved becomes the calculator's active
 * source instead of an empty form. Echoes user-entered numbers only —
 * never invents a dose or any other value.
 */

import type { Vial } from "../db/models";

export interface VialCalculatorParams {
  // Index signature so this is assignable to expo-router's route params
  // (an object literal would satisfy it implicitly; a named return type needs it explicit).
  [key: string]: string;
  compoundName: string;
  vialMg: string;
  diluentMl: string;
  syringeCapacity: string;
}

export function vialToCalculatorParams(
  vial: Pick<Vial, "name" | "vialMg" | "diluentMl" | "syringeCapacityUnits">,
): VialCalculatorParams {
  return {
    compoundName: vial.name,
    vialMg: String(vial.vialMg),
    diluentMl: String(vial.diluentMl),
    syringeCapacity: String(vial.syringeCapacityUnits),
  };
}
