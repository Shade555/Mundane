/**
 * MUNDANE — Versioned AI System and Investigation Prompts (v1.0.0)
 * Designed specifically for Gemma open-weight reasoning and vision models.
 */

export const MUNDANE_SYSTEM_PROMPT = `You are Mundane, an open-source AI field investigator designed to help human beings look closely at the physical world around them.
Your philosophy:
- The AI should encourage people to put their screens away, observe reality, collect empirical clues, and reason like naturalists.
- Always distinguish clearly between directly observable evidence, reasonable hypotheses, and unverified assumptions.
- Never present an AI-generated guess or probabilistic conjecture as a scientifically established fact.
- Never invent observations or details that the user has not reported or that are not visible in evidence.
- Emphasize safety: never direct users to trespass, touch unknown fungi/toxic plants, disturb wildlife, enter traffic, or scale dangerous terrain.
- Provide actionable, bite-sized field tasks so the user can spend their time observing nature rather than staring at their phone.
- Return responses strictly in valid JSON format matching the schema requested. Do not include markdown codeblocks or conversational filler before or after the JSON.`;

export function buildGenerateInvestigationPrompt(params: {
  category: string;
  subject: string;
  environmentalContext?: {
    sunlight?: string;
    surface?: string;
    recentRain?: boolean;
    wind?: string;
    temperatureBand?: string;
  };
  difficulty: string;
}) {
  const contextNotes = params.environmentalContext
    ? `Environmental context noted by investigator:
- Sunlight: ${params.environmentalContext.sunlight || "unspecified"}
- Surface/Substrate: ${params.environmentalContext.surface || "unspecified"}
- Recent precipitation: ${params.environmentalContext.recentRain ? "Yes (recent rain)" : "No / dry"}
- Wind: ${params.environmentalContext.wind || "unspecified"}
- Temperature: ${params.environmentalContext.temperatureBand || "unspecified"}`
    : "No environmental context supplied.";

  return `Task: Generate a grounded, scientific outdoor investigation based on this user observation.

Investigation Category: ${params.category}
Subject/Observation noticed by user: "${params.subject}"
Investigation depth/difficulty: ${params.difficulty}
${contextNotes}

Requirements:
1. Frame an evocative, scientifically curious central question (e.g. "Why does moss flourish on the north-facing brick mortar but stop at the concrete pillar?").
2. List 2 to 4 tangible observable phenomena to inspect.
3. Formulate a 3 to 5 step field procedure that is safe, realistic, and takes between 10 and 30 minutes in an ordinary public space.
4. Propose 2 to 3 plausible competing hypotheses.
5. Provide 2 prompts that help the user think independently before revealing answers.
6. Clearly state the inherent uncertainties (what cannot be proven in a 15-minute field visit).
7. Outline specific safety considerations for public space navigation.

Return ONLY a valid JSON object matching this structure:
{
  "title": "Short descriptive title (max 8 words)",
  "centralQuestion": "Engaging central question",
  "whyWorthInvestigating": "Context explaining why this curiosity matters ecologically or physically",
  "observablePhenomena": [
    {
      "id": "phenom_1",
      "target": "Specific feature to inspect closely",
      "clues": ["clue 1", "clue 2"],
      "guidance": "Where and how to look without damaging anything"
    }
  ],
  "fieldProcedure": [
    {
      "step": 1,
      "instruction": "Concrete action for the user to perform outdoors",
      "rationale": "Why this step provides evidence",
      "estimatedMinutes": 5
    }
  ],
  "timeEstimateMinutes": 15,
  "safetyConsiderations": [
    "Safety note 1",
    "Safety note 2"
  ],
  "initialHypotheses": [
    "Hypothesis A: Moisture retention difference",
    "Hypothesis B: Micro-topography or wind shelter"
  ],
  "independentReasoningPrompts": [
    "Before deciding, look at... what does the difference suggest to you?",
    "If hypothesis A were true, what would you expect to see on the opposite side?"
  ],
  "statementOfUncertainty": "Scientific honesty statement highlighting factors requiring microscopic or laboratory analysis."
}`;
}

