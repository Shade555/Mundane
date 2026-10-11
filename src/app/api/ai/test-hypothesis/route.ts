import { NextRequest, NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";
import { z } from "zod";

const TestHypothesisInputSchema = z.object({
  investigationTitle: z.string().min(1),
  centralQuestion: z.string().min(1),
  hypothesisStatement: z.string().min(1),
  observationsSummary: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = TestHypothesisInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const result = await aiProvider.testHypothesis(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("API error testing hypothesis:", err);
    return NextResponse.json(
      {
        error: "Failed to evaluate hypothesis with model",
        message: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
