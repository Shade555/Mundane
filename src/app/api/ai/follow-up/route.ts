import { NextRequest, NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";
import { z } from "zod";

const FollowUpInputSchema = z.object({
  investigationTitle: z.string().min(1),
  currentStepPrompt: z.string().min(1),
  userQuestion: z.string().min(1),
  collectedObservationsCount: z.number().int().default(0),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = FollowUpInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const answer = await aiProvider.answerFollowUp(parsed.data);
    return NextResponse.json(answer);
  } catch (err) {
    console.error("API error answering follow-up:", err);
    return NextResponse.json(
      {
        error: "Failed to answer follow-up question with model",
        message: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
