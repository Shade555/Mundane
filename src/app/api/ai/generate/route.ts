import { NextRequest, NextResponse } from "next/server";
import { SetupInvestigationInputSchema } from "@/lib/ai/schemas/investigation";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = SetupInvestigationInputSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const investigation = await aiProvider.generateInvestigation(parsed.data);
    return NextResponse.json(investigation);
  } catch (err) {
    console.error("API error generating investigation:", err);
    return NextResponse.json(
      {
        error: "Failed to generate investigation with model",
        message: (err as Error).message,
      },
      { status: 500 }
    );
  }
}