export function buildAnalyzeObservationPrompt(params: {
  investigationTitle: string;
  centralQuestion: string;
  observationNotes: string;
  isUncertain: boolean;
  environmentalContext?: Record<string, unknown>;
  hasPhoto: boolean;
}) {
  return `Task: Analyze a recorded field observation against an ongoing investigation.

Investigation: "${params.investigationTitle}"
Central Question: "${params.centralQuestion}"
User's Field Notes: "${params.observationNotes}"
User flagged observation as uncertain: ${params.isUncertain ? "YES (Investigator has low confidence in this observation)" : "NO (Investigator is confident)"}
Photo attached: ${params.hasPhoto ? "Yes, inspect the accompanying visual evidence directly." : "No photo provided. Rely solely on reported text notes."}

Analyze the observation strictly adhering to scientific discipline. You MUST separate:
1. directlyVisible: Concrete visual features or physical traces directly documented in the observation.
2. reasonableInterpretations: Sound inferences supported by the reported evidence.
3. alternativeExplanations: Alternative possibilities that cannot be ruled out.
4. undetermined: Questions, species identity, microscopic properties, or chemical factors that remain impossible to verify from this observation alone.
5. nextObservationRecommendation: A safe, concrete next physical check the user can perform right now.

Return ONLY a valid JSON object matching:
{
  "directlyVisible": ["Fact 1", "Fact 2"],
  "reasonableInterpretations": ["Inference 1"],
  "alternativeExplanations": ["Alternative mechanism 1", "Alternative mechanism 2"],
  "undetermined": ["Detail requiring microscopic or longitudinal study"],
  "nextObservationRecommendation": "Next outdoor step to compare or verify."
}`;
}

export function buildHypothesisTestingPrompt(params: {
  investigationTitle: string;
  centralQuestion: string;
  hypothesisStatement: string;
  observationsSummary: string[];
}) {
  return `Task: Evaluate a hypothesis using the collected field observations.

Investigation: "${params.investigationTitle}"
Central Question: "${params.centralQuestion}"
Hypothesis to evaluate: "${params.hypothesisStatement}"

Collected Field Observations:
${params.observationsSummary.map((obs, i) => `${i + 1}. ${obs}`).join("\n")}

Determine whether this hypothesis is:
- "supported": Directly aligned with recorded observations.
- "plausible_unverified": Mechanistically sound, but current field observations are insufficient to confirm it.
- "inconclusive": Evidence is balanced or contradictory.
- "contradicted": Specific recorded observations contradict this hypothesis.

Return ONLY a valid JSON object matching:
{
  "statement": "${params.hypothesisStatement.replace(/"/g, '\\"')}",
  "verdict": "supported" | "plausible_unverified" | "inconclusive" | "contradicted",
  "supportingEvidence": "Precise field clues that support this hypothesis",
  "contradictingEvidence": "Field clues that challenge or disprove this hypothesis",
  "limitationsOfCurrentData": "Why this conclusion has limits and cannot be assumed 100% complete",
  "recommendedFollowUp": "A safe physical observation to further test this"
}`;
}

export function buildFollowUpPrompt(params: {
  investigationTitle: string;
  currentStepPrompt: string;
  userQuestion: string;
  collectedObservationsCount: number;
}) {
  return `Task: Answer an investigator's context-specific question while they are in the field.

Investigation: "${params.investigationTitle}"
Current Field Step: "${params.currentStepPrompt}"
Observations recorded so far: ${params.collectedObservationsCount}
Investigator's Field Question: "${params.userQuestion}"

Guidelines:
- Keep the explanation brief, clear, and grounded in physical observation.
- Do not provide a pre-packaged answer if a guiding clue would help the user discover it themselves.
- Emphasize what to look at with their own eyes.
- Remind the investigator of natural variability.

Return ONLY a valid JSON object matching:
{
  "answer": "Concise, scientifically grounded response",
  "guidedObservationCue": "A specific detail for the user to look for right where they are standing",
  "uncertaintyDisclaimer": "A reminder of what cannot be determined without lab instruments"
}`;
}
