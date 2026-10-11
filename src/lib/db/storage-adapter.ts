import { Investigation, FieldObservation, Hypothesis, ConclusionStatus } from "@/lib/types/investigation";
import { supabase, isSupabaseConfigured } from "@/lib/db/supabase-client";

const LOCAL_STORAGE_KEY = "mundane_investigations_v1";

export class StorageAdapter {
  public getStorageMode(): "supabase_cloud" | "local_storage_offline" {
    return isSupabaseConfigured ? "supabase_cloud" : "local_storage_offline";
  }

  // --- Local Storage & In-Memory Fallback Helpers ---
  private memoryStore: Map<string, Investigation> = new Map();

  private getLocalList(): Investigation[] {
    if (typeof window === "undefined") {
      return Array.from(this.memoryStore.values());
    }
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      const parsed: Investigation[] = raw ? JSON.parse(raw) : [];
      // Keep memory store synced
      parsed.forEach((inv) => this.memoryStore.set(inv.id, inv));
      return parsed;
    } catch {
      return Array.from(this.memoryStore.values());
    }
  }

  private setLocalList(list: Investigation[]) {
    this.memoryStore.clear();
    list.forEach((inv) => this.memoryStore.set(inv.id, inv));

    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error("Local storage quota exceeded or unavailable:", e);
    }
  }

  // --- Public Storage Operations ---

  public async listInvestigations(): Promise<Investigation[]> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("investigations")
          .select("*, observations(*), hypotheses(*)")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (data) {
          return data.map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            title: row.title,
            centralQuestion: row.central_question,
            category: row.category,
            whyWorthInvestigating: row.why_worth_investigating,
            observablePhenomena: row.observable_phenomena || [],
            fieldProcedure: row.field_procedure || [],
            timeEstimateMinutes: row.time_estimate_minutes,
            difficulty: row.difficulty,
            safetyConsiderations: row.safety_considerations || [],
            status: row.status,
            conclusion: row.conclusion,
            conclusionStatus: row.conclusion_status,
            remainingUncertainties: row.remaining_uncertainties,
            personalReflections: row.personal_reflections,
            observations: (row.observations || []).map((o: any) => ({
              id: o.id,
              investigationId: o.investigation_id,
              stepNumber: o.step_number,
              prompt: o.prompt,
              notes: o.notes,
              isUncertain: o.is_uncertain,
              environmentalContext: o.environmental_context || {},
              photoUrl: o.photo_url,
              aiAnalysis: o.ai_analysis,
              createdAt: o.created_at,
            })),
            hypotheses: (row.hypotheses || []).map((h: any) => ({
              id: h.id,
              investigationId: h.investigation_id,
              statement: h.statement,
              source: h.source,
              verdict: h.verdict,
              supportingEvidence: h.supporting_evidence || "",
              contradictingEvidence: h.contradicting_evidence || "",
              createdAt: h.created_at,
            })),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to local store:", err);
      }
    }

    return this.getLocalList();
  }

  public async getInvestigation(id: string): Promise<Investigation | null> {
    const list = await this.listInvestigations();
    return list.find((i) => i.id === id) || null;
  }

  public async saveInvestigation(investigation: Investigation): Promise<Investigation> {
    // Always persist to local store first so data is never lost offline
    const localList = this.getLocalList();
    const existingIdx = localList.findIndex((i) => i.id === investigation.id);
    if (existingIdx >= 0) {
      localList[existingIdx] = investigation;
    } else {
      localList.unshift(investigation);
    }
    this.setLocalList(localList);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: invErr } = await supabase.from("investigations").upsert({
          id: investigation.id,
          user_id: investigation.userId || null,
          title: investigation.title,
          central_question: investigation.centralQuestion,
          category: investigation.category,
          why_worth_investigating: investigation.whyWorthInvestigating,
          observable_phenomena: investigation.observablePhenomena,
          field_procedure: investigation.fieldProcedure,
          time_estimate_minutes: investigation.timeEstimateMinutes,
          difficulty: investigation.difficulty,
          safety_considerations: investigation.safetyConsiderations,
          status: investigation.status,
          conclusion: investigation.conclusion || null,
          conclusion_status: investigation.conclusionStatus || null,
          remaining_uncertainties: investigation.remainingUncertainties || null,
          personal_reflections: investigation.personalReflections || null,
          updated_at: new Date().toISOString(),
        });
        if (invErr) console.warn("Supabase upsert investigation error:", invErr);
      } catch (e) {
        console.warn("Supabase sync error:", e);
      }
    }

    return investigation;
  }

  public async deleteInvestigation(id: string): Promise<void> {
    const localList = this.getLocalList().filter((i) => i.id !== id);
    this.setLocalList(localList);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("investigations").delete().eq("id", id);
      } catch (e) {
        console.warn("Supabase delete error:", e);
      }
    }
  }

  public async addObservation(investigationId: string, obs: FieldObservation): Promise<Investigation> {
    const inv = await this.getInvestigation(investigationId);
    if (!inv) throw new Error("Investigation not found: " + investigationId);

    const existingIdx = inv.observations.findIndex((o) => o.id === obs.id);
    if (existingIdx >= 0) {
      inv.observations[existingIdx] = obs;
    } else {
      inv.observations.push(obs);
    }
    inv.updatedAt = new Date().toISOString();

    await this.saveInvestigation(inv);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("observations").upsert({
          id: obs.id,
          investigation_id: investigationId,
          step_number: obs.stepNumber,
          prompt: obs.prompt,
          notes: obs.notes,
          is_uncertain: obs.isUncertain,
          environmental_context: obs.environmentalContext,
          photo_url: obs.photoUrl || null,
          ai_analysis: obs.aiAnalysis || null,
        });
      } catch (e) {
        console.warn("Supabase add observation error:", e);
      }
    }

    return inv;
  }

  public async updateHypothesis(investigationId: string, hypothesis: Hypothesis): Promise<Investigation> {
    const inv = await this.getInvestigation(investigationId);
    if (!inv) throw new Error("Investigation not found: " + investigationId);

    const idx = inv.hypotheses.findIndex((h) => h.id === hypothesis.id);
    if (idx >= 0) {
      inv.hypotheses[idx] = hypothesis;
    } else {
      inv.hypotheses.push(hypothesis);
    }
    inv.updatedAt = new Date().toISOString();

    await this.saveInvestigation(inv);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("hypotheses").upsert({
          id: hypothesis.id,
          investigation_id: investigationId,
          statement: hypothesis.statement,
          source: hypothesis.source,
          verdict: hypothesis.verdict,
          supporting_evidence: hypothesis.supportingEvidence,
          contradicting_evidence: hypothesis.contradictingEvidence,
        });
      } catch (e) {
        console.warn("Supabase update hypothesis error:", e);
      }
    }

    return inv;
  }
}

export const storageAdapter = new StorageAdapter();
