/**
 * POST /api/create-payment-intent
 * Creates a Stripe Checkout Session for credit purchases.
 * Body: { tier: "weekly" }
 * Returns: { url } — redirect to Stripe Checkout
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

const PLANS: Record<string, { name: string; description: string; price: number; credits: number }> = {
  weekly: {
    name: "Pranko Weekly",
    description: "6 credits per week — 1 credit = 1 prank video. Cancel anytime.",
    price: 599, // $5.99
    credits: 6,
  },
};

export async function POST(req: NextRequest) {
  try {
    const { tier } = (await req.json()) as { tier?: string };

    if (!tier || !PLANS[tier]) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const plan = PLANS[tier];

    const origin = req.headers.get("origin") || req.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: plan.price,
            recurring: {
              interval: "week",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tier,
        credits: String(plan.credits),
      },
      success_url: `${origin}/en/result/success?credits=${plan.credits}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/en/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("create-payment-intent error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}