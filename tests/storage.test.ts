import { describe, it, expect, beforeEach } from "vitest";
import { storageAdapter } from "@/lib/db/storage-adapter";
import { Investigation, FieldObservation, Hypothesis } from "@/lib/types/investigation";

describe("Storage Adapter Persistence Tests", () => {
  const testInvestigation: Investigation = {
    id: "test_inv_001",
    title: "Urban Lichen Mapping",
    centralQuestion: "Why does crustose lichen prefer sandstone over granite pavers?",
    category: "moss_lichen_fungi",
    whyWorthInvestigating: "Tests surface pH and porosity preferences of pioneer cryptogams.",
    observablePhenomena: [
      {
        id: "p1",
        target: "Crust adhesion to substrate",
        clues: ["Foliose edges", "Surface roughness"],
        guidance: "Examine with close visual scrutiny.",
      },
    ],
    fieldProcedure: [
      {
        step: 1,
        instruction: "Inspect color contrast on sandstone.",
        rationale: "Establishes baseline colonisation.",
        estimatedMinutes: 5,
      },
      {
        step: 2,
        instruction: "Inspect adjacent granite block.",
        rationale: "Compares smooth vs porous substrate.",
        estimatedMinutes: 5,
      },
    ],
    timeEstimateMinutes: 10,
    difficulty: "gentle",
    safetyConsiderations: ["Keep to public pathways."],
    status: "in_progress",
    hypotheses: [
      {
        id: "h1",
        investigationId: "test_inv_001",
        statement: "Sandstone retains more moisture between rain events.",
        source: "ai",
        verdict: "pending",
        supportingEvidence: "",
        contradictingEvidence: "",
        createdAt: new Date().toISOString(),
      },
    ],
    observations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it("saves and retrieves an investigation record", async () => {
    await storageAdapter.saveInvestigation(testInvestigation);
    const retrieved = await storageAdapter.getInvestigation("test_inv_001");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe("Urban Lichen Mapping");
    expect(retrieved?.centralQuestion).toContain("crustose lichen");
  });

  it("records observations and updates the investigation state", async () => {
    const obs: FieldObservation = {
      id: "obs_001",
      investigationId: "test_inv_001",
      stepNumber: 1,
      prompt: "Inspect color contrast on sandstone.",
      notes: "Pale greenish grey crust firmly attached to weathered sandstone face.",
      isUncertain: false,
      environmentalContext: { surface: "brick_stone" },
      createdAt: new Date().toISOString(),
    };

    const updated = await storageAdapter.addObservation("test_inv_001", obs);
    expect(updated.observations.length).toBe(1);
    expect(updated.observations[0].notes).toContain("weathered sandstone");

    const reloaded = await storageAdapter.getInvestigation("test_inv_001");
    expect(reloaded?.observations.length).toBe(1);
    expect(reloaded?.observations[0].id).toBe("obs_001");
  });

  it("updates hypothesis verdict and supporting clues", async () => {
    const updatedHyp: Hypothesis = {
      id: "h1",
      investigationId: "test_inv_001",
      statement: "Sandstone retains more moisture between rain events.",
      source: "ai",
      verdict: "supported",
      supportingEvidence: "Surface dampness remained noticeably cooler on sandstone.",
      contradictingEvidence: "Granite dried completely within 15 minutes of sun.",
      createdAt: new Date().toISOString(),
    };

    const updated = await storageAdapter.updateHypothesis("test_inv_001", updatedHyp);
    expect(updated.hypotheses[0].verdict).toBe("supported");
    expect(updated.hypotheses[0].supportingEvidence).toContain("Surface dampness");
  });

  it("lists all stored investigations and deletes properly", async () => {
    const list = await storageAdapter.listInvestigations();
    expect(list.length).toBeGreaterThan(0);

    await storageAdapter.deleteInvestigation("test_inv_001");
    const checkDeleted = await storageAdapter.getInvestigation("test_inv_001");
    expect(checkDeleted).toBeNull();
  });
});
