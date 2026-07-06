/**
 * GET /api/admin/grant?secret=...
 *
 * Grants 6 credits to the current cookie user. Protected by a shared
 * secret query parameter. Useful for:
 *   1. Backfilling credits for a user who subscribed before Supabase was wired up.
 *   2. Testing the full flow in production without paying again.
 *
 * Usage:
 *   1. Set ADMIN_SECRET in .env.local to a random string (e.g. openssl rand -hex 16).
 *   2. Visit https://pranko.app/api/admin/grant?secret=<ADMIN_SECRET>
 *   3. Your browser's pranko_uid cookie gets 6 credits immediately.
 */
import { NextRequest, NextResponse } from "next/server";
import { credits, getUserId, getOrCreateUserId, WEEKLY_CREDITS } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_SECRET;

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_SECRET is not set. Add it to .env.local." },
      { status: 500 }
    );
  }

  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== ADMIN_SECRET) {
    return NextResponse.json(
      { error: "Invalid or missing secret." },
      { status: 403 }
    );
  }

  // ── Optional: target a specific user ────────────────────────────
  const targetUserId = req.nextUrl.searchParams.get("userId") || undefined;
  const userId = targetUserId || getOrCreateUserId();

  // ── Grant ───────────────────────────────────────────────────────
  if (targetUserId) {
    // Granting to a specific user (no cookie needed).
    await credits.refill(userId);
  } else {
    // Granting to the current cookie user.
    await credits.refill(userId);
  }

  const rec = await credits.get(userId);

  return NextResponse.json({
    ok: true,
    userId,
    credits: rec?.credits ?? WEEKLY_CREDITS,
    subscriptionActive: Boolean(rec?.subscriptionId && !rec?.canceled),
    note:
      "10 credits granted. Now visit /create to make a prank video.",
  });
}