import { Investigation, FieldObservation, Hypothesis, ConclusionStatus } from "@/lib/types/investigation";
import { supabase, isSupabaseConfigured } from "./supabase-client";
import { ensureUUID } from "@/lib/utils/uuid";

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
    const cleanId = ensureUUID(id);
    const list = await this.listInvestigations();
    const found = list.find((i) => i.id === id || i.id === cleanId || ensureUUID(i.id) === cleanId);
    if (found) return found;

    const localList = this.getLocalList();
    return localList.find((i) => i.id === id || i.id === cleanId || ensureUUID(i.id) === cleanId) || null;
  }

  public async saveInvestigation(investigation: Investigation): Promise<Investigation> {
    const cleanInvId = ensureUUID(investigation.id);

    // Always persist to local store first so data is never lost offline
    const localList = this.getLocalList();
    const existingIdx = localList.findIndex((i) => i.id === investigation.id || i.id === cleanInvId || ensureUUID(i.id) === cleanInvId);
    if (existingIdx >= 0) {
      localList[existingIdx] = investigation;
    } else {
      localList.unshift(investigation);
    }
    this.setLocalList(localList);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: invErr } = await supabase.from("investigations").upsert({
          id: cleanInvId,
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

        if (investigation.hypotheses && investigation.hypotheses.length > 0) {
          const hypRows = investigation.hypotheses.map((h) => ({
            id: ensureUUID(h.id),
            investigation_id: cleanInvId,
            statement: h.statement,
            source: h.source,
            verdict: h.verdict,
            supporting_evidence: h.supportingEvidence || "",
            contradicting_evidence: h.contradictingEvidence || "",
          }));
          const { error: hypErr } = await supabase.from("hypotheses").upsert(hypRows);
          if (hypErr) console.warn("Supabase upsert hypotheses error:", hypErr);
        }

        if (investigation.observations && investigation.observations.length > 0) {
          const obsRows = investigation.observations.map((o) => ({
            id: ensureUUID(o.id),
            investigation_id: cleanInvId,
            step_number: o.stepNumber,
            prompt: o.prompt,
            notes: o.notes,
            is_uncertain: o.isUncertain,
            environmental_context: o.environmentalContext || {},
            photo_url: o.photoUrl || null,
            ai_analysis: o.aiAnalysis || null,
          }));
          const { error: obsErr } = await supabase.from("observations").upsert(obsRows);
          if (obsErr) console.warn("Supabase upsert observations error:", obsErr);
        }
      } catch (e) {
        console.warn("Supabase sync error:", e);
      }
    }

    return investigation;
  }

  public async deleteInvestigation(id: string): Promise<void> {
    const cleanId = ensureUUID(id);
    const localList = this.getLocalList().filter(
      (i) => i.id !== id && i.id !== cleanId && ensureUUID(i.id) !== cleanId
    );
    this.setLocalList(localList);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("investigations").delete().eq("id", cleanId);
      } catch (e) {
        console.warn("Supabase delete error:", e);
      }
    }
  }

  public async addObservation(investigationId: string, obs: FieldObservation): Promise<Investigation> {
    const inv = await this.getInvestigation(investigationId);
    if (!inv) throw new Error("Investigation not found: " + investigationId);

    const cleanInvId = ensureUUID(investigationId);
    const cleanObsId = ensureUUID(obs.id);

    const existingIdx = inv.observations.findIndex((o) => o.id === obs.id || o.id === cleanObsId || ensureUUID(o.id) === cleanObsId);
    if (existingIdx >= 0) {
      inv.observations[existingIdx] = obs;
    } else {
      inv.observations.push(obs);
    }
    inv.updatedAt = new Date().toISOString();

    await this.saveInvestigation(inv);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: obsErr } = await supabase.from("observations").upsert({
          id: cleanObsId,
          investigation_id: cleanInvId,
          step_number: obs.stepNumber,
          prompt: obs.prompt,
          notes: obs.notes,
          is_uncertain: obs.isUncertain,
          environmental_context: obs.environmentalContext || {},
          photo_url: obs.photoUrl || null,
          ai_analysis: obs.aiAnalysis || null,
        });
        if (obsErr) console.warn("Supabase add observation error:", obsErr);
      } catch (e) {
        console.warn("Supabase add observation error:", e);
      }
    }

    return inv;
  }

  public async updateHypothesis(investigationId: string, hypothesis: Hypothesis): Promise<Investigation> {
    const inv = await this.getInvestigation(investigationId);
    if (!inv) throw new Error("Investigation not found: " + investigationId);

    const cleanInvId = ensureUUID(investigationId);
    const cleanHypId = ensureUUID(hypothesis.id);

    const idx = inv.hypotheses.findIndex((h) => h.id === hypothesis.id || h.id === cleanHypId || ensureUUID(h.id) === cleanHypId);
    if (idx >= 0) {
      inv.hypotheses[idx] = hypothesis;
    } else {
      inv.hypotheses.push(hypothesis);
    }
    inv.updatedAt = new Date().toISOString();

    await this.saveInvestigation(inv);

    if (isSupabaseConfigured && supabase) {
      try {
        const { error: hypErr } = await supabase.from("hypotheses").upsert({
          id: cleanHypId,
          investigation_id: cleanInvId,
          statement: hypothesis.statement,
          source: hypothesis.source,
          verdict: hypothesis.verdict,
          supporting_evidence: hypothesis.supportingEvidence || "",
          contradicting_evidence: hypothesis.contradictingEvidence || "",
        });
        if (hypErr) console.warn("Supabase update hypothesis error:", hypErr);
      } catch (e) {
        console.warn("Supabase update hypothesis error:", e);
      }
    }

    return inv;
  }

}

export const storageAdapter = new StorageAdapter();
