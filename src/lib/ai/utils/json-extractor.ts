/**
 * Robust JSON extraction utility for LLM outputs
 * Handles markdown code fences, leading/trailing thinking tokens, or explanatory text.
 */
export function extractAndParseJSON<T = unknown>(rawOutput: string): T {
  if (!rawOutput || typeof rawOutput !== "string") {
    throw new Error("Empty model response received");
  }

  // 1. Strip markdown codeblocks if present
  let cleaned = rawOutput.trim();
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 2. Try direct JSON.parse
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // 3. Fallback: Search for outermost curly braces { ... }
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const candidate = cleaned.slice(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(candidate) as T;
      } catch (err) {
        throw new Error(`Failed to parse extracted JSON from model output: ${(err as Error).message}\nRaw: ${rawOutput.slice(0, 300)}...`);
      }
    }
    throw new Error(`No JSON object structure found in model output: ${rawOutput.slice(0, 200)}...`);
  }
}
