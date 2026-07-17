/**
 * Client-side hard policy for Ask — refuses dosing / PK / recommendation
 * questions before any network call. Refuse copy must contain no numeric
 * quantities in mass, volume, or syringe units.
 */

export type PolicyDecision =
  | { action: "allow" }
  | { action: "refuse"; message: string };

/** Warm redirect with zero numeric unit quantities. */
export const REFUSE_REDIRECT =
  "I can't help with dosing, finishing a vial over time, unit conversions that invent a dose, pharmacokinetics, or comparing compounds for an outcome. PepRep's calculator only turns a dose you already chose into a draw (dose in → draw out). For identity facts, open Reference; for health decisions, ask a clinician.";

const REFUSE_RULES: { id: string; pattern: RegExp }[] = [
  {
    id: "finish-vial-over-days",
    pattern: /finish.*(vial|bottle)|mcg\s*\/\s*day|mg\s*\/\s*day|per\s+day|per\s+week|over\s+\d+\s*days/i,
  },
  {
    id: "iu-to-mg",
    pattern: /\bIU\b.*\b(mg|mcg)\b|\b(mg|mcg)\s*box\b|put in the mg|IU.*convert|convert.*IU/i,
  },
  {
    id: "pharmacokinetics",
    pattern:
      /half[-\s]?lives?.*clear|until it'?s cleared|steady\s*state|accumulation|cmax|tmax|bioavailability/i,
  },
  {
    id: "weight-based-dose",
    pattern: /nmol\s*\/\s*kg|mg\s*\/\s*kg|i'?m\s+\d+\s*kg|body\s*weight|weigh\s+\d+/i,
  },
  {
    id: "split-into-n-doses",
    pattern:
      /\d+\s*doses?\s+from|how many (units|mcg|mg) each|doses from this vial|want\s+\d+\s+doses/i,
  },
  {
    id: "demo-dose",
    pattern:
      /typical (example )?dose|example dose|demo(nstration)? dose|show the steps with|i'?ll swap mine in/i,
  },
  {
    id: "approval-override",
    pattern:
      /doctor approved|clinician approved|what dose should|how much should i (use|take|inject)|prescribe/i,
  },
  {
    id: "efficacy-comparison",
    pattern:
      /which is better|better for healing|best peptide|for recovery|vs\.?\s*(bpc|tb-?500)|compare.*(healing|efficacy)/i,
  },
];

/** Detect numeric quantities in a unit — used to assert refuse copy is clean. */
export const UNIT_QUANTITY =
  /\d+(?:\.\d+)?\s*(?:mcg|mg|iu|units?|ml|nmol|kg)\b/i;

export function evaluateAskPolicy(question: string): PolicyDecision {
  const q = question.trim();
  if (q.length === 0) {
    return {
      action: "refuse",
      message:
        "Ask a reference question about PepRep's compounds or measurement glossary — for example what a compound is, or what BAC water means.",
    };
  }
  for (const rule of REFUSE_RULES) {
    if (rule.pattern.test(q)) {
      return { action: "refuse", message: REFUSE_REDIRECT };
    }
  }
  return { action: "allow" };
}

export function refuseContainsUnitQuantity(message: string): boolean {
  return UNIT_QUANTITY.test(message);
}
