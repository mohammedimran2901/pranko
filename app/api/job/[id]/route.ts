/**
 * GET /api/job/[id]
 * DELETE /api/job/[id]
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const job = await store.getJob(id);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({
    id: job.id,
    status: job.status,
    shareToken: job.shareToken,
    resultVideoUrl: job.resultVideoUrl,
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
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const deleted = await store.deleteJob(id);
  if (!deleted) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}