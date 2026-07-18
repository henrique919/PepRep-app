/**
 * First-run vial draft — user-entered numbers only. No suggested defaults.
 */

import type { SyringeCapacity } from "../engine";
import { parseNumeric } from "../engine/parse";

export type OnboardingVialDraft = {
  name: string;
  vialText: string;
  waterText: string;
  capacity: SyringeCapacity;
};

export type ParsedOnboardingVial = {
  name: string;
  vialMg: number;
  diluentMl: number;
  syringeCapacityUnits: SyringeCapacity;
  note: string;
};

export type OnboardingVialResult =
  | { ok: true; vial: ParsedOnboardingVial }
  | { ok: false; errors: string[] };

export function parseOnboardingVialDraft(draft: OnboardingVialDraft): OnboardingVialResult {
  const errors: string[] = [];
  const name = draft.name.trim();
  if (name.length === 0) errors.push("Enter a label for this vial.");

  const vialMg = parseNumeric(draft.vialText);
  if (vialMg === null || vialMg <= 0) errors.push("Enter the vial contents in mg.");

  const diluentMl = parseNumeric(draft.waterText);
  if (diluentMl === null || diluentMl <= 0) errors.push("Enter how much water you added in mL.");

  if (errors.length > 0 || vialMg === null || diluentMl === null) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    vial: {
      name,
      vialMg,
      diluentMl,
      syringeCapacityUnits: draft.capacity,
      note: "",
    },
  };
}
