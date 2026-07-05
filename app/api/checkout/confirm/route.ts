/**
 * POST /api/checkout/confirm
 *
 * Proactively confirms a Polar checkout and grants credits immediately.
 * This solves the race condition where the success page loads before the
 * webhook fires — the user would see "0 credits ready" after paying.
 *
 * Body: { checkoutId: string }
 * Returns: { credits, subscriptionActive, ... }
 */
import { NextRequest, NextResponse } from "next/server";
import { getPolarClient } from "@/lib/polar";
import { credits, getOrCreateUserId } from "@/lib/credits";
import { subscriptionMap } from "@/lib/subscriptions";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { checkoutId } = (await req.json()) as { checkoutId?: string };
    if (!checkoutId) {
      return NextResponse.json({ error: "Missing checkoutId" }, { status: 400 });
    }

    const userId = getOrCreateUserId();

    // 1. Look up the Polar checkout session.
    const polar = getPolarClient();
    // Use `as any` because the Polar SDK typings for this method are complex
    const session = await (polar.checkouts as any).get({ id: checkoutId });

    // 2. Extract userId from checkout metadata (we put it there in createWeeklyCheckout).
    const checkoutUserId =
      (session.metadata?.userId as string | undefined) ||
      session.externalCustomerId ||
      null;

    // 3. Only grant credits if the checkout was paid/confirmed.
    //    Polar Checkout status: "confirmed" means payment succeeded.
    if (session.status === "confirmed" || session.status === "succeeded") {
      // Prefer the userId that was attached to the checkout, since the
      // current cookie user may differ (cleared cookies, different browser, etc.)
      const targetUserId = checkoutUserId || userId;

      // Store the subscription id if Polar has created one.
      const subscriptionId = session.subscriptionId as string | undefined;
      if (subscriptionId) {
        subscriptionMap.remember(subscriptionId, targetUserId);
      }

      // Grant credits (re-fill to 6 if not already done by webhook).
      const rec = await credits.get(targetUserId);
      if (!rec || rec.credits < 6) {
        await credits.refill(targetUserId, {
          subscriptionId,
          email: (session.customerEmail as string) || rec?.email,
        });
      }

      const updated = await credits.get(targetUserId);
      return NextResponse.json({
        confirmed: true,
        userId: targetUserId,
        credits: updated?.credits ?? 6,
        subscriptionActive: Boolean(
          updated?.subscriptionId && !updated?.canceled
        ),
        subscriptionId: updated?.subscriptionId,
      });
    }

    // 4. Checkout not yet confirmed — payment may still be processing.
    //    Return the current status so the UI can retry.
    return NextResponse.json({
      confirmed: false,
      status: session.status,
      userId,
      credits: 0,
      subscriptionActive: false,
    });
  } catch (err: any) {
    console.error("checkout/confirm error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to confirm checkout" },
      { status: 500 }
    );
  }
}