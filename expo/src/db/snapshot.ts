/**
 * CalcSnapshot builders — pure mappers from engine outcomes to persisted
 * immutable math records. Ids/timestamps are injected by the caller.
 */

import {
  ENGINE_VERSION,
  type DiluentInput,
  type DiluentResult,
  type DrawInput,
  type DrawResult,
} from "../engine";

import type { CalcSnapshot } from "./types";

export function snapshotFromDraw(
  input: DrawInput,
  result: DrawResult,
  id: string,
  createdAt: string,
): CalcSnapshot {
  return {
    id,
    kind: "draw",
    inputs: {
      vialMg: input.vialMg,
      diluentMl: input.diluentMl,
      doseValue: input.doseValue,
      doseUnit: input.doseUnit,
      syringeCapacityUnits: input.syringeCapacityUnits ?? 100,
    },
    outputs: {
      concentrationMgPerMl: result.concentrationMgPerMl,
      concentrationMcgPerMl: result.concentrationMcgPerMl,
      doseMcg: result.doseMcg,
      volumeMl: result.volumeMl,
      units: result.units,
      dosesPerVial: result.dosesPerVial,
      steps: result.steps,
      warnings: result.warnings,
    },
    engineVersion: ENGINE_VERSION,
    createdAt,
  };
}

export function snapshotFromDiluent(
  input: DiluentInput,
  result: DiluentResult,
  id: string,
  createdAt: string,
): CalcSnapshot {
  return {
    id,
    kind: "diluent",
    inputs: {
      vialMg: input.vialMg,
      doseValue: input.doseValue,
      doseUnit: input.doseUnit,
      targetUnits: input.targetUnits,
    },
    outputs: {
      diluentMl: result.diluentMl,
      concentrationMgPerMl: result.concentrationMgPerMl,
      concentrationMcgPerMl: result.concentrationMcgPerMl,
      dosesPerVial: result.dosesPerVial,
      steps: result.steps,
      warnings: result.warnings,
    },
    engineVersion: ENGINE_VERSION,
    createdAt,
  };
}
