import { NextResponse } from "next/server";
import { aiProvider } from "@/lib/ai/providers/ollama-provider";

export async function GET() {
  const status = await aiProvider.checkHealth();
  return NextResponse.json(status);
}
