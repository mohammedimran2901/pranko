/**
 * GET /api/status?id=<jobId>&fal=<falRequestId>
 * Polls fal.ai directly for video generation status.
 * Returns the video URL to the client as soon as it's found —
 * Supabase persistence failures are logged but never block delivery.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";
const FAL_KEY = process.env.FAL_KEY || "";

function getHeaders(): Record<string, string> {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

/** Try to persist a job update; log and continue if it fails. */
async function safeUpdateJob(id: string, updates: any) {
  try { await store.updateJob(id, updates); } catch (e: any) { console.error("[status] DB update failed (non-fatal):", e.message); }
}

/**
 * Recursively search for a video URL.
 * Last resort: any string key named "url", or any HTTPS string that looks media-ish.
 */
function findVideoUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 15 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) { const f = findVideoUrl(item, depth + 1); if (f) return f; }
    return null;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10) {
      if (!value.startsWith("http")) continue;
      // 1. video extensions
      if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) return value;
      // 2. key named 'url' (catches { video: { url: "..." } })
      if (key.toLowerCase() === "url") return value;
      // 3. fal / CDN domains
      if (/fal\.|falcdn|v\d+\.fal\.|storage\.googleapis|delivery\.fal|cloudfront/i.test(value)) return value;
      // 4. media path patterns
      if (/\/(output|result|media|video|generated|files)\//i.test(value)) return value;
      // 5. LAST RESORT: any URL with ? or & params that could be a signed media URL
      if (value.includes("?") && value.length > 100) return value;
    }
    if (typeof value === "object" && value !== null) {
      const f = findVideoUrl(value, depth + 1);
      if (f) return f;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const falRequestId = req.nextUrl.searchParams.get("fal");

  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  // Try to load job from Supabase (may fail gracefully)
  let job: any = undefined;
  try { job = await store.getJob(id); } catch (e: any) { console.warn("[status] DB read failed:", e.message); }

  if (job?.status === "completed") {
    return NextResponse.json({ id: job.id, status: "completed", shareToken: job.shareToken, resultVideoUrl: job.resultVideoUrl });
  }
  if (job?.status === "failed") {
    return NextResponse.json({ id: job.id, status: "failed", error: job.error });
  }

  const falId = falRequestId || job?.falRequestId;
  if (!falId) return NextResponse.json({ id, status: "generating" });

  try {
    // STATUS CHECK
    const statusRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}/status`, { headers: getHeaders() });
    if (!statusRes.ok) return NextResponse.json({ id, status: "generating" });

    let statusData: any = {};
    try { statusData = JSON.parse(await statusRes.text()); } catch { return NextResponse.json({ id, status: "generating" }); }

    const status = statusData.status;

    if (status === "COMPLETED") {
      // FETCH RESULT
      const resultRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}`, { headers: getHeaders() });
      if (!resultRes.ok) return NextResponse.json({ id, status: "generating" });

      const resultText = await resultRes.text();
      let resultData: any = {};
      try { resultData = JSON.parse(resultText); } catch { return NextResponse.json({ id, status: "generating" }); }

      console.log("[status] COMPLETED result keys:", Object.keys(resultData));

      const videoUrl = findVideoUrl(resultData);

      if (videoUrl) {
        console.log("[status] Found video URL:", videoUrl.substring(0, 120));

        // Persist to Supabase — best-effort, never block delivery
        if (job) {
          safeUpdateJob(job.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
        } else {
          // Try to create + update job; if it fails, just deliver the URL
          try {
            const newJob = await store.createJob({ prompt: "", locale: "en", falRequestId: falId });
            safeUpdateJob(newJob.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
          } catch (e: any) {
            console.warn("[status] Could not persist job:", e.message);
          }
        }

        // ALWAYS return the video URL to the client
        return NextResponse.json({
          id,
          status: "completed",
          shareToken: job?.shareToken || "pending",
          resultVideoUrl: videoUrl,
        });
      }

      // DUMP for debugging
      console.error("[status] COMPLETED but no video URL. Keys:", Object.keys(resultData));
      console.error("[status] Response (first 2000 chars):", resultText.substring(0, 2000));
      return NextResponse.json({ id, status: "generating", pollAttempt: "video_url_missing" });
    }

    if (status === "FAILED" || status === "ERROR") {
      safeUpdateJob(id, { status: "failed", error: "Fal generation failed" });
      return NextResponse.json({ id, status: "failed", error: "Generation failed" });
    }

    return NextResponse.json({ id, status: "generating", falStatus: status });
  } catch (e: any) {
    console.error("[status] error:", e.message);
    return NextResponse.json({ id, status: "generating" });
  }
}