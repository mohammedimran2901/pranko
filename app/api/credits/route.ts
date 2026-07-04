/**
 * GET /api/credits
 *
 * Returns the current user's credit balance. Used by the /create page to
 * show "X credits left" and to decide whether to start generation or
 * redirect to Polar checkout.
 */
import { NextRequest, NextResponse } from "next/server";
import { credits, getUserId, WEEKLY_CREDITS } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({
      userId: null,
      credits: 0,
      weeklyCredits: WEEKLY_CREDITS,
      subscriptionActive: false,
    });
  }
  const rec = credits.get(userId);
  return NextResponse.json({
    userId,
    credits: rec?.credits ?? 0,
    weeklyCredits: WEEKLY_CREDITS,
    subscriptionActive: Boolean(rec?.subscriptionId && !rec?.canceled),
    subscriptionId: rec?.subscriptionId,
    canceled: rec?.canceled ?? false,
    currentPeriodEnd: rec?.currentPeriodEnd,
  });
}
