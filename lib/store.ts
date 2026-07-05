/**
 * Persistent job store.
 *
 * When Supabase env vars are set (NEXT_PUBLIC_SUPABASE_URL +
 * SUPABASE_SERVICE_ROLE_KEY), jobs are persisted to the `prank_jobs` table
 * and survive Vercel cold starts.  Otherwise, an in-memory Map is used as
 * a fallback (works within a single function invocation, good enough for
 * development and small-scale use where the client polls the same function
 * instance).
 */
import { nanoid } from "nanoid";

const JOBS_TABLE = "prank_jobs";

export type PrankStatus = "queued" | "uploading" | "generating" | "completed" | "failed";

export interface PrankJob {
  id: string;
  status: PrankStatus;
  prompt: string;
  falRequestId: string;
  falStatusUrl?: string;   // fal.ai's status_url for polling (shorter path)
  falResultUrl?: string;   // fal.ai's response_url for fetching result
  uploadedImageUrl?: string;
  resultVideoUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  locale: string;
  shareToken: string;
}

// ── Supabase helpers (only used when env vars are set) ────────────────

function hasSupabaseEnv(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  // Lazy import so the module loads even without @supabase/supabase-js installed
  const { createClient } = require("@supabase/supabase-js");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Map a Supabase row into a PrankJob. */
function rowToJob(row: any): PrankJob {
  return {
    id: row.id,
    shareToken: row.share_token,
    status: row.status,
    prompt: row.prompt,
    falRequestId: row.fal_request_id,
    uploadedImageUrl: row.uploaded_image_url ?? undefined,
    resultVideoUrl: row.result_video_url ?? undefined,
    error: row.error ?? undefined,
    locale: row.locale ?? "en",
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    completedAt: row.completed_at ? new Date(row.completed_at).getTime() : undefined,
  };
}

// ── In-memory fallback ──────────────────────────────────────────────

function getMemoryStore(): { jobs: Map<string, PrankJob>; byShareToken: Map<string, string> } {
  if (!(globalThis as any).__prankoMemStore) {
    (globalThis as any).__prankoMemStore = { jobs: new Map(), byShareToken: new Map() };
  }
  return (globalThis as any).__prankoMemStore;
}

// ── Unified store class ──────────────────────────────────────────────

class PrankStore {
  async createJob(params: {
    prompt: string;
    locale: string;
    falRequestId: string;
    uploadedImageUrl?: string;
    statusUrl?: string;
    resultUrl?: string;
  }): Promise<PrankJob> {
    const id = nanoid(12);
    const shareToken = nanoid(16);

    if (hasSupabaseEnv()) {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase.from(JOBS_TABLE).insert({
          id,
          share_token: shareToken,
          status: "generating",
          prompt: params.prompt,
          fal_request_id: params.falRequestId,
          uploaded_image_url: params.uploadedImageUrl ?? null,
          locale: params.locale,
          created_at: new Date().toISOString(),
        });
        if (error) throw error;
      } catch (e: any) {
        console.error("[store] Supabase createJob failed, falling back to memory:", e.message);
        // Fall through to memory store
      }
    }

    const job: PrankJob = {
      id,
      shareToken,
      status: "generating",
      prompt: params.prompt,
      falRequestId: params.falRequestId,
      falStatusUrl: params.statusUrl,
      falResultUrl: params.resultUrl,
      uploadedImageUrl: params.uploadedImageUrl,
      locale: params.locale,
      createdAt: Date.now(),
    };

    const mem = getMemoryStore();
    mem.jobs.set(id, job);
    mem.byShareToken.set(shareToken, id);

    return job;
  }

  async getJob(id: string): Promise<PrankJob | undefined> {
    // Try Supabase first
    if (hasSupabaseEnv()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from(JOBS_TABLE).select("*").eq("id", id).maybeSingle();
        if (!error && data) return rowToJob(data);
      } catch (e: any) {
        console.warn("[store] Supabase getJob failed, trying memory:", e.message);
      }
    }

    // Fall back to memory
    const mem = getMemoryStore();
    return mem.jobs.get(id);
  }

  async getJobByShareToken(token: string): Promise<PrankJob | undefined> {
    if (hasSupabaseEnv()) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase.from(JOBS_TABLE).select("*").eq("share_token", token).maybeSingle();
        if (!error && data) return rowToJob(data);
      } catch (e: any) {
        console.warn("[store] Supabase getJobByShareToken failed, trying memory:", e.message);
      }
    }

    const mem = getMemoryStore();
    const id = mem.byShareToken.get(token);
    if (!id) return undefined;
    return mem.jobs.get(id);
  }

  async updateJob(id: string, updates: Partial<PrankJob>): Promise<PrankJob | undefined> {
    if (hasSupabaseEnv()) {
      try {
        const supabase = getSupabaseClient();
        const row: Record<string, any> = {};
        if (updates.status !== undefined) row.status = updates.status;
        if (updates.resultVideoUrl !== undefined) row.result_video_url = updates.resultVideoUrl;
        if (updates.error !== undefined) row.error = updates.error;
        if (updates.completedAt !== undefined) row.completed_at = new Date(updates.completedAt).toISOString();
        if (Object.keys(row).length > 0) {
          await supabase.from(JOBS_TABLE).update(row).eq("id", id);
        }
      } catch (e: any) {
        console.warn("[store] Supabase updateJob failed, updating memory only:", e.message);
      }
    }

    // Always update in-memory too
    const mem = getMemoryStore();
    const job = mem.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    mem.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    if (hasSupabaseEnv()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from(JOBS_TABLE).delete().eq("id", id);
      } catch {}
    }

    const mem = getMemoryStore();
    const job = mem.jobs.get(id);
    if (!job) return false;
    mem.byShareToken.delete(job.shareToken);
    mem.jobs.delete(id);
    return true;
  }
}

// Hot-reload safe singleton
export const store: PrankStore =
  (globalThis as any).__prankoStore ?? ((globalThis as any).__prankoStore = new PrankStore());