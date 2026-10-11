import { z } from "zod";

export const InvestigationCategoryEnum = z.enum([
  "botany_plants",
  "moss_lichen_fungi",
  "soil_geology_erosion",
  "microclimate_sun_shade",
  "birds_urban_wildlife",
  "water_traces_rain",
  "human_nature_interaction",
  "general_nature",
]);

export const DifficultyLevelEnum = z.enum(["gentle", "moderate", "thorough"]);

export const SetupInvestigationInputSchema = z.object({
  category: InvestigationCategoryEnum,
  subject: z.string().min(2, "Subject or observation description is required").max(500),
  photoBase64: z.string().optional(),
  environmentalContext: z
    .object({
      sunlight: z.enum(["direct_sun", "filtered_light", "deep_shade", "overcast"]).optional(),
      surface: z.enum(["concrete", "soil", "brick_stone", "bark", "sand_gravel", "water_edge", "other"]).optional(),
      recentRain: z.boolean().optional(),
      wind: z.enum(["still", "breeze", "gusty"]).optional(),
      temperatureBand: z.enum(["cold", "mild", "warm", "hot"]).optional(),
    })
    .optional(),
  difficulty: DifficultyLevelEnum.default("moderate"),
});

export const ObservablePhenomenonSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  target: z.string().min(3),
  clues: z.array(z.string().min(2)).min(1),
  guidance: z.string().min(5),
});

export const FieldProcedureStepSchema = z.object({
  step: z.number().int().positive(),
  instruction: z.string().min(5),
  rationale: z.string().min(5),
  estimatedMinutes: z.number().int().positive().default(5),
});

export const GeneratedInvestigationSchema = z.object({
  title: z.string().min(3).max(150),
  centralQuestion: z.string().min(5).max(300),
  whyWorthInvestigating: z.string().min(10),
  observablePhenomena: z.array(ObservablePhenomenonSchema).min(1).max(5),
  fieldProcedure: z.array(FieldProcedureStepSchema).min(2).max(6),
  timeEstimateMinutes: z.number().int().min(5).max(60),
  safetyConsiderations: z.array(z.string().min(5)).min(1),
  initialHypotheses: z.array(z.string().min(5)).min(1).max(4),
  independentReasoningPrompts: z.array(z.string().min(5)).min(1).max(3),
  statementOfUncertainty: z.string().min(10),
});

export const ObservationAnalysisSchema = z.object({
  directlyVisible: z
    .array(z.string().min(3))
    .min(1)
    .describe("Empirical, directly observable facts visible in the photo or described notes. No conjecture."),
  reasonableInterpretations: z
    .array(z.string().min(3))
    .min(1)
    .describe("Logical deductions based directly on the observable evidence."),
  alternativeExplanations: z
    .array(z.string().min(3))
    .min(1)
    .describe("Other plausible mechanisms or reasons for the observed phenomenon."),
  undetermined: z
    .array(z.string().min(3))
    .min(1)
    .describe("What cannot be determined or proven without further lab tests, seasonal observation, or microscopic inspection."),
  nextObservationRecommendation: z
    .string()
    .min(5)
    .describe("A safe, specific outdoor observation the user can do next to test between the hypotheses."),
});

export const HypothesisTestingSchema = z.object({
  hypothesisId: z.string().optional(),
  statement: z.string().min(3),
  verdict: z.enum(["supported", "plausible_unverified", "inconclusive", "contradicted"]),
  supportingEvidence: z.string().default(""),
  contradictingEvidence: z.string().default(""),
  limitationsOfCurrentData: z.string().default(""),
  recommendedFollowUp: z.string().default(""),
});

export const FollowUpAnswerSchema = z.object({
  answer: z.string().min(10),
  guidedObservationCue: z.string().min(5),
  uncertaintyDisclaimer: z.string().min(5),
});

export type SetupInvestigationInput = z.infer<typeof SetupInvestigationInputSchema>;
export type GeneratedInvestigation = z.infer<typeof GeneratedInvestigationSchema>;
export type ObservationAnalysisResult = z.infer<typeof ObservationAnalysisSchema>;
export type HypothesisTestingResult = z.infer<typeof HypothesisTestingSchema>;
export type FollowUpAnswerResult = z.infer<typeof FollowUpAnswerSchema>;
