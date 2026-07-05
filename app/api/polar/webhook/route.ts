/**
 * POST /api/polar/webhook
 *
 * Polar webhook receiver. Grants credits for both:
 *   - Single $1.99 purchase (1 credit via checkout.updated)
 *   - Weekly $4.99 subscription (6 credits via subscription.*)
 *
 * Configure in Polar: https://<domain>/api/polar/webhook
 * Subscribe to: subscription.created, subscription.active,
 *   subscription.updated, subscription.canceled, subscription.revoked,
 *   checkout.updated.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyPolarWebhook } from "@/lib/polar";
import { credits, WEEKLY_CREDITS } from "@/lib/credits";
import { subscriptionMap } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function userIdFromSubscription(sub: any): string | null {
  return (
    sub?.metadata?.userId ||
    sub?.customer?.external_id ||
    sub?.customer_external_id ||
    sub?.customer?.metadata?.userId ||
    null
  );
}

function emailFromSubscription(sub: any): string | undefined {
  return sub?.customer?.email || sub?.customer_email || undefined;
}

function periodEndFromSubscription(sub: any): number | undefined {
  const raw = sub?.current_period_end || sub?.currentPeriodEnd;
  if (!raw) return undefined;
  const ms = typeof raw === "number" ? raw * 1000 : Date.parse(raw);
  return Number.isFinite(ms) ? ms : undefined;
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  let event: { type: string; data: any };
  try {
    event = verifyPolarWebhook({
      body,
      headers: {
        "webhook-id": req.headers.get("webhook-id") || undefined,
        "webhook-timestamp": req.headers.get("webhook-timestamp") || undefined,
        "webhook-signature": req.headers.get("webhook-signature") || undefined,
      },
    });
  } catch (err: any) {
    console.error("polar webhook verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;
  console.log(`[polar webhook] ${type}`);

  try {
    switch (type) {
      // ── Weekly subscription: grant 6 credits ──────────────────
      case "subscription.created":
      case "subscription.active": {
        const userId = userIdFromSubscription(data);
        if (!userId) {
          console.warn(`${type}: no userId, skipping`);
          break;
        }
        const subId = data.id || data.subscription_id;
        if (subId) subscriptionMap.remember(subId, userId);
        await credits.refill(userId, {
          subscriptionId: subId,
          email: emailFromSubscription(data),
          periodEnd: periodEndFromSubscription(data),
        });
        break;
      }

      // ── Renewal: refill 6 credits ─────────────────────────────
      case "subscription.updated": {
        const userId = userIdFromSubscription(data);
        if (!userId) break;
        const subId = data.id || data.subscription_id;
        if (subId) subscriptionMap.remember(subId, userId);
        const status = data.status;
        if (!status || status === "active" || status === "trialing") {
          await credits.refill(userId, {
            subscriptionId: subId,
            email: emailFromSubscription(data),
            periodEnd: periodEndFromSubscription(data),
          });
        }
        break;
      }

      // ── Canceled (keep credits until period end) ──────────────
      case "subscription.canceled": {
        const userId =
          userIdFromSubscription(data) ||
          subscriptionMap.getUserId(data.id || data.subscription_id);
        if (!userId) break;
        await credits.cancel(userId);
        break;
      }

      // ── Revoked (immediate, zero credits) ─────────────────────
      case "subscription.revoked": {
        const userId =
          userIdFromSubscription(data) ||
          subscriptionMap.getUserId(data.id || data.subscription_id);
        if (!userId) break;
        await credits.set(userId, { credits: 0, canceled: true });
        break;
      }

      // ── Checkout completed: grant single OR weekly credits ────
      case "checkout.updated": {
        if (data?.status !== "succeeded") break;
        const userId =
          data?.metadata?.userId ||
          data?.customer_external_id ||
          data?.customer?.external_id;
        if (!userId) break;

        const plan: string =
          data?.metadata?.plan || data?.metadata?.product || "";
        const isSingle = plan === "single";

        if (isSingle) {
          // $1.99 one-time → grant 1 credit (non-renewing)
          const rec = await credits.get(userId);
          const newTotal = (rec?.credits ?? 0) + 1;
          await credits.set(userId, {
            credits: newTotal,
            email: emailFromSubscription(data) || rec?.email,
            subscriptionId: rec?.subscriptionId,
          });
        } else {
          // $4.99 weekly → backup grant (webhook subscription.created handles primary)
          const rec = await credits.get(userId);
          if (!rec || rec.credits < WEEKLY_CREDITS) {
            await credits.refill(userId, {
              email: emailFromSubscription(data),
            });
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (err: any) {
    console.error(`polar webhook handler error (${type}):`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}