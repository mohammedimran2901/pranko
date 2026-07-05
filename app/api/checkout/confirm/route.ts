/**
 * POST /api/checkout/confirm
 *
 * Proactively confirms a Polar checkout and grants credits immediately.
 * - Single ($1.99): grants 1 credit
 * - Weekly ($4.99): grants 6 credits
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

    const polar = getPolarClient();
    const session = await (polar.checkouts as any).get({ id: checkoutId });

    const checkoutUserId =
      (session.metadata?.userId as string | undefined) ||
      session.externalCustomerId ||
      null;

    if (session.status === "confirmed" || session.status === "succeeded") {
      const targetUserId = checkoutUserId || userId;

      const subscriptionId = session.subscriptionId as string | undefined;
      if (subscriptionId) {
        subscriptionMap.remember(subscriptionId, targetUserId);
      }

      // Detect plan type from checkout metadata
      const plan: string =
        (session.metadata?.plan as string) ||
        (session.metadata?.product as string) ||
        "weekly"; // default to weekly for backward compat
      const isSingle = plan === "single";
      const creditAmount = isSingle ? 1 : 6;

      const rec = await credits.get(targetUserId);
      const currentCredits = rec?.credits ?? 0;

      if (isSingle) {
        // One-time: add 1 credit to whatever they already have
        await credits.set(targetUserId, {
          credits: currentCredits + 1,
          email: (session.customerEmail as string) || rec?.email,
          subscriptionId: subscriptionId || rec?.subscriptionId,
        });
      } else {
        // Weekly: refill to 6 (don't stack unused credits)
        if (currentCredits < creditAmount) {
          await credits.set(targetUserId, {
            credits: creditAmount,
            subscriptionId,
            email: (session.customerEmail as string) || rec?.email,
            lastRefilledAt: Date.now(),
            canceled: false,
          });
        }
      }

      const updated = await credits.get(targetUserId);
      return NextResponse.json({
        confirmed: true,
        userId: targetUserId,
        credits: updated?.credits ?? creditAmount,
        subscriptionActive: Boolean(updated?.subscriptionId && !updated?.canceled),
        subscriptionId: updated?.subscriptionId,
      });
    }

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