import { NextRequest, NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";
import { z } from "zod";

const AnalyzeInputSchema = z.object({
  investigationTitle: z.string().min(1),
  centralQuestion: z.string().min(1),
  observationNotes: z.string().min(1),
  isUncertain: z.boolean().default(false),
  environmentalContext: z.record(z.unknown()).optional(),
  photoBase64: z
    .string()
    .max(15 * 1024 * 1024, "Image must be under 15MB")
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = AnalyzeInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const analysis = await aiProvider.analyzeObservation(parsed.data);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("API error analyzing observation:", err);
    return NextResponse.json(
      {
        error: "Failed to analyze observation with model",
        message: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
