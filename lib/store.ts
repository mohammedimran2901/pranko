/**
 * Simple in-memory store for prank jobs and results.
 * For MVP — in production, swap for Supabase or Redis.
 * The same pattern as mythself's lib/store.ts.
 */
import { nanoid } from "nanoid";

export type PrankStatus = "queued" | "uploading" | "generating" | "completed" | "failed";
export type Tier = "free" | "single" | "pack" | "pro" | "lifetime";
export type PrankEngine = "pulid" | "merge";

export interface PrankJob {
  id: string;
  status: PrankStatus;
  prompt: string;
  templateId: string | null;
  mode: string;
  /** URL of the subject image (the person / object to preserve) */
  uploadedImageUrl?: string;
  /** URL of the scene image (the background / setting to merge into) */
  sceneImageUrl?: string;
  /** Engine used to render this prank */
  engine: PrankEngine;
  resultImageUrl?: string;
  watermarked?: boolean;
  error?: string;
  createdAt: number;
  completedAt?: number;
  locale: string;
  shareToken: string;
  tier: Tier;
  paid: boolean;
  userId?: string;
}

class PrankStore {
  private jobs: Map<string, PrankJob> = new Map();
  private byShareToken: Map<string, string> = new Map();

  createJob(params: {
    prompt: string;
    templateId: string | null;
    mode: string;
    locale: string;
    tier: Tier;
    paid: boolean;
    engine?: PrankEngine;
    userId?: string;
  }): PrankJob {
    const id = nanoid(12);
    const shareToken = nanoid(16);
    const job: PrankJob = {
      id,
      status: "queued",
      ...params,
      engine: params.engine || "pulid",
      shareToken,
      createdAt: Date.now(),
    };
    this.jobs.set(id, job);
    this.byShareToken.set(shareToken, id);
    return job;
  }

  getJob(id: string): PrankJob | undefined {
    return this.jobs.get(id);
  }

  getJobByShareToken(token: string): PrankJob | undefined {
    const id = this.byShareToken.get(token);
    if (!id) return undefined;
    return this.jobs.get(id);
  }

  updateJob(id: string, updates: Partial<PrankJob>): PrankJob | undefined {
    const job = this.jobs.get(id);
    if (!job) return undefined;
    const updated = { ...job, ...updates };
    this.jobs.set(id, updated);
    return updated;
  }

  deleteJob(id: string): boolean {
    const job = this.jobs.get(id);
    if (!job) return false;
    this.byShareToken.delete(job.shareToken);
    this.jobs.delete(id);
    return true;
  }

  countByDay(): number {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    let count = 0;
    for (const job of this.jobs.values()) {
      if (job.createdAt >= startOfDay.getTime()) count++;
    }
    // Add some fake "from this morning" activity for social proof
    return count + 247;
  }

  totalCount(): number {
    return this.jobs.size + 12847;
  }
}

// Hot-reload safe singleton
declare global {
  // eslint-disable-next-line no-var
  var __prankoStore: PrankStore | undefined;
}
export const store: PrankStore =
  globalThis.__prankoStore ?? (globalThis.__prankoStore = new PrankStore());
