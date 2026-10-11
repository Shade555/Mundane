/**
 * Deterministic Outdoor Safety Rule Engine
 * Ensures investigations adhere to the "Leave No Trace" principle, safe public outdoor observation,
 * and never encourage risky physical actions, foraging/eating wild plants, handling unknown fungi, or trespassing.
 */

export interface SafetyCheckResult {
  isSafe: boolean;
  warnings: string[];
  mandatoryPrecautions: string[];
}

const HAZARD_PATTERNS = [
  { regex: /\b(taste|eat|ingest|consume|sample|chew)\b/i, warning: "Never taste or ingest any wild plant, berry, seed, or fungus." },
  { regex: /\b(touch|rub|handle)\b[\w\s]{0,25}\b(mushroom|fungus|toadstool|spore)\b/i, warning: "Observe fungi with your eyes or camera only. Do not handle or disturb fruiting bodies." },
  { regex: /\b(trespass|climb fence|private property|restricted area)\b/i, warning: "Always stay within public parks and sidewalks; never trespass onto private property or restricted land." },
  { regex: /\b(highway|railroad|train track|busy road|traffic)\b/i, warning: "Never conduct observations near active vehicular roadways, railway tracks, or dangerous drop-offs." },
  { regex: /\b(disturb|catch|trap|hold|corner)\b[\w\s]{0,25}\b(animal|bird|snake|wasp|bee|insect)\b/i, warning: "Observe wildlife from a respectful distance without cornering or disturbing creatures or their nests." },
  { regex: /\b(break|tear off|strip bark|snap branch|dig up root)\b/i, warning: "Practice 'Leave No Trace': observe living plants and trees without stripping bark or causing damage." },
  { regex: /\b(deep water|river current|thin ice|cliff edge|quarry)\b/i, warning: "Maintain a safe boundary from water bodies, swift currents, unstable banks, or steep drops." }
];

export function validateOutdoorSafety(text: string): SafetyCheckResult {
  const warnings: string[] = [];

  for (const pattern of HAZARD_PATTERNS) {
    if (pattern.regex.test(text)) {
      warnings.push(pattern.warning);
    }
  }

  const mandatoryPrecautions = [
    "Remain in accessible public spaces; respect private property boundaries.",
    "Do not touch unfamiliar fungi, stinging plants, or wild creatures.",
    "Be aware of footing on uneven paving, slippery rocks, or damp soil.",
    "Leave natural features undisturbed for others and the ecosystem."
  ];

  return {
    isSafe: warnings.length === 0,
    warnings,
    mandatoryPrecautions,
  };
}

export function sanitizeFieldProcedure(procedureSteps: { instruction: string; rationale: string }[]) {
  return procedureSteps.map((step) => {
    const safety = validateOutdoorSafety(step.instruction);
    return {
      ...step,
      safetyWarnings: safety.warnings,
    };
  });
}
