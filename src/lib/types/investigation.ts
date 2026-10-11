export type InvestigationCategory =
  | "botany_plants"
  | "moss_lichen_fungi"
  | "soil_geology_erosion"
  | "microclimate_sun_shade"
  | "birds_urban_wildlife"
  | "water_traces_rain"
  | "human_nature_interaction"
  | "general_nature";

export type DifficultyLevel = "gentle" | "moderate" | "thorough";

export type ConclusionStatus =
  | "supported_by_observations"
  | "plausible_unverified"
  | "inconclusive"
  | "contradicted_by_observations";

export interface ObservablePhenomenon {
  id: string;
  target: string;
  clues: string[];
  guidance: string;
}

export interface FieldProcedureStep {
  step: number;
  instruction: string;
  rationale: string;
  estimatedMinutes: number;
}

export interface EnvironmentalContext {
  sunlight?: "direct_sun" | "filtered_light" | "deep_shade" | "overcast";
  surface?: "concrete" | "soil" | "brick_stone" | "bark" | "sand_gravel" | "water_edge" | "other";
  recentRain?: boolean;
  wind?: "still" | "breeze" | "gusty";
  temperatureBand?: "cold" | "mild" | "warm" | "hot";
}

export interface ObservationAnalysis {
  directlyVisible: string[];
  reasonableInterpretations: string[];
  alternativeExplanations: string[];
  undetermined: string[];
  nextObservationRecommendation: string;
}

export interface FieldObservation {
  id: string;
  investigationId: string;
  stepNumber: number;
  prompt: string;
  notes: string;
  isUncertain: boolean;
  environmentalContext: EnvironmentalContext;
  photoUrl?: string;
  photoBase64?: string;
  aiAnalysis?: ObservationAnalysis;
  createdAt: string;
}

export interface Hypothesis {
  id: string;
  investigationId: string;
  statement: string;
  source: "user" | "ai";
  verdict: "pending" | "supported" | "plausible_unverified" | "inconclusive" | "contradicted";
  supportingEvidence: string;
  contradictingEvidence: string;
  createdAt: string;
}

export interface Investigation {
  id: string;
  userId?: string;
  title: string;
  centralQuestion: string;
  category: InvestigationCategory;
  whyWorthInvestigating: string;
  observablePhenomena: ObservablePhenomenon[];
  fieldProcedure: FieldProcedureStep[];
  timeEstimateMinutes: number;
  difficulty: DifficultyLevel;
  safetyConsiderations: string[];
  status: "in_progress" | "completed" | "paused";
  hypotheses: Hypothesis[];
  observations: FieldObservation[];
  conclusion?: string;
  conclusionStatus?: ConclusionStatus;
  remainingUncertainties?: string;
  personalReflections?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIModelStatus {
  available: boolean;
  runtime: string;
  model: string;
  visionModel: string;
  hasVisionSupport: boolean;
  inferenceMode: "local" | "remote";
  endpoint: string;
  error?: string;
}
