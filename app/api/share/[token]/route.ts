/**
 * GET /api/share/[token]
 * Returns job data for a given share token.
 * Reads from Supabase so share links survive Vercel cold starts.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  if (!token) {
    return NextResponse.json({ error: "Missing share token" }, { status: 400 });
  }

  const job = await store.getJobByShareToken(token);

  if (!job) {
    return NextResponse.json({ error: "Prank not found" }, { status: 404 });
  }

  if (job.status !== "completed") {
    return NextResponse.json(
      { error: "Prank is still being generated" },
      { status: 202 }
    );
  }

  return NextResponse.json({
    id: job.id,
    shareToken: job.shareToken,
    status: job.status,
    resultVideoUrl: job.resultVideoUrl,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
}