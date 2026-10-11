import { describe, it, expect } from "vitest";
import { extractAndParseJSON } from "@/lib/ai/utils/json-extractor";

describe("JSON Extractor", () => {
  it("parses clean JSON objects", () => {
    const raw = '{"title": "Pavement Botany", "timeEstimateMinutes": 15}';
    const parsed = extractAndParseJSON<{ title: string; timeEstimateMinutes: number }>(raw);
    expect(parsed.title).toBe("Pavement Botany");
    expect(parsed.timeEstimateMinutes).toBe(15);
  });

  it("extracts JSON enclosed within markdown code fences", () => {
    const raw = '```json\n{"title": "Moss on Stone", "observations": ["green patch"]}\n```';
    const parsed = extractAndParseJSON<{ title: string; observations: string[] }>(raw);
    expect(parsed.title).toBe("Moss on Stone");
    expect(parsed.observations).toEqual(["green patch"]);
  });

  it("extracts JSON surrounded by thinking or conversational preface", () => {
    const raw = `Here is the requested investigation in JSON format:
{
  "centralQuestion": "Why does clover dominate the shaded lawn border?",
  "difficulty": "moderate"
}
Let me know if you would like to adjust the difficulty.`;

    const parsed = extractAndParseJSON<{ centralQuestion: string; difficulty: string }>(raw);
    expect(parsed.centralQuestion).toContain("Why does clover dominate");
    expect(parsed.difficulty).toBe("moderate");
  });

  it("throws a descriptive error when no valid JSON is present", () => {
    const raw = "I am an AI and I cannot generate this response.";
    expect(() => extractAndParseJSON(raw)).toThrowError(/No JSON object structure found/);
  });
});
