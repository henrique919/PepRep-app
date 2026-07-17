/**
 * PepRep calculation engine — pure, deterministic arithmetic.
 * Measurement math only. Contains no dosing recommendations and must never
 * suggest what or how much to take.
 */

/** Bumped only when CalcSnapshot output shape or arithmetic semantics change. */
export const ENGINE_VERSION = "1";

export type MassUnit = "mg" | "mcg";
export type SyringeCapacity = 30 | 50 | 100;

/** U-100 insulin syringe: 100 units per mL, always. */
export const U100_UNITS_PER_ML = 100;

export interface SyringeSpec {
  capacityUnits: SyringeCapacity;
  capacityMl: number;
  label: string;
}

export const SYRINGES: SyringeSpec[] = [
  { capacityUnits: 30, capacityMl: 0.3, label: "0.3 mL · 30 units" },
  { capacityUnits: 50, capacityMl: 0.5, label: "0.5 mL · 50 units" },
  { capacityUnits: 100, capacityMl: 1.0, label: "1.0 mL · 100 units" },
];

export interface MathStep { label: string; expression: string; result: string; }
export interface CalcError { ok: false; errors: string[]; }

export function roundTo(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/** Locale-stable number formatting for display ("2,500", "0.18"). */
export function fmt(value: number, maxDecimals = 2): string {
  return roundTo(value, maxDecimals).toLocaleString("en-US", {
    maximumFractionDigits: maxDecimals,
  });
}

export function mgToMcg(mg: number): number { return roundTo(mg * 1000, 6); }
export function mcgToMg(mcg: number): number { return roundTo(mcg / 1000, 9); }

/** U-100 syringe units → millilitres. */
export function unitsToMl(units: number): number {
  return roundTo(units / U100_UNITS_PER_ML, 4);
}
/** Millilitres → U-100 syringe units. */
export function mlToUnits(ml: number): number {
  return roundTo(ml * U100_UNITS_PER_ML, 2);
}

function toMcg(value: number, unit: MassUnit): number {
  return unit === "mg" ? value * 1000 : value;
}

function requirePositive(name: string, value: number, errors: string[]): void {
  if (!Number.isFinite(value) || value <= 0) {
    errors.push(`${name} must be a number greater than zero.`);
  }
}

/* ---------------- Draw calculation (flagship) ---------------- */

export interface DrawInput {
  vialMg: number;
  diluentMl: number;
  doseValue: number;
  doseUnit: MassUnit;
  syringeCapacityUnits?: SyringeCapacity;
}

export interface DrawResult {
  ok: true;
  concentrationMgPerMl: number;
  concentrationMcgPerMl: number;
  doseMcg: number;
  volumeMl: number;
  units: number;
  dosesPerVial: number;
  steps: MathStep[];
  warnings: string[];
}

export type DrawOutcome = DrawResult | CalcError;

export function calculateDraw(input: DrawInput): DrawOutcome {
  const errors: string[] = [];
  requirePositive("Vial amount", input.vialMg, errors);
  requirePositive("Water volume", input.diluentMl, errors);
  requirePositive("Dose", input.doseValue, errors);
  if (errors.length > 0) return { ok: false, errors };

  const capacity = input.syringeCapacityUnits ?? 100;
  const vialMcg = input.vialMg * 1000;
  const doseMcg = toMcg(input.doseValue, input.doseUnit);

  const concentrationMcgPerMl = vialMcg / input.diluentMl;
  const concentrationMgPerMl = concentrationMcgPerMl / 1000;
  const volumeMl = doseMcg / concentrationMcgPerMl;
  const units = volumeMl * U100_UNITS_PER_ML; // ← ALWAYS 100. Never `capacity`.
  const dosesPerVial = Math.floor(vialMcg / doseMcg + 1e-9);

  const warnings: string[] = [];
  const displayUnits = roundTo(units, 1);

  if (doseMcg > vialMcg) {
    warnings.push("This dose is larger than the total amount in the vial — check the numbers.");
  }
  if (displayUnits > capacity) {
    warnings.push(`This draw (${fmt(units, 1)} units) is more than a ${capacity}-unit syringe holds.`);
  }
  if (displayUnits > 0 && displayUnits < 2) {
    warnings.push("Draws under 2 units are hard to measure precisely on a U-100 syringe. Reconstituting with less water makes the same dose a larger, easier draw.");
  }
  if (displayUnits <= capacity && Math.abs(units - Math.round(units)) > 0.05) {
    warnings.push(`${fmt(units, 2)} units falls between syringe markings; the nearest mark is ${Math.round(units)} units. Adjusting the water volume can produce a rounder number.`);
  }

  const steps: MathStep[] = [
    { label: "Concentration",
      expression: `${fmt(input.vialMg)} mg ÷ ${fmt(input.diluentMl)} mL`,
      result: `${fmt(concentrationMgPerMl, 3)} mg/mL (${fmt(concentrationMcgPerMl)} mcg/mL)` },
    { label: "Volume for one dose",
      expression: `${fmt(doseMcg)} mcg ÷ ${fmt(concentrationMcgPerMl)} mcg/mL`,
      result: `${fmt(volumeMl, 3)} mL` },
    { label: "Syringe units (U-100)",
      expression: `${fmt(volumeMl, 3)} mL × 100 units/mL`,
      result: `${fmt(units, 1)} units` },
    { label: "Doses in the vial",
      expression: `${fmt(vialMcg)} mcg ÷ ${fmt(doseMcg)} mcg`,
      result: `${dosesPerVial} full ${dosesPerVial === 1 ? "dose" : "doses"}` },
  ];

  return {
    ok: true,
    concentrationMgPerMl: roundTo(concentrationMgPerMl, 4),
    concentrationMcgPerMl: roundTo(concentrationMcgPerMl, 2),
    doseMcg: roundTo(doseMcg, 3),
    volumeMl: roundTo(volumeMl, 4),
    units: roundTo(units, 2),
    dosesPerVial,
    steps,
    warnings,
  };
}

/* ------- Reverse: how much water for a target draw ------- */

export interface DiluentInput {
  vialMg: number;
  doseValue: number;
  doseUnit: MassUnit;
  targetUnits: number;
}

export interface DiluentResult {
  ok: true;
  diluentMl: number;
  concentrationMgPerMl: number;
  concentrationMcgPerMl: number;
  dosesPerVial: number;
  steps: MathStep[];
  warnings: string[];
}

export type DiluentOutcome = DiluentResult | CalcError;

export function calculateDiluent(input: DiluentInput): DiluentOutcome {
  const errors: string[] = [];
  requirePositive("Vial amount", input.vialMg, errors);
  requirePositive("Dose", input.doseValue, errors);
  requirePositive("Target units", input.targetUnits, errors);
  if (errors.length > 0) return { ok: false, errors };

  const vialMcg = input.vialMg * 1000;
  const doseMcg = toMcg(input.doseValue, input.doseUnit);
  const volumePerDoseMl = input.targetUnits / U100_UNITS_PER_ML;
  const concentrationMcgPerMl = doseMcg / volumePerDoseMl;
  const concentrationMgPerMl = concentrationMcgPerMl / 1000;
  const diluentMl = vialMcg / concentrationMcgPerMl;
  const dosesPerVial = Math.floor(vialMcg / doseMcg + 1e-9);

  const warnings: string[] = [];
  if (doseMcg > vialMcg) {
    warnings.push("This dose is larger than the total amount in the vial — check the numbers.");
  }
  if (diluentMl > 3) {
    warnings.push(`${fmt(diluentMl, 2)} mL is more than many small vials hold — check your vial's capacity, or target fewer units per dose.`);
  }
  if (diluentMl < 0.3) {
    warnings.push(`${fmt(diluentMl, 2)} mL is very little liquid to add and mix accurately — targeting more units per dose needs more water.`);
  }

  const steps: MathStep[] = [
    { label: "Volume you want one dose to be",
      expression: `${fmt(input.targetUnits, 1)} units ÷ 100 units/mL`,
      result: `${fmt(volumePerDoseMl, 3)} mL` },
    { label: "Concentration that makes it work",
      expression: `${fmt(doseMcg)} mcg ÷ ${fmt(volumePerDoseMl, 3)} mL`,
      result: `${fmt(concentrationMcgPerMl)} mcg/mL (${fmt(concentrationMgPerMl, 3)} mg/mL)` },
    { label: "Water to add",
      expression: `${fmt(vialMcg)} mcg ÷ ${fmt(concentrationMcgPerMl)} mcg/mL`,
      result: `${fmt(diluentMl, 2)} mL` },
    { label: "Doses in the vial",
      expression: `${fmt(vialMcg)} mcg ÷ ${fmt(doseMcg)} mcg`,
      result: `${dosesPerVial} full ${dosesPerVial === 1 ? "dose" : "doses"}` },
  ];

  return {
    ok: true,
    diluentMl: roundTo(diluentMl, 3),
    concentrationMgPerMl: roundTo(concentrationMgPerMl, 4),
    concentrationMcgPerMl: roundTo(concentrationMcgPerMl, 2),
    dosesPerVial,
    steps,
    warnings,
  };
}
