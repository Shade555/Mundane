"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  Sparkles,
  Camera,
  Sun,
  CloudRain,
  Wind,
  Layers,
  Thermometer,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { InvestigationCategory, DifficultyLevel, EnvironmentalContext, Investigation } from "@/lib/types/investigation";
import { storageAdapter } from "@/lib/db";

const CATEGORIES: Array<{ id: InvestigationCategory; label: string; icon: string }> = [
  { id: "botany_plants", label: "Botany & Wild Flora", icon: "🌱" },
  { id: "moss_lichen_fungi", label: "Moss, Lichen & Fungi", icon: "🍄" },
  { id: "microclimate_sun_shade", label: "Microclimate & Solar Gradients", icon: "☀️" },
  { id: "soil_geology_erosion", label: "Soil, Masonry & Substrate", icon: "🪨" },
  { id: "water_traces_rain", label: "Water Traces & Runoff", icon: "💧" },
  { id: "birds_urban_wildlife", label: "Birds & Wildlife Traces", icon: "🐦" },
  { id: "human_nature_interaction", label: "Human & Nature Seams", icon: "🌿" },
  { id: "general_nature", label: "General Field Inquiry", icon: "🧭" },
];

function NewInvestigationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [category, setCategory] = useState<InvestigationCategory>(
    (searchParams.get("category") as InvestigationCategory) || "botany_plants"
  );
  const [subject, setSubject] = useState<string>(searchParams.get("subject") || "");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("moderate");
  const [environmentalContext, setEnvironmentalContext] = useState<EnvironmentalContext>({
    sunlight: "filtered_light",
    surface: "concrete",
    recentRain: false,
    wind: "still",
    temperatureBand: "mild",
  });
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s = searchParams.get("subject");
    if (s) setSubject(s);
    const c = searchParams.get("category");
    if (c) setCategory(c as InvestigationCategory);
  }, [searchParams]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be under 10MB.");
      return;
    }

    setError(null);
    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoBase64(null);
    setPhotoName(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError("Please provide a brief description of what you noticed or wish to investigate.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          environmentalContext,
          difficulty,
          photoBase64: photoBase64 || undefined,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || errJson.error || `Generation failed (${response.status})`);
      }

      const generated = await response.json();

      // Build complete investigation domain object
      const investigationId = "inv_" + Math.random().toString(36).substring(2, 10);
      const newInvestigation: Investigation = {
        id: investigationId,
        title: generated.title,
        centralQuestion: generated.centralQuestion,
        category,
        whyWorthInvestigating: generated.whyWorthInvestigating,
        observablePhenomena: generated.observablePhenomena,
        fieldProcedure: generated.fieldProcedure,
        timeEstimateMinutes: generated.timeEstimateMinutes,
        difficulty,
        safetyConsiderations: generated.safetyConsiderations,
        status: "in_progress",
        hypotheses: generated.initialHypotheses.map((h: string, idx: number) => ({
          id: `hyp_${idx + 1}`,
          investigationId,
          statement: h,
          source: "ai",
          verdict: "pending",
          supportingEvidence: "",
          contradictingEvidence: "",
          createdAt: new Date().toISOString(),
        })),
        observations: [],
        remainingUncertainties: generated.statementOfUncertainty,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await storageAdapter.saveInvestigation(newInvestigation);
      router.push(`/investigate/${investigationId}`);
    } catch (err) {
      console.error("Submission failed:", err);
      setError((err as Error).message || "An unexpected error occurred during generation.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
      {/* Header */}
      <div className="space-y-2 border-b border-paper-300 pb-6">
        <div className="flex items-center space-x-2 text-xs font-mono uppercase text-stone-500">
          <span>Field Desk</span>
          <span>&rarr;</span>
          <span className="text-forest font-bold">Investigation Setup</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest">
          Begin an Outdoor Investigation
        </h1>
        <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
          Provide an initial curiosity or observation. The open-weight model will construct a safe, empirical field investigation tailored to what you noticed.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
          <div className="space-y-1">
            <span className="font-bold">Inference or Setup Notice:</span>
            <p className="text-xs leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Category */}
        <div className="space-y-3">
          <label className="block text-sm font-serif font-bold text-charcoal-900">
            1. Select Natural Focus / Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`p-3 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  category === cat.id
                    ? "bg-forest-50 border-forest text-forest-900 shadow-sm ring-1 ring-forest"
                    : "bg-paper-100 border-paper-300 text-stone-700 hover:border-paper-400"
                }`}
              >
                <span className="text-xl mb-1">{cat.icon}</span>
                <span className="text-xs font-medium leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: What caught your attention */}
        <div className="space-y-3">
          <label htmlFor="subject" className="block text-sm font-serif font-bold text-charcoal-900">
            2. What did you notice? (Central Observation or Curiosity)
          </label>
          <textarea
            id="subject"
            rows={3}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Why is dark green moss thriving on the brick mortar but completely absent on the concrete curb two feet away?"
            className="w-full p-3.5 rounded-lg border border-paper-300 bg-white text-charcoal-900 text-sm focus:border-forest focus:ring-1 focus:ring-forest outline-none transition-colors"
          />
          <p className="text-xs text-stone-500">
            Be as specific as you like about visible contrast, location, or patterns. No GPS coordinates needed.
          </p>
        </div>

        {/* Step 3: Optional Photo Attachment */}
        <div className="space-y-3">
          <label className="block text-sm font-serif font-bold text-charcoal-900">
            3. Photograph (Optional Field Evidence)
          </label>
          {photoBase64 ? (
            <div className="relative inline-block border border-paper-300 rounded-lg overflow-hidden bg-white p-2">
              <img
                src={photoBase64}
                alt="Field preview"
                className="max-h-48 max-w-full rounded object-cover"
              />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-3 right-3 bg-charcoal-900/80 text-white p-1 rounded-full hover:bg-charcoal-900"
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
              <p className="text-[11px] font-mono text-stone-500 mt-1 truncate max-w-xs">{photoName}</p>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2.5 rounded-md border border-paper-300 bg-white hover:bg-paper-200 text-stone-700 text-sm transition-colors">
                <Camera className="w-4 h-4 text-forest" />
                <span>Upload or Capture Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-stone-500">
                Gemma vision model will inspect physical details directly.
              </span>
            </div>
          )}
        </div>

        {/* Step 4: Environmental Context */}
        <div className="space-y-3 paper-card rounded-lg p-5">
          <label className="block text-sm font-serif font-bold text-charcoal-900">
            4. Environmental Setting (Optional Micro-climate context)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            {/* Sunlight */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-stone-600 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-600" /> Sunlight Exposure
              </span>
              <select
                value={environmentalContext.sunlight}
                onChange={(e) =>
                  setEnvironmentalContext({
                    ...environmentalContext,
                    sunlight: e.target.value as any,
                  })
                }
                className="w-full text-xs p-2 rounded border border-paper-300 bg-white"
              >
                <option value="direct_sun">Direct Sun</option>
                <option value="filtered_light">Filtered Light</option>
                <option value="deep_shade">Deep Shade</option>
                <option value="overcast">Overcast / Diffuse</option>
              </select>
            </div>

            {/* Surface */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-stone-600 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-stone-600" /> Surface / Substrate
              </span>
              <select
                value={environmentalContext.surface}
                onChange={(e) =>
                  setEnvironmentalContext({
                    ...environmentalContext,
                    surface: e.target.value as any,
                  })
                }
                className="w-full text-xs p-2 rounded border border-paper-300 bg-white"
              >
                <option value="concrete">Concrete / Pavement</option>
                <option value="brick_stone">Brick / Masonry</option>
                <option value="soil">Exposed Soil</option>
                <option value="bark">Tree Bark</option>
                <option value="sand_gravel">Sand / Gravel</option>
                <option value="water_edge">Water Edge</option>
                <option value="other">Other Outdoor Surface</option>
              </select>
            </div>

            {/* Rain */}
            <div className="space-y-1.5">
              <span className="text-xs font-mono text-stone-600 flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-600" /> Recent Precipitation
              </span>
              <div className="flex items-center space-x-4 pt-1">
                <label className="inline-flex items-center space-x-1.5 text-xs">
                  <input
                    type="radio"
                    name="recentRain"
                    checked={environmentalContext.recentRain === true}
                    onChange={() =>
                      setEnvironmentalContext({
                        ...environmentalContext,
                        recentRain: true,
                      })
                    }
                  />
                  <span>Rained recently</span>
                </label>
                <label className="inline-flex items-center space-x-1.5 text-xs">
                  <input
                    type="radio"
                    name="recentRain"
                    checked={environmentalContext.recentRain === false}
                    onChange={() =>
                      setEnvironmentalContext({
                        ...environmentalContext,
                        recentRain: false,
                      })
                    }
                  />
                  <span>Dry ground</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Step 5: Difficulty / Time Depth */}
        <div className="space-y-2">
          <label className="block text-sm font-serif font-bold text-charcoal-900">
            5. Field Investigation Depth
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "gentle", label: "Gentle", desc: "10-15 min, 2-3 steps" },
              { id: "moderate", label: "Moderate", desc: "15-20 min, 3-4 steps" },
              { id: "thorough", label: "Thorough", desc: "25-35 min, 4-5 steps" },
            ].map((d) => (
              <button
                type="button"
                key={d.id}
                onClick={() => setDifficulty(d.id as DifficultyLevel)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  difficulty === d.id
                    ? "bg-forest-50 border-forest text-forest-900 ring-1 ring-forest"
                    : "bg-white border-paper-300 text-stone-600 hover:border-paper-400"
                }`}
              >
                <div className="font-bold text-xs">{d.label}</div>
                <div className="text-[11px] text-stone-500 mt-0.5">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="p-4 rounded-lg bg-paper-200 border border-paper-300 text-xs text-stone-700 flex items-start space-x-2.5">
          <ShieldCheck className="w-4 h-4 text-forest flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Leave-No-Trace Policy:</strong> Mundane investigations are designed for public outdoor spaces. Never trespass, damage bark, taste wild mushrooms/plants, or disturb wildlife.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-xs font-mono text-stone-600 hover:text-stone-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-md bg-forest text-paper-100 font-medium hover:bg-forest-600 disabled:opacity-50 transition-colors shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Constructing Field Procedure...</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4" />
                <span>Generate Investigation</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewInvestigationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-stone-500 font-mono text-xs">
          Loading investigation setup...
        </div>
      }
    >
      <NewInvestigationForm />
    </Suspense>
  );
}
