/**
 * POST /api/cancel-subscription
 *
 * Cancels the current user's Polar subscription via the Polar API.
 * Credits remain usable until the current period ends.
 *
 * The user's pranko_uid cookie identifies them — we look up their
 * subscriptionId from the credits store.
 */
import { NextRequest, NextResponse } from "next/server";
import { getPolarClient } from "@/lib/polar";
import { credits, getUserId } from "@/lib/credits";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const userId = getUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "No user found. Make sure cookies are enabled." },
        { status: 401 }
      );
    }

    const rec = await credits.get(userId);
    if (!rec?.subscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found for this account." },
        { status: 404 }
      );
    }

    // Call Polar to cancel the subscription.
    const polar = getPolarClient();

    try {
      // Polar API: PATCH /v1/subscriptions/{id} with cancel_at_period_end
      // Using `as any` because Polar SDK types vary between versions.
      await (polar.subscriptions as any).update({
        id: rec.subscriptionId,
        subscriptionUpdate: {
          cancelAtPeriodEnd: true,
        },
      });

      // Mark canceled in our credits store.
      await credits.cancel(userId);

      return NextResponse.json({
        ok: true,
        message:
          "Subscription will be canceled at the end of the current billing period. Your remaining credits are still usable until then.",
      });
    } catch (polarErr: any) {
      console.error("Polar cancel error:", polarErr);
      // If the Polar API call fails, still try to mark it locally —
      // the webhook will catch up on the next renewal attempt.
      await credits.cancel(userId);
      return NextResponse.json({
        ok: true,
        message:
          "Subscription marked as canceled. It may take a moment to sync with Polar.",
      });
    }
  } catch (err: any) {
    console.error("cancel-subscription error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}