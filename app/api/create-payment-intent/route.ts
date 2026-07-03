/**
 * POST /api/create-payment-intent
 * Creates a Stripe PaymentIntent for prank purchases.
 * Body: { tier: "single" | "pack" | "pro" | "lifetime" }
 * Returns: { clientSecret }
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const PRICES: Record<string, number> = {
  single: 299,   // $2.99
  pack: 799,     // $7.99
  pro: 1999,     // $19.99/month
  lifetime: 4999 // $49.99 one-time
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tier } = body as { tier?: string };

    if (!tier || !PRICES[tier]) {
      return NextResponse.json(
        { error: "Invalid tier" },
        { status: 400 }
      );
    }

    const amount = PRICES[tier];
    const isSubscription = tier === "pro";

    let clientSecret: string;

    if (isSubscription) {
      // For subscription, create a setup intent or use billing portal
      // For MVP, we'll treat it as a payment intent with recurring billing
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          tier,
          type: "subscription",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      clientSecret = paymentIntent.client_secret || "";
    } else {
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          tier,
          type: "one_time",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      clientSecret = paymentIntent.client_secret || "";
    }

    return NextResponse.json({ clientSecret, tier, amount });
  } catch (error: any) {
    console.error("create-payment-intent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create payment intent" },
      { status: 500 }
    );
  }
}