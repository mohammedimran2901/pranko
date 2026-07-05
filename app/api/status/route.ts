/**
 * GET /api/status?id=<jobId>&fal=<falRequestId>
 * Polls fal.ai directly for video generation status.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";
const FAL_KEY = process.env.FAL_KEY || "";

function getHeaders(): Record<string, string> {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

/** Safely parse JSON — returns null instead of throwing. */
async function safeJson(res: Response, label: string): Promise<any | null> {
  const text = await res.text();
  try { return JSON.parse(text); }
  catch {
    console.error(`[status] ${label} non-JSON (${res.status}): ${text.substring(0, 200)}`);
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const falRequestId = req.nextUrl.searchParams.get("fal");

  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  // Check in-memory store first (only works on same Lambda).
  const job = store.getJob(id);
  if (job?.status === "completed") {
    return NextResponse.json({
      id: job.id, status: "completed", shareToken: job.shareToken,
      resultVideoUrl: job.resultVideoUrl, completedAt: job.completedAt,
    });
  }
  if (job?.status === "failed") {
    return NextResponse.json({ id: job.id, status: "failed", error: job.error });
  }

  // Poll fal.ai directly.
  const falId = falRequestId || job?.falRequestId;
  if (!falId) {
    return NextResponse.json({ id, status: "generating" });
  }

  try {
    // 1. Check status.
    const statusRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}/status`, { headers: getHeaders() });
    if (!statusRes.ok) {
      return NextResponse.json({ id, status: "generating", pollAttempt: "status_fetch_failed" });
    }
    const statusData = await safeJson(statusRes, "status poll");
    if (!statusData) {
      return NextResponse.json({ id, status: "generating", pollAttempt: "status_not_json" });
    }

    if (statusData.status === "COMPLETED") {
      // 2. Fetch the result.
      const resultRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}`, { headers: getHeaders() });
      if (!resultRes.ok) {
        return NextResponse.json({ id, status: "generating", pollAttempt: "result_fetch_failed" });
      }
      const resultData = await safeJson(resultRes, "result fetch");
      if (!resultData) {
        return NextResponse.json({ id, status: "generating", pollAttempt: "result_not_json" });
      }

      const videoUrl =
        resultData.video?.url ||
        resultData.output?.video?.url ||
        resultData.output?.url ||
        resultData.result?.video?.url ||
        resultData.result?.url ||
        "";

      if (videoUrl) {
        if (job) {
          store.updateJob(job.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
          return NextResponse.json({ id, status: "completed", shareToken: job.shareToken, resultVideoUrl: videoUrl });
        }
        const newJob = store.createJob({ prompt: "", locale: "en", falRequestId: falId });
        store.updateJob(newJob.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
        return NextResponse.json({ id: newJob.id, status: "completed", shareToken: newJob.shareToken, resultVideoUrl: videoUrl });
      }

      return NextResponse.json({ id, status: "generating", pollAttempt: "video_url_missing" });
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      if (job) store.updateJob(job.id, { status: "failed", error: "Fal generation failed" });
      return NextResponse.json({ id, status: "failed", error: "Generation failed" });
    }

    // Still in progress — include the fal status for transparency.
    return NextResponse.json({ id, status: "generating", falStatus: statusData.status });
  } catch (e: any) {
    console.error("[status] unexpected error:", e.message);
    return NextResponse.json({ id, status: "generating", error: e.message });
  }
}