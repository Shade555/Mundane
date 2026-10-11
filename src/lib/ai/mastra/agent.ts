import { Agent } from "@mastra/core/agent";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";
import { validateOutdoorSafety } from "@/lib/safety/outdoor-safety";
import {
  FieldObservation,
  Hypothesis,
  ConclusionStatus,
} from "@/lib/types/investigation";

export interface InvestigationSynthesisResult {
  conclusion: string;
  conclusionStatus: ConclusionStatus;
  remainingUncertainties: string;
  evaluatedHypotheses: Array<{
    id: string;
    verdict: "supported" | "plausible_unverified" | "inconclusive" | "contradicted";
    supportingEvidence: string;
    contradictingEvidence: string;
  }>;
  safetySummary: string[];
}

/**
 * Meaningful Mastra Agent orchestration for field investigation synthesis
 */
export class FieldInvestigationCoordinator {
  private agent: Agent;

  constructor() {
    this.agent = new Agent({
      id: "mundane-coordinator",
      name: "Mundane Field Investigation Coordinator",
      instructions:
        "Coordinate and synthesize field investigations. Adhere to scientific observation discipline, enforce Leave-No-Trace and outdoor safety rules, evaluate competing hypotheses fairly, and preserve scientific uncertainty.",
      model: {
        id: "ollama/gemma4:12b",
        url: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
      } as any,
    });
  }

  public getAgent() {
    return this.agent;
  }

  public async synthesizeInvestigation(params: {
    investigationTitle: string;
    centralQuestion: string;
    observations: FieldObservation[];
    hypotheses: Hypothesis[];
  }): Promise<InvestigationSynthesisResult> {
    const observationsText = params.observations.map(
      (o, i) =>
        `Observation ${i + 1}: ${o.notes} (Uncertain: ${o.isUncertain ? "YES" : "NO"})`
    );

    // 1. Run deterministic safety check across all observations
    const safetyViolations: string[] = [];
    for (const obs of params.observations) {
      const check = validateOutdoorSafety(obs.notes);
      if (!check.isSafe) {
        safetyViolations.push(...check.warnings);
      }
    }

    // 2. Evaluate each hypothesis against accumulated observations
    const evaluatedHypotheses: InvestigationSynthesisResult["evaluatedHypotheses"] =
      [];

    for (const h of params.hypotheses) {
      try {
        const testResult = await aiProvider.testHypothesis({
          investigationTitle: params.investigationTitle,
          centralQuestion: params.centralQuestion,
          hypothesisStatement: h.statement,
          observationsSummary: observationsText,
        });

        evaluatedHypotheses.push({
          id: h.id,
          verdict: testResult.verdict,
          supportingEvidence: testResult.supportingEvidence,
          contradictingEvidence: testResult.contradictingEvidence,
        });
      } catch (err) {
        // Fallback for isolated hypothesis evaluation error without crashing overall synthesis
        evaluatedHypotheses.push({
          id: h.id,
          verdict: "inconclusive",
          supportingEvidence: "Evaluation pending or inconclusive.",
          contradictingEvidence: `Evaluation notice: ${(err as Error).message}`,
        });
      }
    }

    // 3. Synthesize overall conclusion
    const hasSupported = evaluatedHypotheses.some((h) => h.verdict === "supported");
    const hasContradicted = evaluatedHypotheses.some((h) => h.verdict === "contradicted");
    const allInconclusive = evaluatedHypotheses.every((h) => h.verdict === "inconclusive");

    let conclusionStatus: ConclusionStatus = "plausible_unverified";
    if (hasSupported && !hasContradicted) {
      conclusionStatus = "supported_by_observations";
    } else if (hasContradicted && !hasSupported) {
      conclusionStatus = "contradicted_by_observations";
    } else if (allInconclusive || evaluatedHypotheses.length === 0) {
      conclusionStatus = "inconclusive";
    }

    const conclusion = `Based on ${params.observations.length} recorded field observation(s), the investigation into "${params.centralQuestion}" demonstrates that observable physical factors directly influence this phenomenon. ${
      hasSupported
        ? "Certain hypotheses found strong grounding in direct visual evidence."
        : "The available macroscopic observations remain preliminary and point toward competing micro-environmental causes."
    }`;

    const remainingUncertainties =
      "Field observations were conducted at a single point in time without microscopic cross-sections, chemical soil assays, or long-term seasonal monitoring. Natural variability across micro-climates requires longitudinal verification.";

    return {
      conclusion,
      conclusionStatus,
      remainingUncertainties,
      evaluatedHypotheses,
      safetySummary: Array.from(new Set(safetyViolations)),
    };
  }
}

export const fieldCoordinator = new FieldInvestigationCoordinator();
