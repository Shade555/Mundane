"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Compass,
  ArrowRight,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Cpu,
  Layers,
} from "lucide-react";
import { Investigation, AIModelStatus } from "@/lib/types/investigation";
import { storageAdapter } from "../lib/db/storage-adapter";

const CURATED_IDEAS = [
  {
    category: "botany_plants",
    title: "Pavement Fracture Botany",
    prompt: "Why do small plants flourish in one seam of the sidewalk but not in the parallel crack two feet away?",
    difficulty: "moderate",
    time: "15 min",
  },
  {
    category: "moss_lichen_fungi",
    title: "Mortar Joint Cryptogams",
    prompt: "Why does vibrant green moss occupy the lower brick joints of a stone wall while pale powdery lichen colonizes the upper ledge?",
    difficulty: "gentle",
    time: "10 min",
  },
  {
    category: "microclimate_sun_shade",
    title: "Substrate Temperature Gradient",
    prompt: "How does solar orientation affect moisture and tactile warmth between dark asphalt and pale stone pavers?",
    difficulty: "moderate",
    time: "20 min",
  },
  {
    category: "water_traces_rain",
    title: "Splash Erosion & Rain Traces",
    prompt: "What physical soil displacement patterns and silt deposits reveal the direction of recent rain runoff?",
    difficulty: "gentle",
    time: "15 min",
  },
  {
    category: "birds_urban_wildlife",
    title: "Micro-Habitat Foraging Traces",
    prompt: "What marks, seeds, or pecked leaves show where birds or insects forage beneath specific outdoor shrubs?",
    difficulty: "thorough",
    time: "25 min",
  },
];

