import { describe, it, expect } from "vitest";
import { aiProvider, OllamaAIProvider } from "@/lib/ai/providers/ollama-provider";

describe("AI Model Provider & Health Check", () => {
  it("checks real Ollama runtime endpoint and inspects model metadata", async () => {
    const status = await aiProvider.checkHealth();
    expect(status).toBeDefined();
    expect(status.runtime).toContain("Ollama");
    // Verify it reports real model name and endpoint
    expect(status.endpoint).toBeDefined();
    expect(status.model).toBeDefined();
    expect(typeof status.hasVisionSupport).toBe("boolean");
  });

  it("gracefully reports unavailable status when given an unreachable endpoint", async () => {
    const unreachableProvider = new (class extends OllamaAIProvider {
      constructor() {
        super();
        (this as any).baseUrl = "http://127.0.0.1:54321"; // Non-existent port
      }
    })();

    const status = await unreachableProvider.checkHealth();
    expect(status.available).toBe(false);
    expect(status.error).toBeDefined();
    expect(status.error).toContain("unreachable");
  });
});
