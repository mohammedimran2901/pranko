/**
 * POST /api/create-job
 * Creates a prank video generation job.
 * Body: { image (base64), prompt, locale }
 * Returns: { jobId }
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { uploadImage, submitVideoGeneration, pollForVideoResult } from "@/lib/fal";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for video generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, prompt, locale } = body as {
      image?: string;
      prompt?: string;
      locale?: string;
    };

    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }

    if (prompt.length > 1000) {
      return NextResponse.json(
        { error: "Prompt too long (max 1000 characters)" },
        { status: 400 }
      );
    }

    const job = store.createJob({
      prompt,
      locale: locale || "en",
    });

    // Start generation pipeline in background
    runPipeline(job.id, image, prompt).catch((err) => {
      console.error(`Pipeline failed for job ${job.id}:`, err);
      store.updateJob(job.id, {
        status: "failed",
        error: err.message || "Generation failed",
      });
    });

    return NextResponse.json({ jobId: job.id }, { status: 201 });
  } catch (error: any) {
    console.error("create-job error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

async function runPipeline(jobId: string, base64Image: string, prompt: string) {
  // Step 1: Upload image to fal.ai
  store.updateJob(jobId, { status: "uploading" });
  const uploadedImageUrl = await uploadImage(base64Image);
  store.updateJob(jobId, { uploadedImageUrl });

  // Step 2: Submit video generation
  store.updateJob(jobId, { status: "generating" });
  const requestId = await submitVideoGeneration(prompt, uploadedImageUrl);

  // Step 3: Poll for result
  const { videoUrl } = await pollForVideoResult(requestId);

  if (!videoUrl) {
    throw new Error("No result video returned from fal.ai");
  }

  // Step 4: Mark completed
  store.updateJob(jobId, {
    status: "completed",
    resultVideoUrl: videoUrl,
    completedAt: Date.now(),
  });
}