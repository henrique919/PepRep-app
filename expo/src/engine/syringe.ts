/**
 * Syringe gauge geometry — pure helpers that describe how a draw sits on a
 * U-100 insulin syringe barrel. Capacity is BARREL VOLUME ONLY and is never
 * used as a units-per-mL multiplier.
 */

import { roundTo, U100_UNITS_PER_ML } from "./index";
import type { SyringeCapacity } from "./index";

export interface GaugeTick {
  units: number;
  major: boolean;
  /** Position along the barrel, 0 (empty end) → 1 (full capacity). */
  fraction: number;
}

export interface SyringeGaugeModel {
  capacityUnits: SyringeCapacity;
  capacityMl: number;
  /** Distance in units between printed markings on this barrel. */
  markStepUnits: number;
  ticks: GaugeTick[];
  /** How full the barrel is for this draw, clamped to 0..1. */
  fillFraction: number;
  overflow: boolean;
  /** The printed marking closest to the requested draw. */
  nearestMarkUnits: number;
}

/** Marking pitch of common U-100 barrels: 1 unit up to 50u, 2 units on 100u. */
export function markStepFor(capacity: SyringeCapacity): number {
  return capacity === 100 ? 2 : 1;
}

/** Builds the drawable model for a syringe barrel showing `drawUnits`. */
export function buildSyringeGauge(drawUnits: number, capacity: SyringeCapacity): SyringeGaugeModel {
  const markStepUnits = markStepFor(capacity);
  const majorEvery = capacity === 100 ? 10 : 5;
  const ticks: GaugeTick[] = [];
  for (let u = 0; u <= capacity; u += markStepUnits) {
    ticks.push({
      units: u,
      major: u % majorEvery === 0,
      fraction: roundTo(u / capacity, 4),
    });
  }

  const safeUnits = Number.isFinite(drawUnits) && drawUnits > 0 ? drawUnits : 0;
  const fillFraction = Math.min(Math.max(safeUnits / capacity, 0), 1);

  return {
    capacityUnits: capacity,
    capacityMl: roundTo(capacity / U100_UNITS_PER_ML, 1),
    markStepUnits,
    ticks,
    fillFraction: roundTo(fillFraction, 4),
    overflow: safeUnits > capacity,
    nearestMarkUnits: roundTo(Math.round(safeUnits / markStepUnits) * markStepUnits, 2),
  };
}
