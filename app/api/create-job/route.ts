/**
 * POST /api/create-job
 * Uploads image to fal.ai, submits video generation, returns request_id.
 * The client polls /api/status with this request_id to check fal.ai directly.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { uploadImage, submitVideoGeneration } from "@/lib/fal";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute max for upload + submit

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, prompt, locale } = body as {
      image?: string;
      prompt?: string;
      locale?: string;
    };

    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing image or prompt" }, { status: 400 });
    }

    if (prompt.length > 1000) {
      return NextResponse.json({ error: "Prompt too long (max 1000 characters)" }, { status: 400 });
    }

    // Step 1: Upload image to fal.ai
    const uploadedImageUrl = await uploadImage(image);

    // Step 2: Submit video generation to fal.ai
    const requestId = await submitVideoGeneration(prompt, uploadedImageUrl);

    // Step 3: Store the job with the fal request_id so /api/status can find it
    const job = store.createJob({
      prompt,
      locale: locale || "en",
      falRequestId: requestId,
      uploadedImageUrl,
    });

    return NextResponse.json({ jobId: job.id, falRequestId: requestId }, { status: 201 });
  } catch (error: any) {
    console.error("create-job error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}