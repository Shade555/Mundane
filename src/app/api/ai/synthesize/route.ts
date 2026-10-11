import { NextRequest, NextResponse } from "next/server";
import { fieldCoordinator } from "@/lib/ai/mastra/agent";
import { z } from "zod";

const SynthesizeInputSchema = z.object({
  investigationTitle: z.string().min(1),
  centralQuestion: z.string().min(1),
  observations: z.array(
    z.object({
      id: z.string(),
      investigationId: z.string(),
      stepNumber: z.number(),
      prompt: z.string(),
      notes: z.string(),
      isUncertain: z.boolean(),
      environmentalContext: z.record(z.unknown()),
      createdAt: z.string(),
    })
  ),
  hypotheses: z.array(
    z.object({
      id: z.string(),
      investigationId: z.string(),
      statement: z.string(),
      source: z.enum(["user", "ai"]),
      verdict: z.enum(["pending", "supported", "plausible_unverified", "inconclusive", "contradicted"]),
      supportingEvidence: z.string(),
      contradictingEvidence: z.string(),
      createdAt: z.string(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = SynthesizeInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const synthesis = await fieldCoordinator.synthesizeInvestigation(parsed.data as any);
    return NextResponse.json(synthesis);
  } catch (err) {
    console.error("API error synthesizing investigation:", err);
    return NextResponse.json(
      {
        error: "Failed to synthesize investigation with agent",
        message: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
