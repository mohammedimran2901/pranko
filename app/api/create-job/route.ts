/**
 * POST /api/create-job
 * Creates a prank generation job.
 * Body: { image (base64 data URI), prompt, templateId, mode, locale, tier }
 * Returns: { jobId }
 */
import { NextRequest, NextResponse } from "next/server";
import { store, type Tier } from "@/lib/store";
import { uploadToFal, submitGeneration, pollForResult } from "@/lib/fal";
import { applyWatermark } from "@/lib/watermark";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for image generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image, prompt, templateId, mode, locale, tier } = body as {
      image?: string;
      prompt?: string;
      templateId?: string | null;
      mode?: string;
      locale?: string;
      tier?: Tier;
    };

    if (!image || !prompt) {
      return NextResponse.json(
        { error: "Missing image or prompt" },
        { status: 400 }
      );
    }

    // Create the job
    const job = store.createJob({
      prompt,
      templateId: templateId || null,
      mode: mode || "custom",
      locale: locale || "en",
      tier: tier || "free",
      paid: tier !== "free",
    });

    // Start the generation pipeline in the background
    runGenerationPipeline(job.id, image, prompt, tier || "free").catch((err) => {
      console.error(`Generation pipeline failed for job ${job.id}:`, err);
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

async function runGenerationPipeline(
  jobId: string,
  base64Image: string,
  prompt: string,
  tier: Tier
) {
  // Step 1: Upload image to fal.ai
  store.updateJob(jobId, { status: "uploading" });
  const uploadedImageUrl = await uploadToFal(base64Image);
  store.updateJob(jobId, { uploadedImageUrl });

  // Step 2: Submit generation
  store.updateJob(jobId, { status: "generating" });
  const requestId = await submitGeneration(prompt, uploadedImageUrl);

  // Step 3: Poll for result
  const resultImageUrl = await pollForResult(requestId);

  if (!resultImageUrl) {
    throw new Error("No result image returned from fal.ai");
  }

  // Step 4: Apply watermark for free tier
  let finalImageUrl = resultImageUrl;
  let watermarked = false;

  if (tier === "free") {
    try {
      const watermarkedBuffer = await applyWatermark(resultImageUrl);
      // Upload watermarked image back to fal storage or use data URI
      // For simplicity, we'll use the original URL for paid and a data URI for free
      const dataUri = `data:image/png;base64,${watermarkedBuffer.toString("base64")}`;
      finalImageUrl = dataUri;
      watermarked = true;
    } catch (err) {
      console.error("Watermark failed, using original:", err);
      // Fall back to original image
    }
  }

  // Step 5: Mark as completed
  store.updateJob(jobId, {
    status: "completed",
    resultImageUrl: finalImageUrl,
    watermarked,
    completedAt: Date.now(),
  });
}