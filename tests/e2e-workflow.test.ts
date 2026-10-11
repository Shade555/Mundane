import { describe, it, expect } from "vitest";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";
import { fieldCoordinator } from "@/lib/ai/mastra/agent";
import { storageAdapter } from "@/lib/db/storage-adapter";
import { Investigation, FieldObservation, Hypothesis } from "@/lib/types/investigation";

describe("Mandatory 13-Step End-to-End Acceptance Journey", () => {
  let investigationId: string;
  let activeInvestigation: Investigation;

  it("Step 1 & 2: Confirm real AI runtime is available and healthy", async () => {
    const health = await aiProvider.checkHealth();
    expect(health.available).toBe(true);
    expect(health.model).toBeDefined();
    expect(health.runtime).toContain("Ollama");
  });

  it("Step 3 & 4: Generate an investigation using the configured model and review procedure", async () => {
    // Generate grounded investigation
    const generated = await aiProvider.generateInvestigation({
      category: "botany_plants",
      subject: "Why does plantain grass thrive in high foot-traffic pavement seams but dandelion dominates low-traffic lawn borders?",
      difficulty: "moderate",
      environmentalContext: {
        surface: "concrete",
        sunlight: "direct_sun",
        recentRain: false,
      },
    });

    expect(generated.title).toBeDefined();
    expect(generated.centralQuestion).toBeDefined();
    expect(generated.fieldProcedure.length).toBeGreaterThanOrEqual(2);
    expect(generated.observablePhenomena.length).toBeGreaterThan(0);
    expect(generated.safetyConsiderations.length).toBeGreaterThan(0);

    // Initialise and persist investigation
    investigationId = "e2e_inv_" + Date.now();
    activeInvestigation = {
      id: investigationId,
      title: generated.title,
      centralQuestion: generated.centralQuestion,
      category: "botany_plants",
      whyWorthInvestigating: generated.whyWorthInvestigating,
      observablePhenomena: generated.observablePhenomena,
      fieldProcedure: generated.fieldProcedure,
      timeEstimateMinutes: generated.timeEstimateMinutes,
      difficulty: "moderate",
      safetyConsiderations: generated.safetyConsiderations,
      status: "in_progress",
      hypotheses: generated.initialHypotheses.map((h, i) => ({
        id: `hyp_${i + 1}`,
        investigationId,
        statement: h,
        source: "ai",
        verdict: "pending",
        supportingEvidence: "",
        contradictingEvidence: "",
        createdAt: new Date().toISOString(),
      })),
      observations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storageAdapter.saveInvestigation(activeInvestigation);
  }, 180000); // Allow inference timeout

  it("Step 5, 6 & 7: Record real observation, submit evidence, and receive grounded analysis", async () => {
    const obsNotes = "Broadleaf plantain shows thick fibrous leaf ribs hugging flat against the stone, completely undamaged by passing footsteps.";
    const analysis = await aiProvider.analyzeObservation({
      investigationTitle: activeInvestigation.title,
      centralQuestion: activeInvestigation.centralQuestion,
      observationNotes: obsNotes,
      isUncertain: false,
    });

    expect(analysis.directlyVisible.length).toBeGreaterThan(0);
    expect(analysis.reasonableInterpretations.length).toBeGreaterThan(0);
    expect(analysis.alternativeExplanations.length).toBeGreaterThan(0);
    expect(analysis.undetermined.length).toBeGreaterThan(0);
    expect(analysis.nextObservationRecommendation).toBeDefined();

    const observation: FieldObservation = {
      id: "obs_e2e_1",
      investigationId,
      stepNumber: 1,
      prompt: activeInvestigation.fieldProcedure[0].instruction,
      notes: obsNotes,
      isUncertain: false,
      environmentalContext: {},
      aiAnalysis: analysis,
      createdAt: new Date().toISOString(),
    };

    const updated = await storageAdapter.addObservation(investigationId, observation);
    expect(updated.observations.length).toBe(1);
    activeInvestigation = updated;
  }, 180000);

  it("Step 8 & 9: Form/revise hypothesis and evaluate competing explanations", async () => {
    // Add user-proposed hypothesis
    const userHyp: Hypothesis = {
      id: "hyp_user_1",
      investigationId,
      statement: "Flat rosette morphology and elastic leaf veins resist mechanical compaction from trampling.",
      source: "user",
      verdict: "pending",
      supportingEvidence: "",
      contradictingEvidence: "",
      createdAt: new Date().toISOString(),
    };

    await storageAdapter.updateHypothesis(investigationId, userHyp);

    // Test hypothesis with observations
    const evalResult = await aiProvider.testHypothesis({
      investigationTitle: activeInvestigation.title,
      centralQuestion: activeInvestigation.centralQuestion,
      hypothesisStatement: userHyp.statement,
      observationsSummary: [activeInvestigation.observations[0].notes],
    });

    expect(["supported", "plausible_unverified", "inconclusive"]).toContain(evalResult.verdict);
    expect(evalResult.supportingEvidence).toBeDefined();

    userHyp.verdict = evalResult.verdict;
    userHyp.supportingEvidence = evalResult.supportingEvidence;
    await storageAdapter.updateHypothesis(investigationId, userHyp);
  }, 180000);

  it("Step 10 & 11: Produce conclusion with explicit uncertainty and save to journal", async () => {
    const synthesis = await fieldCoordinator.synthesizeInvestigation({
      investigationTitle: activeInvestigation.title,
      centralQuestion: activeInvestigation.centralQuestion,
      observations: activeInvestigation.observations,
      hypotheses: activeInvestigation.hypotheses,
    });

    expect(synthesis.conclusion).toBeDefined();
    expect(synthesis.conclusionStatus).toBeDefined();
    expect(synthesis.remainingUncertainties).toBeDefined();

    activeInvestigation.status = "completed";
    activeInvestigation.conclusion = synthesis.conclusion;
    activeInvestigation.conclusionStatus = synthesis.conclusionStatus;
    activeInvestigation.remainingUncertainties = synthesis.remainingUncertainties;

    await storageAdapter.saveInvestigation(activeInvestigation);
  }, 180000);

  it("Step 12 & 13: Reopen journal, verify persistence, and confirm recorded evidence is retained on resume", async () => {
    const journalEntries = await storageAdapter.listInvestigations();
    const loaded = journalEntries.find((i) => i.id === investigationId);

    expect(loaded).toBeDefined();
    expect(loaded?.status).toBe("completed");
    expect(loaded?.observations.length).toBe(1);
    expect(loaded?.observations[0].notes).toContain("Broadleaf plantain");
    expect(loaded?.conclusion).toBeDefined();
    expect(loaded?.remainingUncertainties).toBeDefined();

    // Verify resumption
    const resumed = await storageAdapter.getInvestigation(investigationId);
    expect(resumed?.id).toBe(investigationId);
    expect(resumed?.fieldProcedure.length).toBeGreaterThan(0);
    expect(resumed?.observations.length).toBe(1);
  });
});
