"use client";

import { useEffect, useState } from "react";
import {
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Code,
  Terminal,
  ShieldCheck,
  Layers,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import { AIModelStatus } from "@/lib/types/investigation";
import { storageAdapter } from "@/lib/db";
import { MUNDANE_SYSTEM_PROMPT } from "@/lib/ai/prompts/investigation-prompts";

export default function SettingsAndPromptsPage() {
  const [status, setStatus] = useState<AIModelStatus | null>(null);
  const [checking, setChecking] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<"system" | "generate" | "analyze" | "hypotheses">("system");

  const checkHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/ai/health");
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Header */}
      <div className="space-y-2 border-b border-paper-300 pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-stone-500">
          <span>The Field Desk</span>
          <span>&rarr;</span>
          <span className="text-forest font-bold">System Runtime & Prompts</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest">
          Open-Source AI & Configuration
        </h1>
        <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
          Mundane is architected around verified open-weight AI inference using Google Gemma and local Ollama runtimes. Inspect model readiness, hardware endpoints, and prompt templates.
        </p>
      </div>

      {/* Real AI Runtime Card */}
      <div className="paper-card rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-forest" />
            <h2 className="font-serif font-bold text-lg text-charcoal-900">
              Primary Model Runtime
            </h2>
          </div>
          <button
            onClick={checkHealth}
            disabled={checking}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded border border-paper-300 bg-white hover:bg-paper-200 text-xs font-mono disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            <span>{checking ? "Checking..." : "Re-check Health"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3 rounded bg-paper-200 border border-paper-300 space-y-1">
            <span className="text-stone-500 uppercase">Configured Model:</span>
            <div className="font-bold text-sm text-charcoal-900">{status?.model || "Checking..."}</div>
            <div className="text-[11px] text-stone-600">Google Gemma open-weight family</div>
          </div>

          <div className="p-3 rounded bg-paper-200 border border-paper-300 space-y-1">
            <span className="text-stone-500 uppercase">Inference Runtime:</span>
            <div className="font-bold text-sm text-charcoal-900">
              {status?.runtime || "Ollama"} ({status?.inferenceMode || "local"})
            </div>
            <div className="text-[11px] text-stone-600">Endpoint: {status?.endpoint || "http://127.0.0.1:11434"}</div>
          </div>

          <div className="p-3 rounded bg-paper-200 border border-paper-300 space-y-1">
            <span className="text-stone-500 uppercase">Vision Capability:</span>
            <div className="font-bold text-sm text-charcoal-900">
              {status?.hasVisionSupport ? "Verified Enabled" : "Text Only"}
            </div>
            <div className="text-[11px] text-stone-600">Model: {status?.visionModel}</div>
          </div>

          <div className="p-3 rounded bg-paper-200 border border-paper-300 space-y-1">
            <span className="text-stone-500 uppercase">Operational Status:</span>
            <div className="font-bold text-sm flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  status?.available ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              <span className={status?.available ? "text-emerald-800" : "text-amber-800"}>
                {status?.available ? "Active & Ready" : "Runtime Unreachable"}
              </span>
            </div>
            {status?.error && (
              <div className="text-[10px] text-rose-600 mt-1">{status.error}</div>
            )}
          </div>
        </div>

        {/* Model License Notice */}
        <div className="p-3.5 rounded bg-forest-50 border border-forest-200 text-xs text-forest-900 space-y-1">
          <div className="font-bold font-mono">Open-Weight Licensing Transparency:</div>
          <p className="leading-relaxed">
            Gemma is released under the <em>Gemma Terms of Use</em>, an open-weight model license granting worldwide, non-exclusive, royalty-free rights for commercial and research use with responsible AI terms. It operates completely locally on your hardware with zero external telemetry.
          </p>
        </div>
      </div>

      {/* Storage & Persistence Status */}
      <div className="paper-card rounded-lg p-6 space-y-3">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-forest" />
          <h2 className="font-serif font-bold text-lg text-charcoal-900">
            Database & Persistence Layer
          </h2>
        </div>

        <div className="p-3.5 rounded bg-paper-200 border border-paper-300 text-xs space-y-2">
          <div className="flex items-center justify-between font-mono">
            <span className="text-stone-600">Active Storage Adapter:</span>
            <span className="font-bold px-2 py-0.5 rounded bg-paper-100 text-stone-800">
              {storageAdapter.getStorageMode() === "supabase_cloud"
                ? "Supabase PostgreSQL (Cloud Mode)"
                : "Local Storage (Offline First)"}
            </span>
          </div>
          <p className="text-stone-600 leading-relaxed">
            {storageAdapter.getStorageMode() === "supabase_cloud"
              ? "Row Level Security (RLS) is active. User investigations synchronize with your PostgreSQL database."
              : "Operating in verified private offline mode. All investigations, notes, and photos are saved in browser storage. No credentials required."}
          </p>
          <div className="pt-2 text-[11px] font-mono text-stone-500">
            SQL migrations are version-controlled in <code>supabase/migrations/20261011000000_init.sql</code>.
          </div>
        </div>
      </div>

      {/* Prompt Inspector */}
      <div className="paper-card rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code className="w-5 h-5 text-forest" />
            <h2 className="font-serif font-bold text-lg text-charcoal-900">
              Versioned Prompt Inspector
            </h2>
          </div>
          <span className="text-xs font-mono text-stone-500">v1.0.0</span>
        </div>

        <p className="text-xs text-stone-600">
          Inspect the exact instructions governing model reasoning, safety enforcement, and empirical evidence separation:
        </p>

        <div className="flex items-center space-x-2 border-b border-paper-200 pb-2">
          {[
            { id: "system", label: "Mundane System Prompt" },
            { id: "generate", label: "Investigation Builder" },
            { id: "analyze", label: "Observation Analysis" },
            { id: "hypotheses", label: "Hypothesis Testing" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPrompt(tab.id as any)}
              className={`px-3 py-1 rounded text-xs font-mono transition-colors ${
                selectedPrompt === tab.id
                  ? "bg-forest text-paper-100 font-bold"
                  : "text-stone-600 hover:text-charcoal-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 rounded bg-stone-900 text-stone-200 font-mono text-xs overflow-x-auto max-h-72 leading-relaxed">
          {selectedPrompt === "system" && (
            <pre className="whitespace-pre-wrap">{MUNDANE_SYSTEM_PROMPT}</pre>
          )}
          {selectedPrompt === "generate" && (
            <pre className="whitespace-pre-wrap">{`Prompt: buildGenerateInvestigationPrompt(params)
- Enforces strict JSON output adhering to GeneratedInvestigationSchema
- Asks for: title, centralQuestion, whyWorthInvestigating, observablePhenomena, fieldProcedure, initialHypotheses, independentReasoningPrompts, statementOfUncertainty
- Prevents revealing conclusions prematurely.`}</pre>
          )}
          {selectedPrompt === "analyze" && (
            <pre className="whitespace-pre-wrap">{`Prompt: buildAnalyzeObservationPrompt(params)
- Separates 5 critical categories:
  1. directlyVisible: Concrete visual features or physical traces documented
  2. reasonableInterpretations: Sound inferences supported by evidence
  3. alternativeExplanations: Alternative possibilities
  4. undetermined: Chemical, microscopic, or longitudinal factors requiring lab tests
  5. nextObservationRecommendation: Actionable outdoor test`}</pre>
          )}
          {selectedPrompt === "hypotheses" && (
            <pre className="whitespace-pre-wrap">{`Prompt: buildHypothesisTestingPrompt(params)
- Categorizes verdict as:
  'supported' | 'plausible_unverified' | 'inconclusive' | 'contradicted'
- Identifies specific supporting vs contradicting field clues.`}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
