/**
 * Persistent job store backed by Supabase `prank_jobs` table.
 *
 * The previous in-memory Map was destroyed on every Vercel cold start,
 * which meant jobs created by create-job were invisible to status, share,
 * and job routes.  This store reads/writes Supabase directly.
 */
import { nanoid } from "nanoid";
import { getSupabase } from "@/lib/supabase/server";

const JOBS_TABLE = "prank_jobs";

export type PrankStatus = "queued" | "uploading" | "generating" | "completed" | "failed";

export interface PrankJob {
  id: string;
  status: PrankStatus;
  prompt: string;
  falRequestId: string;
  uploadedImageUrl?: string;
  resultVideoUrl?: string;
  error?: string;
  createdAt: number;       // epoch ms
  completedAt?: number;     // epoch ms
  locale: string;
  shareToken: string;
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

class PrankStore {
  async createJob(params: {
    prompt: string;
    locale: string;
    falRequestId: string;
    uploadedImageUrl?: string;
  }): Promise<PrankJob> {
    const id = nanoid(12);
    const shareToken = nanoid(16);

    const supabase = getSupabase();
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

    if (error) throw new Error(`Failed to create job: ${error.message}`);

    return {
      id,
      shareToken,
      status: "generating",
      prompt: params.prompt,
      falRequestId: params.falRequestId,
      uploadedImageUrl: params.uploadedImageUrl,
      locale: params.locale,
      createdAt: Date.now(),
    };
  }

  async getJob(id: string): Promise<PrankJob | undefined> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(JOBS_TABLE)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return undefined;
    return rowToJob(data);
  }

  async getJobByShareToken(token: string): Promise<PrankJob | undefined> {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(JOBS_TABLE)
      .select("*")
      .eq("share_token", token)
      .maybeSingle();

    if (error || !data) return undefined;
    return rowToJob(data);
  }

  async updateJob(id: string, updates: Partial<PrankJob>): Promise<PrankJob | undefined> {
    const supabase = getSupabase();
    const row: Record<string, any> = {};
    if (updates.status !== undefined) row.status = updates.status;
    if (updates.resultVideoUrl !== undefined) row.result_video_url = updates.resultVideoUrl;
    if (updates.error !== undefined) row.error = updates.error;
    if (updates.completedAt !== undefined) row.completed_at = new Date(updates.completedAt).toISOString();
    if (updates.falRequestId !== undefined) row.fal_request_id = updates.falRequestId;
    if (updates.uploadedImageUrl !== undefined) row.uploaded_image_url = updates.uploadedImageUrl;

    if (Object.keys(row).length === 0) {
      // nothing to update – just re-fetch
      return this.getJob(id);
    }

    const { error } = await supabase.from(JOBS_TABLE).update(row).eq("id", id);
    if (error) {
      console.error("store.updateJob error:", error.message);
      return undefined;
    }
    return this.getJob(id);
  }

  async deleteJob(id: string): Promise<boolean> {
    const supabase = getSupabase();
    const { error } = await supabase.from(JOBS_TABLE).delete().eq("id", id);
    return !error;
  }
}

// Hot-reload safe singleton
declare global {
  // eslint-disable-next-line no-var
  var __prankoStore: PrankStore | undefined;
}

export const store: PrankStore =
  globalThis.__prankoStore ?? (globalThis.__prankoStore = new PrankStore());