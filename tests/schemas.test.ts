import { describe, it, expect } from "vitest";
import {
  SetupInvestigationInputSchema,
  GeneratedInvestigationSchema,
  ObservationAnalysisSchema,
  HypothesisTestingSchema,
} from "@/lib/ai/schemas/investigation";

describe("Investigation Schemas Validation", () => {
  it("validates valid investigation setup input", () => {
    const input = {
      category: "botany_plants",
      subject: "Why are dandelions flourishing in the asphalt seam?",
      difficulty: "moderate",
      environmentalContext: {
        sunlight: "direct_sun",
        surface: "concrete",
        recentRain: true,
      },
    };
    const parsed = SetupInvestigationInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
  });

  it("rejects investigation setup without a subject description", () => {
    const input = {
      category: "botany_plants",
      subject: "x", // too short (< 2)
    };
    const parsed = SetupInvestigationInputSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("validates structured generated investigation from AI", () => {
    const generated = {
      title: "Asphalt Seam Micro-Botany",
      centralQuestion: "Why do plants germinate in one pavement fracture but not the adjacent crack?",
      whyWorthInvestigating: "Understanding how microscopic moisture accumulation creates miniature habitats in urban masonry.",
      observablePhenomena: [
        {
          id: "phenom_1",
          target: "Width and depth of the crack",
          clues: ["Sediment accumulation", "Moisture dampness"],
          guidance: "Examine with close visual focus without digging.",
        },
      ],
      fieldProcedure: [
        {
          step: 1,
          instruction: "Measure or estimate crack gap width on both sides.",
          rationale: "Establishes physical substrate difference.",
          estimatedMinutes: 5,
        },
        {
          step: 2,
          instruction: "Look for fine silt particles at the bottom of each fissure.",
          rationale: "Checks whether soil retention allows root anchoring.",
          estimatedMinutes: 5,
        },
      ],
      timeEstimateMinutes: 15,
      safetyConsiderations: ["Stay on pedestrian footpaths away from roadway traffic."],
      initialHypotheses: [
        "Sediment deposition is greater where pavement slopes toward the drain.",
        "Shade prevents rapid evaporation in the populated fissure.",
      ],
      independentReasoningPrompts: [
        "Is there a slope gradient visible when crouching at eye level?",
      ],
      statementOfUncertainty: "Root depth and microscopic soil fungal networks cannot be determined without excavation.",
    };

    const parsed = GeneratedInvestigationSchema.safeParse(generated);
    expect(parsed.success).toBe(true);
  });

  it("validates observation analysis strictly separating evidence from interpretations", () => {
    const analysis = {
      directlyVisible: ["Green rosette leaves with serrated margins", "Dark damp silt along crack base"],
      reasonableInterpretations: ["Moisture has lingered longer in this depression"],
      alternativeExplanations: ["Wind blown seeds preferentially settled in the deeper pocket"],
      undetermined: ["Exact plant subspecies or mycorrhizal association"],
      nextObservationRecommendation: "Touch a nearby dry crack surface to compare substrate temperature.",
    };

    const parsed = ObservationAnalysisSchema.safeParse(analysis);
    expect(parsed.success).toBe(true);
  });

  it("validates hypothesis testing outcome", () => {
    const testResult = {
      statement: "Moisture retention differs due to slope depression",
      verdict: "supported",
      supportingEvidence: "Darker damp soil consistently present in lower section",
      contradictingEvidence: "None noted in current field visit",
      limitationsOfCurrentData: "Rain occurred 2 hours ago; long-term dry condition unverified",
      recommendedFollowUp: "Revisit after 24 hours of dry sunshine to observe evaporation rates",
    };

    const parsed = HypothesisTestingSchema.safeParse(testResult);
    expect(parsed.success).toBe(true);
  });
});
