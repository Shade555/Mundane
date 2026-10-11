"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Loader2,
  Bookmark,
  Sun,
  ShieldAlert,
  Sparkles,
  Search,
  Check,
  X,
  Eye,
  FileCheck2,
} from "lucide-react";
import {
  Investigation,
  FieldObservation,
  Hypothesis,
  ObservationAnalysis,
} from "@/lib/types/investigation";
import { storageAdapter } from "@/lib/db/storage-adapter";

export default function FieldInvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const investigationId = resolvedParams.id;

  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Field Note Input State
  const [notes, setNotes] = useState("");
  const [isUncertain, setIsUncertain] = useState(false);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzingObservation, setAnalyzingObservation] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ObservationAnalysis | null>(null);

  // Ask AI Follow-up State
  const [askQuestion, setAskQuestion] = useState("");
  const [askingAi, setAskingAi] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; guidedObservationCue: string } | null>(null);

  // User proposed hypothesis
  const [customHypothesis, setCustomHypothesis] = useState("");

  // Continue Outdoors (Distraction-Free) State
  const [outdoorsFocused, setOutdoorsFocused] = useState(false);

  // Synthesize & Conclude State
  const [synthesizing, setSynthesizing] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await storageAdapter.getInvestigation(investigationId);
      if (data) {
        setInvestigation(data);
      }
      setLoading(false);
    }
    load();
  }, [investigationId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-stone-500 font-mono text-sm">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-forest" />
        Opening field investigation dossier...
      </div>
    );
  }

  if (!investigation) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-stone-400 mx-auto" />
        <h2 className="text-xl font-serif font-bold text-charcoal-800">Investigation not found</h2>
        <button
          onClick={() => router.push("/")}
          className="text-xs font-mono text-forest underline"
        >
          &larr; Return to Field Desk
        </button>
      </div>
    );
  }

  const currentStep = investigation.fieldProcedure[currentStepIdx] || investigation.fieldProcedure[0];
  const observationsForCurrentStep = investigation.observations.filter(
    (o) => o.stepNumber === currentStep?.step
  );

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRecordObservation = async () => {
    if (!notes.trim() && !photoBase64) return;

    setAnalyzingObservation(true);
    try {
      // Call real AI observation analysis endpoint
      const res = await fetch("/api/ai/analyze-observation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationTitle: investigation.title,
          centralQuestion: investigation.centralQuestion,
          observationNotes: notes.trim(),
          isUncertain,
          environmentalContext: {},
          photoBase64: photoBase64 || undefined,
        }),
      });

      let analysis: ObservationAnalysis | undefined;
      if (res.ok) {
        analysis = await res.json();
        setAnalysisResult(analysis || null);
      }

      const newObs: FieldObservation = {
        id: "obs_" + Math.random().toString(36).substring(2, 9),
        investigationId: investigation.id,
        stepNumber: currentStep.step,
        prompt: currentStep.instruction,
        notes: notes.trim(),
        isUncertain,
        environmentalContext: {},
        photoBase64: photoBase64 || undefined,
        aiAnalysis: analysis,
        createdAt: new Date().toISOString(),
      };

      const updated = await storageAdapter.addObservation(investigation.id, newObs);
      setInvestigation({ ...updated });
      setNotes("");
      setPhotoBase64(null);
      setIsUncertain(false);
    } catch (err) {
      console.error("Error analyzing observation:", err);
    } finally {
      setAnalyzingObservation(false);
    }
  };

  const handleAddUserHypothesis = async () => {
    if (!customHypothesis.trim()) return;
    const newHyp: Hypothesis = {
      id: "hyp_" + Math.random().toString(36).substring(2, 9),
      investigationId: investigation.id,
      statement: customHypothesis.trim(),
      source: "user",
      verdict: "pending",
      supportingEvidence: "",
      contradictingEvidence: "",
      createdAt: new Date().toISOString(),
    };
    const updated = await storageAdapter.updateHypothesis(investigation.id, newHyp);
    setInvestigation({ ...updated });
    setCustomHypothesis("");
  };

  const handleEvaluateHypothesis = async (hypothesis: Hypothesis) => {
    const obsNotes = investigation.observations.map((o) => o.notes).filter(Boolean);
    if (obsNotes.length === 0) {
      alert("Please record at least one observation before evaluating this hypothesis.");
      return;
    }

    try {
      const res = await fetch("/api/ai/test-hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationTitle: investigation.title,
          centralQuestion: investigation.centralQuestion,
          hypothesisStatement: hypothesis.statement,
          observationsSummary: obsNotes,
        }),
      });

      if (res.ok) {
        const evalResult = await res.json();
        const updatedHyp: Hypothesis = {
          ...hypothesis,
          verdict: evalResult.verdict,
          supportingEvidence: evalResult.supportingEvidence,
          contradictingEvidence: evalResult.contradictingEvidence,
        };
        const updated = await storageAdapter.updateHypothesis(investigation.id, updatedHyp);
        setInvestigation({ ...updated });
      }
    } catch (err) {
      console.error("Failed to test hypothesis:", err);
    }
  };

  const handleAskAi = async () => {
    if (!askQuestion.trim()) return;
    setAskingAi(true);
    try {
      const res = await fetch("/api/ai/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationTitle: investigation.title,
          currentStepPrompt: currentStep.instruction,
          userQuestion: askQuestion.trim(),
          collectedObservationsCount: investigation.observations.length,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiAnswer(data);
      }
    } catch (err) {
      console.error("Failed to ask follow-up:", err);
    } finally {
      setAskingAi(false);
    }
  };

  const handleConcludeInvestigation = async () => {
    if (investigation.observations.length === 0) {
      alert("Record at least one field observation before concluding the investigation.");
      return;
    }

    setSynthesizing(true);
    try {
      const res = await fetch("/api/ai/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investigationTitle: investigation.title,
          centralQuestion: investigation.centralQuestion,
          observations: investigation.observations,
          hypotheses: investigation.hypotheses,
        }),
      });

      if (!res.ok) throw new Error("Synthesis failed");
      const result = await res.json();

      const completedInv: Investigation = {
        ...investigation,
        status: "completed",
        conclusion: result.conclusion,
        conclusionStatus: result.conclusionStatus,
        remainingUncertainties: result.remainingUncertainties,
        updatedAt: new Date().toISOString(),
      };

      await storageAdapter.saveInvestigation(completedInv);
      router.push(`/journal/${investigation.id}`);
    } catch (err) {
      console.error("Failed to synthesize:", err);
      alert("Error synthesizing investigation: " + (err as Error).message);
      setSynthesizing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Continue Outdoors / Distraction-Free Header Toggle */}
      <div className="flex items-center justify-between border-b border-paper-300 pb-4">
        <button
          onClick={() => router.push("/")}
          className="text-xs font-mono text-stone-600 hover:text-stone-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Desk (Auto-saved)</span>
        </button>

        <button
          onClick={() => setOutdoorsFocused(!outdoorsFocused)}
          className={`px-3 py-1.5 rounded-full text-xs font-mono border transition-colors flex items-center gap-1.5 ${
            outdoorsFocused
              ? "bg-forest text-paper-100 border-forest font-bold"
              : "bg-paper-200 text-charcoal-700 border-paper-300 hover:bg-paper-300"
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>{outdoorsFocused ? "Exit Sunlight Focus" : "Continue Outdoors Mode"}</span>
        </button>
      </div>

      {/* OUTDOORS FOCUSED VIEW: High Contrast, Minimal UI */}
      {outdoorsFocused ? (
        <div className="outdoor-card p-6 sm:p-10 rounded-xl border border-stone-700 space-y-6 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-emerald-400">
            Step {currentStep.step} of {investigation.fieldProcedure.length} &bull; Outdoors Active
          </div>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-white leading-tight">
            &ldquo;{currentStep.instruction}&rdquo;
          </h2>
          <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto italic">
            Rationale: {currentStep.rationale}
          </p>

          <div className="pt-6 border-t border-stone-800 flex items-center justify-center gap-4">
            <button
              onClick={() => setOutdoorsFocused(false)}
              className="px-6 py-3 rounded-md bg-emerald-600 text-white font-medium hover:bg-emerald-500 font-mono text-sm"
            >
              Ready to Record Clues &rarr;
            </button>
          </div>
          <p className="text-xs text-stone-400 font-mono">
            Put your phone away and inspect the physical world for 3-5 minutes.
          </p>
        </div>
      ) : (
        /* STANDARD INVESTIGATION WORKFLOW */
        <>
          {/* Investigation Overview Header */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-xs font-mono uppercase text-botanical-amber">
              <span>Investigation #{investigation.id.slice(-6)}</span>
              <span>&bull;</span>
              <span>{investigation.category.replace(/_/g, " ")}</span>
              <span>&bull;</span>
              <span>{investigation.difficulty}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-serif font-bold text-forest">
              {investigation.title}
            </h1>
            <p className="text-base sm:text-lg text-charcoal-800 font-serif italic border-l-2 border-forest pl-3">
              &ldquo;{investigation.centralQuestion}&rdquo;
            </p>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {investigation.whyWorthInvestigating}
            </p>
          </div>

          {/* Observable Clues Drawer */}
          <div className="paper-card rounded-lg p-4 space-y-2 text-xs">
            <span className="font-mono uppercase font-bold text-stone-500 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-forest" /> Observable Features to Inspect:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {investigation.observablePhenomena.map((p) => (
                <div key={p.id} className="p-2.5 rounded bg-paper-200 border border-paper-300">
                  <div className="font-bold text-charcoal-900">{p.target}</div>
                  <div className="text-stone-600 mt-0.5">{p.guidance}</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.clues.map((c, i) => (
                      <span key={i} className="px-1.5 py-0.2 rounded bg-paper-100 text-[10px] text-stone-600 font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Safety Warning Reminder */}
          {investigation.safetyConsiderations.length > 0 && (
            <div className="p-3 rounded-md bg-paper-200/80 border border-paper-300 text-xs text-stone-700 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold font-mono">Field Safety Precautions:</span>
                <span className="ml-1.5">{investigation.safetyConsiderations.join(" &bull; ")}</span>
              </div>
            </div>
          )}

          {/* Step Sequence Navigator */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-stone-500 uppercase tracking-wider">
                Field Procedure: Step {currentStep.step} of {investigation.fieldProcedure.length}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={currentStepIdx === 0}
                  onClick={() => setCurrentStepIdx(currentStepIdx - 1)}
                  className="px-2.5 py-1 rounded border border-paper-300 text-xs font-mono disabled:opacity-30 hover:bg-paper-200"
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  disabled={currentStepIdx === investigation.fieldProcedure.length - 1}
                  onClick={() => setCurrentStepIdx(currentStepIdx + 1)}
                  className="px-2.5 py-1 rounded border border-paper-300 text-xs font-mono disabled:opacity-30 hover:bg-paper-200"
                >
                  Next &rarr;
                </button>
              </div>
            </div>

            {/* Current Step Card */}
            <div className="paper-card rounded-lg p-5 border-l-4 border-l-forest space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-stone-500">
                <span>ESTIMATED TIME: ~{currentStep.estimatedMinutes} MIN</span>
                <span>STEP #{currentStep.step}</span>
              </div>
              <h3 className="font-serif font-bold text-lg text-charcoal-900">
                {currentStep.instruction}
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 italic">
                Scientific Rationale: {currentStep.rationale}
              </p>
            </div>
          </div>

          {/* Record Observation Form */}
          <div className="paper-card rounded-lg p-5 space-y-4">
            <h4 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
              <Compass className="w-4 h-4 text-forest" /> Record Your Field Observation
            </h4>

            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What do you see, feel, or notice under this step? (e.g. Mortar feels damp to touch; moss color is darker toward the ground; no seedlings in the upper crack)."
              className="w-full p-3 rounded-md border border-paper-300 bg-white text-xs sm:text-sm focus:border-forest outline-none"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Photo Attachment & Uncertainty */}
              <div className="flex items-center space-x-4 text-xs">
                <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded border border-paper-300 bg-white hover:bg-paper-200 text-stone-700">
                  <Camera className="w-3.5 h-3.5 text-forest" />
                  <span>{photoBase64 ? "Photo Attached" : "Attach Photo"}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>

                {photoBase64 && (
                  <button
                    type="button"
                    onClick={() => setPhotoBase64(null)}
                    className="text-stone-500 hover:text-red-600"
                    title="Remove attached photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                <label className="inline-flex items-center space-x-1.5 cursor-pointer text-stone-600">
                  <input
                    type="checkbox"
                    checked={isUncertain}
                    onChange={(e) => setIsUncertain(e.target.checked)}
                    className="rounded border-paper-300 text-forest focus:ring-0"
                  />
                  <span>Mark as uncertain</span>
                </label>
              </div>

              {/* Submit Observation Button */}
              <button
                type="button"
                disabled={analyzingObservation || (!notes.trim() && !photoBase64)}
                onClick={handleRecordObservation}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded bg-forest text-paper-100 text-xs font-mono font-bold hover:bg-forest-600 disabled:opacity-40 transition-colors shadow-sm"
              >
                {analyzingObservation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing Clues...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Clue & Analyze</span>
                  </>
                )}
              </button>
            </div>

            {photoBase64 && (
              <div className="pt-2">
                <img
                  src={photoBase64}
                  alt="Attached clue"
                  className="max-h-36 rounded border border-paper-300 object-cover"
                />
              </div>
            )}
          </div>

          {/* SCREEN 4: AI Observation Analysis (Separation of Clues) */}
          {analysisResult && (
            <div className="paper-card rounded-lg p-5 border-l-4 border-l-emerald-600 space-y-4 bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" /> Grounded Clue Analysis (Screen 4)
                </span>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* 1. Directly Visible */}
                <div className="p-3 rounded bg-white border border-paper-300 space-y-1">
                  <span className="font-mono font-bold text-forest">1. Directly Observable Evidence:</span>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                    {analysisResult.directlyVisible.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>

                {/* 2. Reasonable Interpretations */}
                <div className="p-3 rounded bg-white border border-paper-300 space-y-1">
                  <span className="font-mono font-bold text-forest">2. Reasonable Deductions:</span>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                    {analysisResult.reasonableInterpretations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>

                {/* 3. Alternative Explanations */}
                <div className="p-3 rounded bg-white border border-paper-300 space-y-1">
                  <span className="font-mono font-bold text-botanical-amber">3. Alternative Explanations:</span>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                    {analysisResult.alternativeExplanations.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>

                {/* 4. Undetermined */}
                <div className="p-3 rounded bg-white border border-paper-300 space-y-1">
                  <span className="font-mono font-bold text-stone-600">4. Cannot Be Proven Here:</span>
                  <ul className="list-disc list-inside text-stone-700 space-y-0.5">
                    {analysisResult.undetermined.map((v, i) => (
                      <li key={i}>{v}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. Recommended Next Step */}
              <div className="p-3 rounded bg-emerald-100/50 border border-emerald-200 text-xs text-emerald-900">
                <span className="font-mono font-bold">Recommended Next Outdoor Observation: </span>
                <span>{analysisResult.nextObservationRecommendation}</span>
              </div>
            </div>
          )}

          {/* Observations Recorded for this Step */}
          {observationsForCurrentStep.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-xs font-mono uppercase text-stone-500 font-bold">
                Clues Recorded for Step {currentStep.step} ({observationsForCurrentStep.length})
              </h5>
              <div className="space-y-2">
                {observationsForCurrentStep.map((obs) => (
                  <div key={obs.id} className="p-3 rounded border border-paper-300 bg-white text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                      <span>{new Date(obs.createdAt).toLocaleTimeString()}</span>
                      {obs.isUncertain && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                          Low Confidence / Uncertain
                        </span>
                      )}
                    </div>
                    <p className="text-charcoal-900">{obs.notes}</p>
                    {obs.photoBase64 && (
                      <img src={obs.photoBase64} alt="Clue" className="max-h-24 rounded object-cover" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ask AI Follow-up Question Drawer */}
          <div className="paper-card rounded-lg p-5 space-y-3">
            <h4 className="font-serif font-bold text-base text-charcoal-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-forest" /> Ask Field AI a Contextual Question
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={askQuestion}
                onChange={(e) => setAskQuestion(e.target.value)}
                placeholder="e.g. Could the angle of the sunlight alone account for the difference in moss height?"
                className="flex-1 p-2.5 rounded border border-paper-300 bg-white text-xs outline-none focus:border-forest"
              />
              <button
                type="button"
                disabled={askingAi || !askQuestion.trim()}
                onClick={handleAskAi}
                className="px-4 py-2 rounded bg-paper-300 text-charcoal-800 text-xs font-mono font-bold hover:bg-paper-400 disabled:opacity-40"
              >
                {askingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ask"}
              </button>
            </div>

            {aiAnswer && (
              <div className="p-3 rounded bg-forest-50 border border-forest-200 text-xs space-y-1.5 text-forest-900">
                <p><strong>Field Guidance:</strong> {aiAnswer.answer}</p>
                <p className="italic text-forest-800">
                  <strong>Look closely:</strong> {aiAnswer.guidedObservationCue}
                </p>
              </div>
            )}
          </div>

          {/* SCREEN 5: Scientific Hypothesis Matrix */}
          <div className="paper-card rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-serif font-bold text-base text-charcoal-900">
                  Competing Hypotheses (Screen 5)
                </h4>
                <p className="text-xs text-stone-600">
                  Compare explanations against your recorded field clues. Evaluate supported vs contradicted hypotheses.
                </p>
              </div>
            </div>

            {/* Hypotheses List */}
            <div className="space-y-3">
              {investigation.hypotheses.map((hyp) => (
                <div
                  key={hyp.id}
                  className="p-3.5 rounded-lg border border-paper-300 bg-white space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] uppercase text-stone-500">
                      {hyp.source === "user" ? "Investigator Proposed" : "AI Suggested"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                        hyp.verdict === "supported"
                          ? "bg-emerald-100 text-emerald-800"
                          : hyp.verdict === "contradicted"
                          ? "bg-rose-100 text-rose-800"
                          : hyp.verdict === "inconclusive"
                          ? "bg-stone-200 text-stone-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {hyp.verdict.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </div>

                  <p className="font-serif font-bold text-sm text-charcoal-900">
                    &ldquo;{hyp.statement}&rdquo;
                  </p>

                  {hyp.supportingEvidence && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded">
                      <strong>Supporting Clues:</strong> {hyp.supportingEvidence}
                    </div>
                  )}

                  {hyp.contradictingEvidence && (
                    <div className="text-[11px] text-rose-800 bg-rose-50 p-2 rounded">
                      <strong>Contradicting Evidence:</strong> {hyp.contradictingEvidence}
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => handleEvaluateHypothesis(hyp)}
                      className="text-[11px] font-mono text-forest hover:text-forest-700 underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Evaluate against field clues</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Hypothesis */}
            <div className="flex gap-2 pt-2 border-t border-paper-200">
              <input
                type="text"
                value={customHypothesis}
                onChange={(e) => setCustomHypothesis(e.target.value)}
                placeholder="Propose your own alternative hypothesis..."
                className="flex-1 p-2 rounded border border-paper-300 bg-white text-xs outline-none focus:border-forest"
              />
              <button
                type="button"
                disabled={!customHypothesis.trim()}
                onClick={handleAddUserHypothesis}
                className="px-3 py-2 rounded bg-paper-200 text-charcoal-800 text-xs font-mono font-bold hover:bg-paper-300 disabled:opacity-40"
              >
                Add Hypothesis
              </button>
            </div>
          </div>

          {/* Conclude & Synthesize Investigation Button */}
          <div className="pt-4 border-t border-paper-300 flex items-center justify-between">
            <span className="text-xs font-mono text-stone-500">
              {investigation.observations.length} observation(s) recorded in total
            </span>

            <button
              type="button"
              disabled={synthesizing || investigation.observations.length === 0}
              onClick={handleConcludeInvestigation}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded bg-forest text-paper-100 font-serif font-bold text-sm hover:bg-forest-600 disabled:opacity-40 transition-colors shadow-sm"
            >
              {synthesizing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Findings via Mastra...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Conclude & Archive to Journal</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
