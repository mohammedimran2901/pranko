/**
 * GET /api/auth/callback
 *
 * Supabase magic link callback. When a user clicks the link in their email,
 * Supabase redirects here with a `code` query param. We exchange it for a
 * session, then redirect the user back to where they came from.
 *
 * Query: ?code=...&returnTo=... (returnTo set by login page)
 */
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { credits, getUserId } from "@/lib/credits";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const returnTo = url.searchParams.get("returnTo") || "/en/account";

  if (!code) {
    return NextResponse.redirect(new URL("/en/login?error=no_code", req.url));
  }

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    // Supabase not configured — redirect without auth.
    return NextResponse.redirect(new URL(returnTo, req.url));
  }

  // Create a response that will set the auth cookies.
  const res = NextResponse.redirect(new URL(returnTo + "?signedIn=1", req.url));

  const supabase = createServerClient(baseUrl, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({
          name: c.name,
          value: c.value,
        }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          res.cookies.set(name, value, {
            ...options,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          });
        }
      },
    },
  });

  try {
    // Exchange the code for a session.
    await supabase.auth.exchangeCodeForSession(code);

    // ── Migrate anonymous credits to the authenticated user ───────
    const { data } = await supabase.auth.getUser();
    const authUserId = data.user?.id;
    if (authUserId) {
      const anonId = getUserId();
      if (anonId && anonId !== authUserId) {
        try {
          // Copy credits from anonymous id → authenticated id
          const anonCredits = await credits.get(anonId);
          if (anonCredits && anonCredits.credits > 0) {
            const authCredits = await credits.get(authUserId);
            // Only migrate if the auth user doesn't already have more credits.
            if (
              !authCredits ||
              authCredits.credits < anonCredits.credits
            ) {
              await credits.set(authUserId, {
                credits: anonCredits.credits,
                subscriptionId:
                  anonCredits.subscriptionId || authCredits?.subscriptionId,
                email: anonCredits.email || authCredits?.email,
                lastRefilledAt: anonCredits.lastRefilledAt,
                currentPeriodEnd: anonCredits.currentPeriodEnd,
                canceled: anonCredits.canceled,
              });
              // Zero out the anonymous credits to prevent double-spending.
              await credits.set(anonId, { credits: 0 });
            }
          }
        } catch (err) {
          console.error("credit migration error:", err);
          // Non-fatal — user can still use the app.
        }
      }
    }
  } catch (err) {
    console.error("auth callback error:", err);
    // Even if exchange fails, redirect the user — they can try again.
  }

  return res;
}