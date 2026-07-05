/**
 * POST /api/job-complete
 * Called by the browser's generating page after polling fal.ai directly
 * and finding the video URL.  Persists the result to Supabase so share
 * links work.
 *
 * Body: { jobId: string, videoUrl: string }
 * Returns: { success: true, shareToken: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jobId, videoUrl } = body as { jobId?: string; videoUrl?: string };

    if (!jobId || !videoUrl) {
      return NextResponse.json({ error: "Missing jobId or videoUrl" }, { status: 400 });
    }

    const job = await store.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    await store.updateJob(job.id, {
      status: "completed",
      resultVideoUrl: videoUrl,
      completedAt: Date.now(),
    });

    return NextResponse.json({ success: true, shareToken: job.shareToken });
  } catch (e: any) {
    console.error("job-complete error:", e);
    return NextResponse.json({ error: e.message || "Internal server error" }, { status: 500 });
  }
}