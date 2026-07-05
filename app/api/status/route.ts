/**
 * GET /api/status?id=<jobId>&fal=<falRequestId>
 * Polls fal.ai directly for video generation status.
 * Persists the video URL to Supabase when done.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";
const FAL_KEY = process.env.FAL_KEY || "";

function getHeaders(): Record<string, string> {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

/**
 * Recursively search an object for any video URL.
 * Looks for:
 *  - Any string value that ends with .mp4, .webm, .mov
 *  - Any key named 'url' whose value is a string containing http
 *  - Any URL from known fal.ai delivery domains
 *  - Any string containing /v1/files/ or /files/
 */
function findVideoUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 15 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10) {
      const isUrl = value.startsWith("https://") || value.startsWith("http://");
      if (!isUrl) continue;
      // video file extensions
      if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) return value;
      // key named 'url', 'video_url', 'file_url', 'output_url' etc.
      if (/^(url|video_url|file_url|output_url|result_url|download_url|src|href|playback_url|media_url)$/i.test(key)) return value;
      // known fal / CDN domains (including v3.fal.media, fal.ai, etc.)
      if (/fal\.|falcdn|v\d+\.fal\.|storage\.googleapis|delivery\.fal|\.cloudfront\.net/i.test(value)) return value;
      // /v1/files/ or /files/ or /outputs/ patterns
      if (/\/v\d\/files\/|\/files\//i.test(value)) return value;
      // Catch-all: any URL that looks like it might be media (has /output/, /result/, /media/)
      if (/\/(output|result|media|video|generated)\//i.test(value)) return value;
    }
    if (typeof value === "object" && value !== null) {
      const found = findVideoUrl(value, depth + 1);
      if (found) return found;
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const falRequestId = req.nextUrl.searchParams.get("fal");

  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const job = await store.getJob(id);
  if (job?.status === "completed") {
    return NextResponse.json({ id: job.id, status: "completed", shareToken: job.shareToken, resultVideoUrl: job.resultVideoUrl });
  }
  if (job?.status === "failed") {
    return NextResponse.json({ id: job.id, status: "failed", error: job.error });
  }

  const falId = falRequestId || job?.falRequestId;
  if (!falId) return NextResponse.json({ id, status: "generating" });

  try {
    const statusRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}/status`, { headers: getHeaders() });
    if (!statusRes.ok) return NextResponse.json({ id, status: "generating" });

    const statusText = await statusRes.text();
    let statusData: any = {};
    try { statusData = JSON.parse(statusText); } catch { return NextResponse.json({ id, status: "generating" }); }

    const status = statusData.status;

    if (status === "COMPLETED") {
      const resultRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}`, { headers: getHeaders() });
      if (!resultRes.ok) return NextResponse.json({ id, status: "generating" });

      const resultText = await resultRes.text();
      let resultData: any = {};
      try { resultData = JSON.parse(resultText); } catch { return NextResponse.json({ id, status: "generating" }); }

      console.log("[status] COMPLETED result keys:", Object.keys(resultData));

      const videoUrl = findVideoUrl(resultData);

      if (videoUrl) {
        console.log("[status] Found video URL:", videoUrl);
        if (job) {
          await store.updateJob(job.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
          return NextResponse.json({ id, status: "completed", shareToken: job.shareToken, resultVideoUrl: videoUrl });
        }
        // Fallback: create a job if somehow we lost it
        const newJob = await store.createJob({ prompt: "", locale: "en", falRequestId: falId });
        await store.updateJob(newJob.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
        return NextResponse.json({ id: newJob.id, status: "completed", shareToken: newJob.shareToken, resultVideoUrl: videoUrl });
      }

      // Dump the full response structure for debugging
      console.error("[status] COMPLETED but no video URL found.");
      console.error("[status] Full response (first 2000 chars):", resultText.substring(0, 2000));
      // Also log JSON structure recursively
      const dumpKeys = (o: any, d = 0): string => {
        if (!o || typeof o !== "object" || d > 4) return "";
        if (Array.isArray(o)) return `[${o.length} items]`;
        return "{ " + Object.entries(o).map(([k, v]) => {
          const val = typeof v === "string" ? `"${v.substring(0, 80)}"` :
            typeof v === "object" && v !== null ? dumpKeys(v, d + 1) : String(v);
          return `${k}: ${val}`;
        }).join(", ") + " }";
      };
      console.error("[status] Response structure:", dumpKeys(resultData));
      return NextResponse.json({ id, status: "generating", pollAttempt: "video_url_missing", debug: Object.keys(resultData).join(",") });
    }

    if (status === "FAILED" || status === "ERROR") {
      if (job) await store.updateJob(job.id, { status: "failed", error: "Fal generation failed" });
      return NextResponse.json({ id, status: "failed", error: "Generation failed" });
    }

    return NextResponse.json({ id, status: "generating", falStatus: status });
  } catch (e: any) {
    console.error("[status] error:", e.message);
    return NextResponse.json({ id, status: "generating" });
  }
}