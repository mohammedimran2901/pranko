/**
 * GET /api/status?id=<jobId>
 * Returns the current status of a prank job.
 * Used by the generating page to poll for completion.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  const job = store.getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: job.id,
    status: job.status,
    shareToken: job.status === "completed" ? job.shareToken : undefined,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
}