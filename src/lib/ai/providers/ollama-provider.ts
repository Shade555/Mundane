import { AIModelStatus } from "@/lib/types/investigation";
import {
  GeneratedInvestigationSchema,
  GeneratedInvestigation,
  ObservationAnalysisSchema,
  ObservationAnalysisResult,
  HypothesisTestingSchema,
  HypothesisTestingResult,
  FollowUpAnswerSchema,
  FollowUpAnswerResult,
  SetupInvestigationInput,
} from "@/lib/ai/schemas/investigation";
import {
  MUNDANE_SYSTEM_PROMPT,
  buildGenerateInvestigationPrompt,
  buildAnalyzeObservationPrompt,
  buildHypothesisTestingPrompt,
  buildFollowUpPrompt,
} from "@/lib/ai/prompts/investigation-prompts";
import { extractAndParseJSON } from "@/lib/ai/utils/json-extractor";
import { validateOutdoorSafety } from "@/lib/safety/outdoor-safety";

export class OllamaAIProvider {
  private baseUrl: string;
  private defaultModel: string;
  private visionModel: string;
  private isRemote: boolean;
  private remoteApiKey?: string;

  constructor() {
    this.baseUrl =
      process.env.REMOTE_INFERENCE_URL ||
      process.env.OLLAMA_BASE_URL ||
      "http://127.0.0.1:11434";
    this.defaultModel = process.env.OLLAMA_MODEL || "gemma2:2b";
    this.visionModel = process.env.OLLAMA_VISION_MODEL || "gemma4:12b";
    this.isRemote = Boolean(process.env.REMOTE_INFERENCE_URL);
    this.remoteApiKey = process.env.REMOTE_INFERENCE_API_KEY;
  }

  public async checkHealth(): Promise<AIModelStatus> {
    try {
      const headers: Record<string, string> = {};
      if (this.remoteApiKey) {
        headers["Authorization"] = `Bearer ${this.remoteApiKey}`;
      }

      const isOpenAIFormat = this.baseUrl.includes("/v1");
      const healthUrl = isOpenAIFormat
        ? (this.baseUrl.endsWith("/models") ? this.baseUrl : `${this.baseUrl}/models`)
        : `${this.baseUrl}/api/tags`;

      const res = await fetch(healthUrl, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        return {
          available: false,
          runtime: isOpenAIFormat ? "Cloud Gemma Provider" : "Ollama",
          model: this.defaultModel,
          visionModel: this.visionModel,
          hasVisionSupport: false,
          inferenceMode: this.isRemote ? "remote" : "local",
          endpoint: this.baseUrl,
          error: `HTTP error from endpoint: ${res.status} ${res.statusText}`,
        };
      }

      const data = await res.json();
      const modelsList: Array<any> = data.models || data.data || [];
      const foundTarget = modelsList.find((m) => {
        const name = m.name || m.id || "";
        return name === this.defaultModel || name.includes(this.defaultModel.split(":")[0]);
      });

      return {
        available: true,
        runtime: isOpenAIFormat ? "Cloud Open-Weight Gemma" : "Ollama (Open-Weight Runtime)",
        model: foundTarget?.name || foundTarget?.id || this.defaultModel,
        visionModel: this.visionModel,
        hasVisionSupport: true,
        inferenceMode: this.isRemote ? "remote" : "local",
        endpoint: this.baseUrl,
      };
    } catch (err) {
      return {
        available: false,
        runtime: this.baseUrl.includes("/v1") ? "Cloud Gemma Provider" : "Ollama",
        model: this.defaultModel,
        visionModel: this.visionModel,
        hasVisionSupport: false,
        inferenceMode: this.isRemote ? "remote" : "local",
        endpoint: this.baseUrl,
        error: `Inference endpoint is unreachable at ${this.baseUrl}: ${(err as Error).message}`,
      };
    }
  }

  private async callOllama(prompt: string, images?: string[], modelName?: string): Promise<string> {
    const model = modelName || (images && images.length > 0 ? this.visionModel : this.defaultModel);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.remoteApiKey) {
      headers["Authorization"] = `Bearer ${this.remoteApiKey}`;
    }

    const cleanedImages = images?.map((img) => {
      // Strip data:image/...;base64, prefix if present
      const commaIdx = img.indexOf(",");
      return commaIdx !== -1 ? img.slice(commaIdx + 1) : img;
    });

