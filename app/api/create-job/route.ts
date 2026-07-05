/**
 * POST /api/create-job
 *
 * Creates a video generation job. **The user must have at least 1 credit
 * (from a Polar weekly subscription) before a job is started** — we do
 * not charge or burn credits here; that happens on `consume()` below.
 *
 * Body: { image: dataUri, prompt: string, locale: "en" | "fr" | "es" }
 * Returns:
 *   201 { jobId, falRequestId, creditsRemaining }
 *   402 { error: "no_credits", checkoutUrl }   ← redirect user to Polar
 *   400 { error }                              ← bad request
 *
 * Flow (this is what makes "video outputs after the payment gateway" real):
 *   1. create-job is called from /create when the user clicks Generate.
 *   2. We check credits. If 0, return 402 with a Polar checkout URL.
 *   3. If 1+, we consume one credit, upload the photo, submit fal.ai.
 *   4. The client polls /api/status and lands on the result page, which
 *      plays the video directly — no post-generation paywall.
 */
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { uploadImage, submitVideoGeneration } from "@/lib/fal";
import { credits, getOrCreateUserId } from "@/lib/credits";
import { createWeeklyCheckout } from "@/lib/polar";

export const runtime = "nodejs";
export const maxDuration = 60; // 1 minute for upload + submit

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

    // ── 1. Identify the user & check credits ─────────────────────
    const userId = getOrCreateUserId();
    const rec = await credits.get(userId);
    if (!rec || rec.credits <= 0) {
      // Build a checkout URL so the client can redirect immediately.
      const origin =
        req.headers.get("origin") ||
        process.env.NEXT_PUBLIC_APP_URL ||
        req.nextUrl.origin;
      const prefix = locale && locale !== "en" ? `/${locale}` : "";

      let checkoutUrl: string | undefined;
      try {
        const { url } = await createWeeklyCheckout({
          successUrl: `${origin}${prefix}/result/success?checkout_id={CHECKOUT_ID}`,
          cancelUrl: `${origin}${prefix}/pricing`,
          externalCustomerId: userId,
          metadata: { userId, locale: locale || "en", product: "weekly" },
        });
        checkoutUrl = url;
      } catch (e: any) {
        console.error("create-checkout on no_credits:", e);
        // Fall through and return a generic 402 without a URL.
      }

      return NextResponse.json(
        {
          error: "no_credits",
          message: "Subscribe to Pranko to generate prank videos.",
          checkoutUrl,
        },
        { status: 402 }
      );
    }

    // ── 2. Burn one credit BEFORE we touch fal.ai (refund on failure below) ─
    const remaining = await credits.consume(userId);
    if (remaining === null) {
      // Race — re-fetch the checkout URL.
      return NextResponse.json(
        { error: "no_credits", message: "Out of credits" },
        { status: 402 }
      );
    }

    try {
      // ── 3. Upload image to fal.ai ───────────────────────────────
      console.log("[create-job] Uploading image to fal.ai...");
      const uploadedImageUrl = await uploadImage(image);
      console.log("[create-job] Image uploaded:", uploadedImageUrl.substring(0, 80));

      // ── 4. Submit video generation ─────────────────────────────
      console.log("[create-job] Submitting video generation with prompt:", prompt.substring(0, 80));
      const { requestId, statusUrl, resultUrl } = await submitVideoGeneration(prompt, uploadedImageUrl);
      console.log("[create-job] fal.ai request_id:", requestId);

      // ── 5. Create our job record (persisted to Supabase) ────────
      const job = await store.createJob({
        prompt,
        locale: locale || "en",
        falRequestId: requestId,
        uploadedImageUrl,
        statusUrl,
        resultUrl,
      });

      return NextResponse.json(
        {
          jobId: job.id,
          falRequestId: requestId,
          shareToken: job.shareToken,
          creditsRemaining: remaining,
        },
        { status: 201 }
      );
    } catch (err: any) {
      // Refund the credit we just consumed — generation failed.
      console.error("create-job fal error, refunding credit:", err);
      await credits.set(userId, { credits: remaining + 1 });
      return NextResponse.json(
        { error: err.message || "Failed to start generation" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("create-job error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
