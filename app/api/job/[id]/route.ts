/**
 * GET /api/job/[id]
 * Returns the job data for a given job id.
 * 
 * DELETE /api/job/[id]
 * Deletes a job (for cleanup/admin purposes).
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

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
    shareToken: job.shareToken,
    resultImageUrl: job.resultImageUrl,
    watermarked: job.watermarked,
    tier: job.tier,
    mode: job.mode,
    templateId: job.templateId,
    prompt: job.prompt,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }

  const deleted = store.deleteJob(id);

  if (!deleted) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}