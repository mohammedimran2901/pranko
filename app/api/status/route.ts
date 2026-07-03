/**
 * GET /api/status?id=<jobId>&fal=<falRequestId>
 * Polls fal.ai directly for video generation status.
 * This works across Vercel serverless invocations since
 * we check fal.ai's API, not our in-memory store.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

const FAL_BASE = "https://queue.fal.run";
const FAL_MODEL = "fal-ai/seedance-2/mini/reference-to-video";
const FAL_KEY = process.env.FAL_KEY || "";

function getHeaders(): Record<string, string> {
  return { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" };
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const falRequestId = req.nextUrl.searchParams.get("fal");

  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  // First check our in-memory store (works if same Lambda)
  const job = store.getJob(id);
  if (job?.status === "completed") {
    return NextResponse.json({
      id: job.id,
      status: "completed",
      shareToken: job.shareToken,
      resultVideoUrl: job.resultVideoUrl,
      completedAt: job.completedAt,
    });
  }

  if (job?.status === "failed") {
    return NextResponse.json({
      id: job.id,
      status: "failed",
      error: job.error,
    });
  }

  // If we have a fal request_id, poll fal.ai directly
  const falId = falRequestId || job?.falRequestId;
  if (falId) {
    try {
      const statusRes = await fetch(
        `${FAL_BASE}/${FAL_MODEL}/requests/${falId}/status`,
        { headers: getHeaders() }
      );

      if (statusRes.ok) {
        const statusData = await statusRes.json();

        if (statusData.status === "COMPLETED") {
          // Fetch the actual result
          const resultRes = await fetch(
            `${FAL_BASE}/${FAL_MODEL}/requests/${falId}`,
            { headers: getHeaders() }
          );

          if (resultRes.ok) {
            const resultData = await resultRes.json();
            const videoUrl = resultData.video?.url || "";

            if (videoUrl && job) {
              store.updateJob(job.id, {
                status: "completed",
                resultVideoUrl: videoUrl,
                completedAt: Date.now(),
              });
            }

            return NextResponse.json({
              id,
              status: "completed",
              shareToken: job?.shareToken,
              resultVideoUrl: videoUrl,
            });
          }
        }

        if (statusData.status === "FAILED" || statusData.status === "ERROR") {
          if (job) {
            store.updateJob(job.id, { status: "failed", error: "Fal generation failed" });
          }
          return NextResponse.json({ id, status: "failed", error: "Generation failed" });
        }

        // Still in progress
        return NextResponse.json({ id, status: "generating" });
      }
    } catch (e) {
      // Network error, fall through
    }
  }

  // Job not found in store and no fal id — return generating
  return NextResponse.json({ id, status: "generating" });
}