export default function FieldDeskPage() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [modelStatus, setModelStatus] = useState<AIModelStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const list = await storageAdapter.listInvestigations();
        setInvestigations(list);
      } catch (err) {
        console.error("Failed to load investigations:", err);
      } finally {
        setLoading(false);
      }

      try {
        const res = await fetch("/api/ai/health");
        const status = await res.json();
        setModelStatus(status);
      } catch (err) {
        console.error("Health check failed:", err);
      }
    }

    loadData();
  }, []);

  const completedCount = investigations.filter((i) => i.status === "completed").length;
  const inProgressList = investigations.filter((i) => i.status === "in_progress");

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
      {/* Editorial Hero Section */}
      <section className="space-y-4 border-b border-paper-300 pb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-forest-100 text-forest-700 text-xs font-mono uppercase tracking-wider">
          <span>Hacktoberfest 2026 &bull; Open-Source AI</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-forest tracking-tight">
          The Field Desk
        </h1>
        <p className="text-lg sm:text-xl text-charcoal-600 font-serif italic max-w-2xl leading-relaxed">
          &ldquo;The world is full of things you&rsquo;ve never really noticed.&rdquo;
        </p>
        <p className="text-sm sm:text-base text-stone-600 max-w-3xl leading-normal">
          Mundane is an open-source AI outdoor investigation companion. It turns everyday outdoor observations into small, empirical scientific inquiries. Instead of keeping your eyes glued to a screen, it guides you to notice physical evidence, propose hypotheses, test them with your senses, and return with a deeper understanding of the living world.
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3">
          <Link
            href="/investigate/new"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-md bg-forest text-paper-100 font-medium hover:bg-forest-600 transition-colors shadow-sm"
          >
            <Compass className="w-4 h-4" />
            <span>Begin an Investigation</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <a
            href="#observation-ideas"
            className="inline-flex items-center space-x-2 px-5 py-3 rounded-md bg-paper-200 border border-paper-300 text-charcoal-700 font-medium hover:bg-paper-300 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-botanical-amber" />
            <span>Explore Observation Ideas</span>
          </a>
        </div>
      </section>

      {/* Status & Investigation Summary Bar */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Model Status Card */}
        <div className="paper-card rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" /> AI Inference Engine
            </span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                modelStatus?.available ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            />
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              {modelStatus?.model || "Gemma 12B"}
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              Runtime: {modelStatus?.runtime || "Local Ollama"} ({modelStatus?.inferenceMode || "local"})
            </p>
            {modelStatus?.hasVisionSupport && (
              <span className="inline-block mt-2 text-[11px] font-mono bg-forest-100 text-forest-700 px-2 py-0.5 rounded">
                &check; Vision analysis enabled
              </span>
            )}
          </div>
          <Link
            href="/settings"
            className="text-xs font-mono text-forest-600 hover:text-forest-700 mt-3 inline-block underline"
          >
            Inspect model & prompts &rarr;
          </Link>
        </div>

        {/* Persistence Mode Card */}
        <div className="paper-card rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" /> Storage & Sync
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-paper-300 text-stone-700">
              {storageAdapter.getStorageMode() === "supabase_cloud" ? "Cloud Mode" : "Local-First"}
            </span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              {storageAdapter.getStorageMode() === "supabase_cloud"
                ? "PostgreSQL / Supabase"
                : "Local Storage (Offline)"}
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              {storageAdapter.getStorageMode() === "supabase_cloud"
                ? "Synchronized with Row Level Security."
                : "Stored privately in browser. Zero cloud transmission."}
            </p>
          </div>
          <span className="text-xs font-mono text-stone-500 mt-3">
            {investigations.length} investigation record(s) on file
          </span>
        </div>

        {/* Natural Inquiry Progress Summary (Non-addictive) */}
        <div className="paper-card rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Scientific Records
            </span>
            <span className="text-xs font-mono text-forest font-bold">
              {completedCount} / {investigations.length} Concluded
            </span>
          </div>
          <div>
            <h3 className="font-serif font-bold text-lg text-charcoal-900">
              Naturalist Progress
            </h3>
            <p className="text-xs text-stone-600 mt-1">
              {completedCount === 0
                ? "No completed field inquiries yet. Every observation begins with looking closer."
                : `${completedCount} investigation(s) reasoned through to empirical conclusions.`}
            </p>
          </div>
          <Link
            href="/journal"
            className="text-xs font-mono text-forest-600 hover:text-forest-700 mt-3 inline-block underline"
          >
            Open Field Journal &rarr;
          </Link>
        </div>
      </section>

      {/* Active & Recent Investigations */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest">
            Active & Recent Inquiries
          </h2>
          <Link
            href="/journal"
            className="text-sm font-mono text-forest-600 hover:underline flex items-center gap-1"
          >
            <span>View all in Journal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="paper-card rounded-lg p-8 text-center text-stone-500 font-mono text-sm">
            Loading field records...
          </div>
        ) : investigations.length === 0 ? (
          <div className="paper-card rounded-lg p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-forest-50 text-forest mx-auto flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-charcoal-800">
              Your field journal is empty
            </h3>
            <p className="text-stone-600 text-sm max-w-md mx-auto">
              Step outside or gaze through a window. Find a pattern, a plant in an unexpected seam, or a patch of moss, and begin your first investigation.
            </p>
            <div className="pt-2">
              <Link
                href="/investigate/new"
                className="inline-flex items-center space-x-2 px-4 py-2 rounded bg-forest text-paper-100 text-sm font-medium hover:bg-forest-600 transition-colors"
              >
                <Compass className="w-4 h-4" />
                <span>Start First Investigation</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {investigations.slice(0, 4).map((inv) => (
              <div
                key={inv.id}
                className="paper-card rounded-lg p-5 flex flex-col justify-between hover:border-forest-300 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="capitalize px-2 py-0.5 rounded bg-paper-200 text-stone-700">
                      {inv.category.replace(/_/g, " ")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        inv.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {inv.status === "completed" ? "Concluded" : "In Progress"}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-charcoal-900">
                    {inv.title}
                  </h3>
                  <p className="text-sm text-stone-600 line-clamp-2 italic">
                    &ldquo;{inv.centralQuestion}&rdquo;
                  </p>
                </div>

                <div className="pt-4 border-t border-paper-200 mt-4 flex items-center justify-between text-xs">
                  <span className="text-stone-500 font-mono">
                    {inv.observations.length} observation(s) &bull; {inv.timeEstimateMinutes}m
                  </span>
                  <Link
                    href={`/investigate/${inv.id}`}
                    className="inline-flex items-center gap-1 font-medium text-forest hover:text-forest-700 font-mono"
                  >
                    <span>{inv.status === "completed" ? "Review" : "Resume"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Curated Observation Ideas Section */}
      <section id="observation-ideas" className="space-y-4 pt-4 border-t border-paper-300">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-forest">
            Curated Observation Ideas
          </h2>
          <p className="text-sm text-stone-600">
            Real physical curiosities you can observe right now in almost any outdoor neighborhood or city park:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CURATED_IDEAS.map((idea, idx) => (
            <div
              key={idx}
              className="paper-card rounded-lg p-5 flex flex-col justify-between hover:border-forest-400 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span className="text-botanical-amber uppercase">{idea.category.replace(/_/g, " ")}</span>
                  <span>{idea.time}</span>
                </div>
                <h3 className="font-serif font-bold text-base text-charcoal-900 group-hover:text-forest transition-colors">
                  {idea.title}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {idea.prompt}
                </p>
              </div>

              <div className="pt-4 mt-2">
                <Link
                  href={`/investigate/new?category=${idea.category}&subject=${encodeURIComponent(idea.prompt)}`}
                  className="inline-flex items-center justify-between w-full text-xs font-mono py-1.5 px-3 rounded bg-paper-200 group-hover:bg-forest group-hover:text-paper-100 transition-colors text-charcoal-700"
                >
                  <span>Launch this inquiry</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
