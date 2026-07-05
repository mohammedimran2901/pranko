/**
 * GET /api/status?id=<jobId>&fal=<falRequestId>
 * Polls fal.ai for video generation status and returns the video URL
 * when complete. Uses the URLs from fal.ai's submission response.
 *
 * IMPORTANT: fal.ai has two URL patterns:
 *   - SHORT:   /fal-ai/seedance-2/requests/{id}        ← use GET (works!)
 *   - LONG:    /fal-ai/seedance-2/mini/reference-to-video/requests/{id}  ← GET returns 405
 *
 * The submit endpoint returns SHORT path URLs in status_url and response_url.
 * We use those if available, otherwise fall back to the SHORT path.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

const FAL_KEY = process.env.FAL_KEY || "";

function authHeaders(): Record<string, string> {
  // IMPORTANT: Do NOT include Content-Type for GET requests.
  // fal.ai rejects GET requests that include Content-Type (returns 405).
  return { Authorization: `Key ${FAL_KEY}` };
}

/** Recursively search an object for a video URL. */
function findVideoUrl(obj: any, depth = 0): string | null {
  if (!obj || depth > 20 || typeof obj !== "object") return null;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const f = findVideoUrl(item, depth + 1);
      if (f) return f;
    }
    return null;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string" && value.length > 10 && value.startsWith("http")) {
      if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(value)) return value;
      if (key.toLowerCase() === "url") return value;
      if (/fal\.(ai|run|media)|falcdn|v\d+\.fal\.|storage\.googleapis/i.test(value)) return value;
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

  let job: any = undefined;
  try {
    job = await store.getJob(id);
  } catch {}

  // If the job is already marked completed/failed in our store, return immediately
  if (job?.status === "completed" && job?.resultVideoUrl) {
    return NextResponse.json({
      id: job.id,
      status: "completed",
      shareToken: job.shareToken,
      resultVideoUrl: job.resultVideoUrl,
    });
  }
  if (job?.status === "failed") {
    return NextResponse.json({ id: job.id, status: "failed", error: job.error });
  }

  const falId = falRequestId || job?.falRequestId;
  if (!falId) return NextResponse.json({ id, status: "generating" });

  // Use the model-specific URL from the job (persisted in Supabase), or fall back
  // to the SHORT fal.ai path. The SHORT path (fal-ai/seedance-2) works with GET.
  // The LONG path (fal-ai/seedance-2/mini/reference-to-video) returns 405 on GET.
  const modelPath = "fal-ai/seedance-2";
  const statusUrl =
    job?.falStatusUrl ||
    `https://queue.fal.run/${modelPath}/requests/${falId}/status`;
  const resultUrl =
    job?.falResultUrl ||
    `https://queue.fal.run/${modelPath}/requests/${falId}`;

  if (!job?.falRequestId && !statusUrl.includes("requests/")) {
    return NextResponse.json({ id, status: "generating" });
  }

  console.log(
    `[status] Polling: job=${id} fal=${falId} statusUrl=${statusUrl.substring(0, 100)} resultUrl=${resultUrl.substring(0, 100)}`
  );

  try {
    // Step 1: Check status via GET
    console.log(`[status] Checking status: ${statusUrl.substring(0, 100)}`);
    const statusRes = await fetch(statusUrl, {
      method: "GET",
      headers: authHeaders(),
    });

    if (!statusRes.ok) {
      console.warn(`[status] Status check failed: ${statusRes.status}`);
      return NextResponse.json({ id, status: "generating" });
    }

    const statusData = await statusRes.json();
    console.log("[status] status:", statusData.status);

    if (statusData.status === "COMPLETED") {
      // Step 2: Fetch the result via GET
      console.log(`[status] Fetching result: ${resultUrl.substring(0, 100)}`);
      const resultRes = await fetch(resultUrl, {
        method: "GET",
        headers: authHeaders(),
      });

      if (!resultRes.ok) {
        console.warn(`[status] Result fetch failed: ${resultRes.status}`);
        return NextResponse.json({ id, status: "generating" });
      }

      const resultData = await resultRes.json();
      console.log("[status] Result keys:", Object.keys(resultData));

      // Seedance 2 output: { video: { url: "https://..." }, seed: 115060423 }
      const videoUrl = resultData?.video?.url || findVideoUrl(resultData) || null;

      if (videoUrl) {
        console.log("[status] Found:", videoUrl.substring(0, 80));
        if (job) {
          try {
            await store.updateJob(job.id, {
              status: "completed",
              resultVideoUrl: videoUrl,
              completedAt: Date.now(),
            });
          } catch {}
        }
        return NextResponse.json({
          id,
          status: "completed",
          shareToken: job?.shareToken || "pending",
          resultVideoUrl: videoUrl,
        });
      }

      console.error(
        "[status] COMPLETED but no URL. Keys:",
        Object.keys(resultData),
        "Snippet:",
        JSON.stringify(resultData).substring(0, 500)
      );
      return NextResponse.json({ id, status: "generating", debug: "video_url_missing" });
    }

    if (statusData.status === "FAILED" || statusData.status === "ERROR") {
      try {
        if (job) await store.updateJob(job.id, { status: "failed", error: "Fal generation failed" });
      } catch {}
      return NextResponse.json({ id, status: "failed", error: "Generation failed" });
    }

    return NextResponse.json({ id, status: "generating", falStatus: statusData.status });
  } catch (e: any) {
    console.error("[status] Exception:", e.message);
    return NextResponse.json({ id, status: "generating" });
  }
}