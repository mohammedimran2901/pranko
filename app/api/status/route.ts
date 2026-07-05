/**
 * GET /api/status?id=<jobId>&fal=<falRequestId>
 * Polls fal.ai for video generation status and returns the video URL
 * when complete. Uses the URLs from fal.ai's submission response.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

const FAL_KEY = process.env.FAL_KEY || "";

function getHeaders(): Record<string, string> {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

function findVideoUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 20 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) { for (const item of obj) { const f = findVideoUrl(item, depth + 1); if (f) return f; } return null; }
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10 && value.startsWith("http")) {
      if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) return value;
      if (key.toLowerCase() === "url") return value;
      if (/fal\.(ai|run|media)|falcdn|v\d+\.fal\.|storage\.googleapis/i.test(value)) return value;
    }
    if (typeof value === "object" && value !== null) { const f = findVideoUrl(value, depth + 1); if (f) return f; }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  let job: any = undefined;
  try { job = await store.getJob(id); } catch {}

  if (job?.status === "completed" && job?.resultVideoUrl) {
    return NextResponse.json({ id: job.id, status: "completed", shareToken: job.shareToken, resultVideoUrl: job.resultVideoUrl });
  }
  if (job?.status === "failed") {
    return NextResponse.json({ id: job.id, status: "failed", error: job.error });
  }

  // Use the URLs from fal.ai's submission response (shorter path) or fall back to constructing from model
  const statusUrl = job?.falStatusUrl || `https://queue.fal.run/fal-ai/seedance-2/mini/reference-to-video/requests/${job?.falRequestId}/status`;
  const resultUrl = job?.falResultUrl || `https://queue.fal.run/fal-ai/seedance-2/mini/reference-to-video/requests/${job?.falRequestId}`;

  if (!job?.falRequestId && !statusUrl.includes("requests/")) {
    return NextResponse.json({ id, status: "generating" });
  }

  try {
    const statusRes = await fetch(statusUrl, { method: "POST", headers: getHeaders() });
    if (!statusRes.ok) return NextResponse.json({ id, status: "generating" });

    let statusData: any;
    try { statusData = await statusRes.json(); } catch { return NextResponse.json({ id, status: "generating" }); }

    console.log("[status]", statusData.status);

    if (statusData.status === "COMPLETED") {
      const resultRes = await fetch(resultUrl, { method: "POST", headers: getHeaders() });
      if (!resultRes.ok) return NextResponse.json({ id, status: "generating" });

      let resultData: any;
      try { resultData = await resultRes.json(); } catch { return NextResponse.json({ id, status: "generating" }); }

      const videoUrl = findVideoUrl(resultData) || resultData?.video?.url || resultData?.output?.video?.url || resultData?.output?.url || null;

      if (videoUrl) {
        console.log("[status] Found:", videoUrl.substring(0, 80));
        if (job) { try { await store.updateJob(job.id, { status: "completed", resultVideoUrl: videoUrl, completedAt: Date.now() }); } catch {} }
        return NextResponse.json({ id, status: "completed", shareToken: job?.shareToken || "pending", resultVideoUrl: videoUrl });
      }

      console.error("[status] COMPLETED but no URL. Keys:", Object.keys(resultData));
      return NextResponse.json({ id, status: "generating", debug: "video_url_missing" });
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      try { if (job) await store.updateJob(job.id, { status: "failed", error: "Fal generation failed" }); } catch {}
      return NextResponse.json({ id, status: "failed", error: "Generation failed" });
    }

    return NextResponse.json({ id, status: "generating", falStatus: statusData.status });
  } catch (e: any) {
    console.error("[status] Exception:", e.message);
    return NextResponse.json({ id, status: "generating" });
  }
}