    const isOpenAIFormat = this.baseUrl.includes("/v1");

    if (isOpenAIFormat) {
      const endpoint = this.baseUrl.endsWith("/chat/completions")
        ? this.baseUrl
        : `${this.baseUrl}/chat/completions`;

      const userContent: any = [{ type: "text", text: prompt }];
      if (cleanedImages && cleanedImages.length > 0) {
        for (const img of cleanedImages) {
          userContent.push({
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${img}` },
          });
        }
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: MUNDANE_SYSTEM_PROMPT },
            { role: "user", content: typeof userContent === "string" ? userContent : prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(180000),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Cloud inference failed (${res.status}): ${errText || res.statusText}`);
      }

      const data = await res.json();
      return (data.choices?.[0]?.message?.content as string) || "{}";
    }

    // Native Ollama Endpoint
    const body: Record<string, unknown> = {
      model,
      prompt,
      system: MUNDANE_SYSTEM_PROMPT,
      format: "json",
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.9,
        num_predict: 2048,
      },
    };

    if (cleanedImages && cleanedImages.length > 0) {
      body.images = cleanedImages;
    }

    const res = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180000), // 3 min timeout for larger models on CPU/GPU
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      throw new Error(`Ollama inference failed (${res.status}): ${errText || res.statusText}`);
    }

    const data = await res.json();
    return data.response as string;
  }

  public async generateInvestigation(input: SetupInvestigationInput): Promise<GeneratedInvestigation> {
    const prompt = buildGenerateInvestigationPrompt(input);
    let rawOutput = await this.callOllama(prompt);

    // Schema validation and retry limit = 1
    let parsed: unknown;
    try {
      parsed = extractAndParseJSON(rawOutput);
    } catch (err) {
      // Single retry with explicit correction instruction
      const retryPrompt = `${prompt}\n\nCRITICAL FIX: Your previous response failed to parse as valid JSON (${(err as Error).message}). Return ONLY the raw valid JSON object.`;
      rawOutput = await this.callOllama(retryPrompt);
      parsed = extractAndParseJSON(rawOutput);
    }

    const validated = GeneratedInvestigationSchema.parse(parsed);

    // Apply safety filter
    for (const step of validated.fieldProcedure) {
      const safetyCheck = validateOutdoorSafety(step.instruction);
      if (!safetyCheck.isSafe) {
        validated.safetyConsiderations.push(...safetyCheck.warnings);
      }
    }

    return validated;
  }

  public async analyzeObservation(params: {
    investigationTitle: string;
    centralQuestion: string;
    observationNotes: string;
    isUncertain: boolean;
    environmentalContext?: Record<string, unknown>;
    photoBase64?: string;
  }): Promise<ObservationAnalysisResult> {
    const prompt = buildAnalyzeObservationPrompt({
      investigationTitle: params.investigationTitle,
      centralQuestion: params.centralQuestion,
      observationNotes: params.observationNotes,
      isUncertain: params.isUncertain,
      environmentalContext: params.environmentalContext,
      hasPhoto: Boolean(params.photoBase64),
    });

    const images = params.photoBase64 ? [params.photoBase64] : undefined;
    const rawOutput = await this.callOllama(prompt, images);
    const parsed = extractAndParseJSON(rawOutput);
    return ObservationAnalysisSchema.parse(parsed);
  }

  public async testHypothesis(params: {
    investigationTitle: string;
    centralQuestion: string;
    hypothesisStatement: string;
    observationsSummary: string[];
  }): Promise<HypothesisTestingResult> {
    const prompt = buildHypothesisTestingPrompt(params);
    const rawOutput = await this.callOllama(prompt);
    const parsed = extractAndParseJSON(rawOutput);
    return HypothesisTestingSchema.parse(parsed);
  }

  public async answerFollowUp(params: {
    investigationTitle: string;
    currentStepPrompt: string;
    userQuestion: string;
    collectedObservationsCount: number;
  }): Promise<FollowUpAnswerResult> {
    const prompt = buildFollowUpPrompt(params);
    const rawOutput = await this.callOllama(prompt);
    const parsed = extractAndParseJSON(rawOutput);
    return FollowUpAnswerSchema.parse(parsed);
  }
}

export const aiProvider = new OllamaAIProvider();
