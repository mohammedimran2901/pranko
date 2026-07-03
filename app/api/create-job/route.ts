/**
 * POST /api/create-job
 * Creates a prank generation job.
 * Body (single-image mode):
 *   { image: base64, prompt, templateId, mode, locale, tier }
 * Body (merge mode — subject + scene):
 *   { subjectImage: base64, sceneImage: base64, prompt, templateId, mode, locale, tier, engine: "merge" }
 *   OR
 *   { image: base64, sceneImage: base64, ..., engine: "merge" }
 * Returns: { jobId }
 */
import { NextRequest, NextResponse } from "next/server";
import { store, type Tier, type PrankEngine } from "@/lib/store";
import {
  uploadToFal,
  submitGeneration,
  submitMergeGeneration,
  pollForResult,
} from "@/lib/fal";
import { applyWatermark } from "@/lib/watermark";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for image generation

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      image,
      subjectImage,
      sceneImage,
      prompt,
      templateId,
      mode,
      locale,
      tier,
      engine,
    } = body as {
      image?: string;
      subjectImage?: string;
      sceneImage?: string;
      prompt?: string;
      templateId?: string | null;
      mode?: string;
      locale?: string;
      tier?: Tier;
      engine?: PrankEngine;
    };

    // Decide which engine to use. Merge mode requires a scene image.
    const _hasSubject = Boolean(subjectImage || image);
    const _hasScene = Boolean(sceneImage);
    const isMerge: boolean = engine === "merge" || (_hasScene && _hasSubject);

    const finalSubject = subjectImage || image;
    const finalPrompt = prompt || "";

    if (!finalSubject || !finalPrompt) {
      return NextResponse.json(
        { error: "Missing subject image or prompt" },
        { status: 400 }
      );
    }
    if (isMerge && !sceneImage) {
      return NextResponse.json(
        { error: "Merge mode requires a scene image" },
        { status: 400 }
      );
    }

    // Create the job
    const job = store.createJob({
      prompt: finalPrompt,
      templateId: templateId || null,
      mode: mode || (isMerge ? "merge" : "custom"),
      locale: locale || "en",
      tier: tier || "free",
      paid: (tier || "free") !== "free",
      engine: isMerge ? "merge" : "pulid",
    });

    // Start the generation pipeline in the background
    runGenerationPipeline(
      job.id,
      finalSubject,
      isMerge ? sceneImage! : undefined,
      finalPrompt,
      tier || "free",
      isMerge
    ).catch((err) => {
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
  base64Subject: string,
  base64Scene: string | undefined,
  prompt: string,
  tier: Tier,
  isMerge: boolean
) {
  // Step 1: Upload subject image to fal.ai
  store.updateJob(jobId, { status: "uploading" });
  const subjectUrl = await uploadToFal(base64Subject);
  store.updateJob(jobId, { uploadedImageUrl: subjectUrl });

  let sceneUrl: string | undefined;
  if (isMerge && base64Scene) {
    sceneUrl = await uploadToFal(base64Scene);
    store.updateJob(jobId, { sceneImageUrl: sceneUrl });
  }

  // Step 2: Submit generation
  store.updateJob(jobId, { status: "generating" });
  const requestId = isMerge
    ? await submitMergeGeneration(prompt, subjectUrl, sceneUrl!)
    : await submitGeneration(prompt, subjectUrl);

  // Step 3: Poll for result
  const resultImageUrl = await pollForResult(requestId, isMerge ? "merge" : "pulid");

  if (!resultImageUrl) {
    throw new Error("No result image returned from fal.ai");
  }

  // Step 4: Apply watermark for free tier
  let finalImageUrl = resultImageUrl;
  let watermarked = false;

  if (tier === "free") {
    try {
      const watermarkedBuffer = await applyWatermark(resultImageUrl);
      const dataUri = `data:image/png;base64,${watermarkedBuffer.toString("base64")}`;
      finalImageUrl = dataUri;
      watermarked = true;
    } catch (err) {
      console.error("Watermark failed, using original:", err);
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
