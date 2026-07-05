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

async function safeJson(res: Response, label: string): Promise<string> {
  try { return await res.text(); }
  catch { return ""; }
}

/**
 * Recursively search an object for any URL that looks like
 * a video / file from fal.ai. We match on:
 * - key names that suggest a media URL (url, video_url, file_url, src, etc.)
 * - OR any string value > 30 chars starting with http, from a fal/falcdn domain
 * - OR any string value containing /v1/files/ or /files/ (fal CDN paths)
 */
function findVideoUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 10 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findVideoUrl(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  const MEDIA_KEYS = /^(url|video_url|file_url|output_url|result_url|src|href|download_url|playback_url|media_url)$/i;
  const FAL_DOMAINS = /(fal\.(ai|run)|falcdn\.com|storage\.googleapis\.com|delivery\.fal)/i;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10) {
      const isUrl = value.startsWith("https://") || value.startsWith("http://");
      // Priority 1: key name suggests a media URL
      if (isUrl && MEDIA_KEYS.test(key)) return value;
      // Priority 2: URL contains known fal / video domains or paths
      if (isUrl && FAL_DOMAINS.test(value)) return value;
      // Priority 3: any URL that contains common file/video extensions
      if (isUrl && /\.(mp4|webm|mov|avi|mkv|gif|png|jpg)(\?|$)/i.test(value)) return value;
      // Priority 4: any URL with /v1/files/ or /files/ in path (fal CDN)
      if (isUrl && /\/v\d\/files\/|\/files\//i.test(value)) return value;
    }
    if (typeof value === "object") {
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

  const job = store.getJob(id);
  if (job?.status === "completed") {
    return NextResponse.json({ id: job.id, status: "completed", shareToken: job.shareToken, resultVideoUrl: job.resultVideoUrl });
  }
  if (job?.status === "failed") {
    return NextResponse.json({ id: job.id, status: "failed", error: job.error });
  }

  const falId = falRequestId || job?.falRequestId;
  if (!falId) return NextResponse.json({ id, status: "generating" });

  try {
    // Status check
    const statusRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}/status`, { headers: getHeaders() });
    if (!statusRes.ok) return NextResponse.json({ id, status: "generating" });

    const statusText = await safeJson(statusRes, "status");
    let statusData: any = {};
    try { statusData = JSON.parse(statusText); } catch { return NextResponse.json({ id, status: "generating" }); }

    const status = statusData.status;

    if (status === "COMPLETED") {
      // Fetch result
      const resultRes = await fetch(`${FAL_BASE}/${FAL_MODEL}/requests/${falId}`, { headers: getHeaders() });
      if (!resultRes.ok) return NextResponse.json({ id, status: "generating" });

      const resultText = await safeJson(resultRes, "result");
      let resultData: any = {};
      try { resultData = JSON.parse(resultText); } catch { return NextResponse.json({ id, status: "generating" }); }

      // Log full result shape for debugging
      console.log("[status] COMPLETED result keys:", Object.keys(resultData));
      if (resultData.output) console.log("[status] output keys:", Object.keys(resultData.output));
      if (resultData.video) console.log("[status] video type:", typeof resultData.video, resultData.video);
      if (resultData.logs) console.log("[status] logs:", JSON.stringify(resultData.logs).substring(0, 300));

      // Try to find any video URL in the response by walking the object tree
      const videoUrl = findVideoUrl(resultData);

      if (videoUrl) {
        if (job) {
          store.updateJob(job.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
          return NextResponse.json({ id, status: "completed", shareToken: job.shareToken, resultVideoUrl: videoUrl });
        }
        const newJob = store.createJob({ prompt: "", locale: "en", falRequestId: falId });
        store.updateJob(newJob.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() });
        return NextResponse.json({ id: newJob.id, status: "completed", shareToken: newJob.shareToken, resultVideoUrl: videoUrl });
      }

      // If no video URL found, dump keys so we can debug
      console.error("[status] COMPLETED but no video URL found. Response:", resultText.substring(0, 1000));
      return NextResponse.json({ id, status: "generating", pollAttempt: "video_url_missing", debug: Object.keys(resultData).join(",") });
    }

    if (status === "FAILED" || status === "ERROR") {
      if (job) store.updateJob(job.id, { status: "failed", error: "Fal generation failed" });
      return NextResponse.json({ id, status: "failed", error: "Generation failed" });
    }

    return NextResponse.json({ id, status: "generating", falStatus: status });
  } catch (e: any) {
    console.error("[status] error:", e.message);
    return NextResponse.json({ id, status: "generating" });
  }
}