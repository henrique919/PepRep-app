/**
 * Measurement glossary — shared by Reference UI and Ask corpus.
 * Definitions match engine invariants. Capacity is barrel volume only.
 */

import { U100_UNITS_PER_ML } from "../engine";

export interface GlossaryEntry {
  term: string;
  body: string;
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
  {
    term: "BAC water",
    body:
      "Bacteriostatic water — sterile water with a preservative, used to reconstitute a lyophilised peptide. PepRep treats the volume you enter as the diluent volume in millilitres; it does not recommend how much to add.",
  },
  {
    term: "Reconstitution",
    body:
      "Dissolving the peptide powder in diluent so the vial has a known concentration (mg per mL). PepRep’s calculator converts between vial mass, diluent volume, and the draw for a dose you enter — it never invents a dose.",
  },
  {
    term: "U-100",
    body: `An insulin syringe scale of exactly ${U100_UNITS_PER_ML} units per millilitre — always. PepRep’s unit math multiplies volume by ${U100_UNITS_PER_ML}. Barrel capacity (0.3 mL / 0.5 mL / 1.0 mL, marked as 30 / 50 / 100 units of volume) changes only how much the barrel holds, never the units-per-mL scale.`,
  },
  {
    term: "IU",
    body:
      "International Unit — a biological activity measure, not a mass. PepRep’s reconstitution math works in mcg and mg of mass and in U-100 syringe units of volume. It does not convert IU to mass; if a label is in IU, that conversion is outside this tool.",
  },
  {
    term: "mcg vs mg",
    body:
      "Mass units: 1 mg = 1000 mcg. PepRep lets you enter a dose in either unit and converts internally to micrograms for arithmetic. Choose the unit that matches how you write the dose — the calculator does not prefer one.",
  },
];
