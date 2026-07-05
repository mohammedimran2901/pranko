/**
 * POST /api/checkout
 *
 * Creates a Polar checkout session for the Pranko weekly plan
 * (6 credits per week, $4.99/week) and returns the redirect URL.
 *
 * Body: { locale: "en" | "fr" | "es" }
 * Returns: { url: string, id: string }
 *
 * Flow:
 *   1. Read or create the anonymous user id (pranko_uid cookie).
 *   2. Ask Polar to create a checkout for the weekly product.
 *   3. On success → user is redirected to Polar's hosted checkout page.
 *   4. On completion → Polar redirects to /<locale>/result/success?checkout_id=...
 *   5. Polar also fires `subscription.created` → webhook grants 6 credits.
 */
import { NextRequest, NextResponse } from "next/server";
import { createCheckout, type CheckoutType, POLAR_CONFIG } from "@/lib/polar";
import { getOrCreateUserId } from "@/lib/credits";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      locale?: string;
      type?: CheckoutType;
    };
    const locale = ["en", "fr", "es"].includes(body.locale || "")
      ? (body.locale as string)
      : "en";
    const checkoutType: CheckoutType = body.type === "single" ? "single" : "weekly";

    const userId = getOrCreateUserId();

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin;
    const prefix = locale === "en" ? "" : `/${locale}`;

    const { url, id } = await createCheckout({
      type: checkoutType,
      successUrl: `${origin}${prefix}/result/success?checkout_id={CHECKOUT_ID}`,
      cancelUrl: `${origin}${prefix}/pricing`,
      externalCustomerId: userId,
      metadata: {
        userId,
        locale,
        product: checkoutType,
      },
    });

    return NextResponse.json({
      url,
      id,
      server: POLAR_CONFIG.server,
      type: checkoutType,
    });
  } catch (err: any) {
    console.error("checkout error:", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "Failed to create checkout. Make sure POLAR_ACCESS_TOKEN and product IDs are set.",
      },
      { status: 500 }
    );
  }
}
