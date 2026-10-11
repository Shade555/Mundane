"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  Camera,
  Compass,
  Edit3,
  Save,
  Trash2,
  Share2,
  FileText,
} from "lucide-react";
import { Investigation, ConclusionStatus } from "@/lib/types/investigation";
import { storageAdapter } from "@/lib/db/storage-adapter";

export default function FieldJournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const investigationId = resolvedParams.id;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [reflections, setReflections] = useState("");
  const [savingReflections, setSavingReflections] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await storageAdapter.getInvestigation(investigationId);
      if (data) {
        setInvestigation(data);
        setReflections(data.personalReflections || "");
      }
      setLoading(false);
    }
    load();
  }, [investigationId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-stone-500 font-mono text-sm">
        Opening journal dossier...
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-serif font-bold text-charcoal-800">Dossier not found</h2>
        <Link href="/journal" className="text-xs font-mono text-forest underline">
          &larr; Return to Journal
        </Link>
      </div>
    );
  }

  const handleSaveReflections = async () => {
    setSavingReflections(true);
    try {
      const updated: Investigation = {
        ...investigation,
        personalReflections: reflections.trim(),
        updatedAt: new Date().toISOString(),
      };
      await storageAdapter.saveInvestigation(updated);
      setInvestigation(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingReflections(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Permanently delete this journal entry?")) {
      await storageAdapter.deleteInvestigation(investigation.id);
      router.push("/journal");
    }
  };

  const handleExportMarkdown = () => {
    const md = `# MUNDANE FIELD INVESTIGATION DOSSIER
Title: ${investigation.title}
Date: ${new Date(investigation.createdAt).toLocaleDateString()}
Category: ${investigation.category}
Central Question: ${investigation.centralQuestion}

## Physical Context & Motivation
${investigation.whyWorthInvestigating}

## Recorded Field Observations (${investigation.observations.length})
${investigation.observations
  .map(
    (o, i) =>
      `### Observation ${i + 1} (Step ${o.stepNumber})
- Notes: ${o.notes}
- Confidence: ${o.isUncertain ? "Uncertain / Low Confidence" : "Empirically Verified"}
${
  o.aiAnalysis
    ? `- Visible Clues: ${o.aiAnalysis.directlyVisible.join(", ")}
- Deductions: ${o.aiAnalysis.reasonableInterpretations.join(", ")}
- Alternative Explanations: ${o.aiAnalysis.alternativeExplanations.join(", ")}`
    : ""
}`
  )
  .join("\n\n")}

## Evaluated Hypotheses (${investigation.hypotheses.length})
${investigation.hypotheses
  .map(
    (h) => `### "${h.statement}" [Verdict: ${h.verdict.toUpperCase()}]
- Supporting Evidence: ${h.supportingEvidence || "None documented"}
- Contradicting Evidence: ${h.contradictingEvidence || "None documented"}`
  )
  .join("\n\n")}

## Final Scientific Synthesis
Verdict: ${investigation.conclusionStatus || "Inconclusive"}
Conclusion: ${investigation.conclusion || "Pending further field observation."}

## Inherent Uncertainties
${investigation.remainingUncertainties || "None recorded."}

## Investigator's Personal Reflections
${investigation.personalReflections || "None recorded."}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const renderStatusBadge = (status?: ConclusionStatus) => {
    switch (status) {
      case "supported_by_observations":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Supported by Field Evidence</span>
          </span>
        );
      case "contradicted_by_observations":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 text-rose-900 font-mono text-xs font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-700" />
            <span>Contradicted by Field Evidence</span>
          </span>
        );
      case "plausible_unverified":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-mono text-xs font-bold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
            <span>Plausible but Unverified</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-stone-200 text-stone-800 font-mono text-xs font-bold">
            <HelpCircle className="w-3.5 h-3.5 text-stone-600" />
            <span>Inconclusive Field Data</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-paper-300 pb-4">
        <Link
          href="/journal"
          className="text-xs font-mono text-stone-600 hover:text-stone-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>&larr; Back to Journal Archives</span>
        </Link>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportMarkdown}
            className="px-3 py-1.5 rounded border border-paper-300 bg-white hover:bg-paper-200 text-xs font-mono text-stone-700 flex items-center gap-1.5"
            title="Copy full dossier in Markdown format"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? "Copied Markdown!" : "Export Report"}</span>
          </button>
          <Link
            href={`/investigate/${investigation.id}`}
            className="px-3 py-1.5 rounded bg-forest text-paper-100 text-xs font-mono font-bold hover:bg-forest-600 flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Resume in Field</span>
          </Link>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded border border-paper-300 hover:text-rose-600 text-stone-400"
            title="Delete investigation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Dossier Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-stone-500">
          <span className="capitalize text-botanical-amber font-bold">
            {investigation.category.replace(/_/g, " ")}
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date(investigation.createdAt).toLocaleDateString()}
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {investigation.timeEstimateMinutes} min inquiry
          </span>
          <span>&bull;</span>
          <span className="uppercase">{investigation.difficulty}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest">
          {investigation.title}
        </h1>

        <div className="p-4 rounded-lg bg-paper-200 border-l-4 border-l-forest">
          <span className="text-xs font-mono uppercase text-stone-500 font-bold block mb-1">
            Central Inquiry:
          </span>
          <p className="text-lg font-serif italic text-charcoal-900">
            &ldquo;{investigation.centralQuestion}&rdquo;
          </p>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
          {investigation.whyWorthInvestigating}
        </p>
      </div>

      {/* Scientific Synthesis & Conclusion Card */}
      <div className="paper-card rounded-lg p-6 space-y-4 border-l-4 border-l-forest">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-mono uppercase text-stone-500 font-bold">
            Scientific Synthesis & Conclusion
          </span>
          {renderStatusBadge(investigation.conclusionStatus)}
        </div>

        <p className="text-sm sm:text-base text-charcoal-900 font-serif leading-relaxed">
          {investigation.conclusion || "This investigation is currently in progress. Observations have not yet been synthesized."}
        </p>

        {investigation.remainingUncertainties && (
          <div className="pt-3 border-t border-paper-200 space-y-1">
            <span className="text-xs font-mono font-bold text-stone-500 uppercase">
              Scientific Uncertainty & Experimental Limits:
            </span>
            <p className="text-xs text-stone-600 leading-relaxed">
              {investigation.remainingUncertainties}
            </p>
          </div>
        )}
      </div>

      {/* Field Observations Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest flex items-center justify-between">
          <span>Recorded Field Observations ({investigation.observations.length})</span>
          <span className="text-xs font-mono text-stone-500 font-normal">
            Empirical evidence collected outdoors
          </span>
        </h2>

        {investigation.observations.length === 0 ? (
          <div className="paper-card rounded-lg p-6 text-center text-xs text-stone-500">
            No observations recorded yet. Click &ldquo;Resume in Field&rdquo; to add clues.
          </div>
        ) : (
          <div className="space-y-4">
            {investigation.observations.map((obs, idx) => (
              <div
                key={obs.id}
                className="paper-card rounded-lg p-5 space-y-3 border border-paper-300"
              >
                <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                  <span className="font-bold text-charcoal-800">
                    Observation #{idx + 1} &bull; Step {obs.stepNumber}
                  </span>
                  <span>{new Date(obs.createdAt).toLocaleTimeString()}</span>
                </div>

                <div className="text-xs text-stone-500 italic">
                  Prompt: &ldquo;{obs.prompt}&rdquo;
                </div>

                <p className="text-sm text-charcoal-900 font-medium">{obs.notes}</p>

                {obs.isUncertain && (
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Investigator flagged: Low Confidence / Uncertain
                  </span>
                )}

                {obs.photoBase64 && (
                  <div className="pt-2">
                    <img
                      src={obs.photoBase64}
                      alt={`Clue ${idx + 1}`}
                      className="max-h-48 rounded object-cover border border-paper-300"
                    />
                  </div>
                )}

                {/* Grounded AI Analysis Breakdown */}
                {obs.aiAnalysis && (
                  <div className="mt-3 pt-3 border-t border-paper-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-paper-100 p-3 rounded">
                    <div>
                      <strong className="text-forest font-mono">Direct Evidence:</strong>
                      <ul className="list-disc list-inside text-stone-700 text-[11px] mt-0.5">
                        {obs.aiAnalysis.directlyVisible.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong className="text-botanical-amber font-mono">Deductions:</strong>
                      <ul className="list-disc list-inside text-stone-700 text-[11px] mt-0.5">
                        {obs.aiAnalysis.reasonableInterpretations.map((v, i) => (
                          <li key={i}>{v}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluated Hypotheses Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-serif font-bold text-forest flex items-center justify-between">
          <span>Hypotheses Evaluation Matrix ({investigation.hypotheses.length})</span>
          <span className="text-xs font-mono text-stone-500 font-normal">
            Competing explanations
          </span>
        </h2>

        <div className="space-y-3">
          {investigation.hypotheses.map((h) => (
            <div
              key={h.id}
              className="paper-card rounded-lg p-4 space-y-2 text-xs border border-paper-300"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-stone-500">
                  {h.source === "user" ? "User Proposed" : "AI Suggested"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                    h.verdict === "supported"
                      ? "bg-emerald-100 text-emerald-800"
                      : h.verdict === "contradicted"
                      ? "bg-rose-100 text-rose-800"
                      : h.verdict === "inconclusive"
                      ? "bg-stone-200 text-stone-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {h.verdict.replace(/_/g, " ").toUpperCase()}
                </span>
              </div>

              <p className="font-serif font-bold text-sm text-charcoal-900">
                &ldquo;{h.statement}&rdquo;
              </p>

              {h.supportingEvidence && (
                <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded">
                  <strong>Supporting Clues:</strong> {h.supportingEvidence}
                </div>
              )}

              {h.contradictingEvidence && (
                <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded">
                  <strong>Contradicting Evidence:</strong> {h.contradictingEvidence}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Personal Naturalist Reflections (Editable) */}
      <div className="paper-card rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-charcoal-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-forest" /> Personal Reflections & Notes
          </h2>
          <button
            type="button"
            disabled={savingReflections}
            onClick={handleSaveReflections}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded bg-forest text-paper-100 text-xs font-mono font-bold hover:bg-forest-600 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{savingReflections ? "Saving..." : "Save Reflections"}</span>
          </button>
        </div>

        <p className="text-xs text-stone-600">
          How did this inquiry change how you see this ordinary space? Add personal thoughts, weather conditions, or questions to revisit next season.
        </p>

        <textarea
          rows={4}
          value={reflections}
          onChange={(e) => setReflections(e.target.value)}
          placeholder="Record your personal impressions, seasonal notes, or surprises..."
          className="w-full p-3 rounded-md border border-paper-300 bg-white text-xs sm:text-sm focus:border-forest outline-none"
        />
      </div>
    </div>
  );
}
