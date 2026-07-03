/**
 * Simple in-memory store for prank video jobs.
 * For MVP — in production, swap for Supabase or Redis.
 * Note: Vercel serverless is stateless, so this only works
 * within a single function invocation. For cross-invocation
 * state, the client uses the falRequestId to poll fal.ai directly.
 */
import { nanoid } from "nanoid";

export type PrankStatus = "queued" | "uploading" | "generating" | "completed" | "failed";

export interface PrankJob {
  id: string;
  status: PrankStatus;
  prompt: string;
  falRequestId: string;
  uploadedImageUrl?: string;
  resultVideoUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
  locale: string;
  shareToken: string;
}

class PrankStore {
  private jobs: Map<string, PrankJob> = new Map();
  private byShareToken: Map<string, string> = new Map();

  createJob(params: {
    prompt: string;
    locale: string;
    falRequestId: string;
    uploadedImageUrl?: string;
  }): PrankJob {
    const id = nanoid(12);
    const shareToken = nanoid(16);
    const job: PrankJob = {
      id,
      status: "generating",
      ...params,
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
}

// Hot-reload safe singleton
declare global {
  // eslint-disable-next-line no-var
  var __prankoStore: PrankStore | undefined;
}

export const store: PrankStore =
  globalThis.__prankoStore ?? (globalThis.__prankoStore = new PrankStore());