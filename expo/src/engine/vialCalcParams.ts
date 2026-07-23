/**
 * Route params that carry a saved vial's own numbers into the calculator
 * screen, so a vial the user just saved becomes the calculator's active
 * source instead of an empty form. Echoes user-entered numbers only —
 * never invents a dose or any other value.
 */

import type { Vial } from "../db/models";
import { parseNumeric } from "./parse";

export interface VialCalculatorParams {
  // Index signature so this is assignable to expo-router's route params
  // (an object literal would satisfy it implicitly; a named return type needs it explicit).
  [key: string]: string;
  vialId: string;
  compoundName: string;
  vialMg: string;
  diluentMl: string;
  syringeCapacity: string;
}

export function vialToCalculatorParams(
  vial: Pick<Vial, "id" | "name" | "vialMg" | "diluentMl" | "syringeCapacityUnits">,
): VialCalculatorParams {
  return {
    vialId: vial.id,
    compoundName: vial.name,
    vialMg: String(vial.vialMg),
    diluentMl: String(vial.diluentMl),
    syringeCapacity: String(vial.syringeCapacityUnits),
  };
}

/** The saved vial a calculator draft was derived from, so we can tell when the user has edited past it. */
export interface VialLinkSource {
  id: string;
  vialMg: string;
  diluentMl: string;
}

/**
 * True while the calculator's vial/water fields still match the linked
 * vial's own numbers. Once the user edits past those numbers the link is
 * stale and should stop being treated as authoritative.
 */
export function vialLinkIntact(
  source: VialLinkSource,
  current: { vialText: string; waterText: string },
): boolean {
  const sourceMg = parseNumeric(source.vialMg);
  const sourceMl = parseNumeric(source.diluentMl);
  const currentMg = parseNumeric(current.vialText);
  const currentMl = parseNumeric(current.waterText);
  return (
    sourceMg !== null &&
    sourceMl !== null &&
    currentMg === sourceMg &&
    currentMl === sourceMl
  );
}
