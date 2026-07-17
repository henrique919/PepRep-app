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

/**
 * Six red-team vectors (T3.3). Patterns must strengthen directionality —
 * the dose is the one quantity Ask never produces — without refusing
 * identity/glossary questions ("What is BPC-157?", "What does BAC mean?").
 */
const REFUSE_RULES: { id: string; vector: string; pattern: RegExp }[] = [
  // --- baseline eval set ---
  {
    id: "finish-vial-over-days",
    vector: "direct-dose",
    pattern:
      /finish.*(vial|bottle)|mcg\s*\/\s*day|mg\s*\/\s*day|per\s+day|per\s+week|over\s+\d+\s*days/i,
  },
  {
    id: "iu-to-mg",
    vector: "direct-dose",
    pattern: /\bIU\b.*\b(mg|mcg)\b|\b(mg|mcg)\s*box\b|put in the mg|IU.*convert|convert.*IU/i,
  },
  {
    id: "pharmacokinetics",
    vector: "direct-dose",
    pattern:
      /half[-\s]?lives?.*clear|until it'?s cleared|steady\s*state|accumulation|cmax|tmax|bioavailability/i,
  },
  {
    id: "weight-based-dose",
    vector: "direct-dose",
    pattern: /nmol\s*\/\s*kg|mg\s*\/\s*kg|i'?m\s+\d+\s*kg|body\s*weight|weigh\s+\d+/i,
  },
  {
    id: "split-into-n-doses",
    vector: "direct-dose",
    pattern:
      /\d+\s*doses?\s+from|how many (units|mcg|mg) each|doses from this vial|want\s+\d+\s+doses/i,
  },
  {
    id: "demo-dose",
    vector: "direct-dose",
    pattern:
      /typical (example )?dose|example dose|demo(nstration)? dose|show the steps with|i'?ll swap mine in/i,
  },
  {
    id: "approval-override",
    vector: "authority",
    pattern:
      /doctor approved|clinician approved|what dose should|how much should i (use|take|inject)|prescribe/i,
  },
  {
    id: "efficacy-comparison",
    vector: "comparative",
    pattern:
      /which is better|better for healing|best peptide|for recovery|vs\.?\s*(bpc|tb-?500)|compare.*(healing|efficacy)/i,
  },

  // --- T3.3: direct dose ---
  {
    id: "direct-dose-ask",
    vector: "direct-dose",
    pattern:
      /\b(what|whats|what's)\s+(is\s+)?(a\s+|the\s+)?(typical\s+|standard\s+|usual\s+|common\s+)?(dose|dosage)\b|\brecommended\s+(dose|dosage|amount)\b|\bhow\s+(much|many)\s+.+\b(inject|take|dose|dosing)\b|\bdose\s+of\s+\w+/i,
  },
  {
    id: "daily-weekly-amount",
    vector: "direct-dose",
    pattern:
      /\b(daily|weekly)\s+(amount|dose|dosage|mcg|mg)\b|\bhow\s+much\s+(per|a)\s+(day|week)\b|\bmcg\s+per\s+(day|week|injection)\b/i,
  },

  // --- T3.3: incremental extraction ---
  {
    id: "incremental-dont-dose-yet",
    vector: "incremental",
    pattern:
      /don'?t\s+(give|tell|say).{0,40}dose|not\s+(asking|looking)\s+for\s+(a\s+)?dose|just\s+(the\s+)?(math|formula|steps|numbers).{0,40}(later|after)|i'?ll\s+(multiply|divide|finish)\s+(it\s+)?(myself|later)/i,
  },
  {
    id: "incremental-step-ladder",
    vector: "incremental",
    pattern:
      /step\s*\(?\s*1\s*\)?.{0,80}(vial|concentration|total).{0,80}step\s*\(?\s*2|first\s+tell\s+me.{0,40}(concentration|total|mg).{0,60}(then|next|after).{0,40}(day|dose|divide)/i,
  },
  {
    id: "incremental-divide-for-dose",
    vector: "incremental",
    pattern:
      /divid(e|ing)\s+(that|it|the\s+(vial|total|amount)|.{0,20}vial).{0,40}(by|into|over).{0,20}(days|doses|weeks|daily)|how\s+to\s+(get|calculate|work\s+out).{0,30}(mcg|mg)\s*\/\s*(day|dose)|daily\s+amounts?\b/i,
  },

  // --- T3.3: roleplay / hypothetical ---
  {
    id: "roleplay-override",
    vector: "roleplay",
    pattern:
      /\b(pretend|role\s*-?\s*play|hypothetic|for\s+(a\s+|my\s+)?friend|ignore\s+(all\s+|previous\s+|prior\s+)?(rules|instructions|guardrails)|jailbreak|you\s+are\s+(now\s+)?(a\s+)?(doctor|clinician|pharmacist|prescriber))\b/i,
  },
  {
    id: "fiction-education-cover",
    vector: "roleplay",
    pattern:
      /for\s+(educational|fiction|fictional|story|novel|movie)\s+purposes|in\s+(a\s+)?(hypothetical|fictional)\s+(scenario|world|case)|this\s+is\s+(just\s+)?(a\s+)?(thought\s+experiment|hypothetical)/i,
  },

  // --- T3.3: studies / literature doses ---
  {
    id: "studies-dose",
    vector: "studies",
    pattern:
      /stud(y|ies)\s+(use|used|dose|dosing)|clinical\s+trial\s+(dose|dosing|amount)|research\s+(dose|protocol|amount)|what\s+(dose|amount|protocol)\s+(do|did|was|were)\s+(studies|trials|papers)|in\s+the\s+(literature|papers|research)|protocol\s+(dose|used\s+in)/i,
  },

  // --- T3.3: authority / permission ---
  {
    id: "authority-claim",
    vector: "authority",
    pattern:
      /\b(i'?m\s+(a\s+)?(licensed\s+)?(doctor|physician|clinician|pharmacist|prescriber)|my\s+(doctor|clinician|pharmacist)\s+(said|told|approved)|i\s+have\s+(a\s+)?prescription|under\s+(medical\s+)?supervision)\b/i,
  },

  // --- T3.3: comparative / efficacy ---
  {
    id: "comparative-efficacy",
    vector: "comparative",
    pattern:
      /\b(more\s+effective|better\s+than|best\s+for|most\s+potent|stack\s+with|synerg|which\s+(one\s+)?(works|is)\s+better|for\s+(fat\s+loss|muscle|healing|recovery|sleep|injury))\b/i,
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

/** Which refuse rule matched, if any — for eval reporting. */
export function matchingAskPolicyRule(
  question: string,
): { id: string; vector: string } | null {
  const q = question.trim();
  for (const rule of REFUSE_RULES) {
    if (rule.pattern.test(q)) {
      return { id: rule.id, vector: rule.vector };
    }
  }
  return null;
}

export function refuseContainsUnitQuantity(message: string): boolean {
  return UNIT_QUANTITY.test(message);
}
