/**
 * POST /api/polar/webhook
 *
 * Polar webhook receiver. We react to subscription lifecycle events to
 * grant / refresh / revoke the user's 6 weekly prank credits.
 *
 * Subscribed events (configured in Polar dashboard):
 *   - subscription.created       → first signup, grant 6 credits
 *   - subscription.active        → first paid invoice confirmed
 *   - subscription.updated       → renewal / plan change, refill 6 credits
 *   - subscription.canceled      → mark canceled (keep current credits)
 *   - subscription.revoked       → revoke all remaining credits
 *   - checkout.updated (status=succeeded) → backup grant
 *
 * Configure the webhook URL in Polar as:
 *   https://<your-domain>/api/polar/webhook
 * with secret taken from POLAR_WEBHOOK_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyPolarWebhook } from "@/lib/polar";
import { credits } from "@/lib/credits";
import { subscriptionMap } from "@/lib/subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Try several common shapes for the user id attached to a Polar subscription. */
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
  // Polar exposes `current_period_end` on subscription payloads.
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
      // ── New subscription ───────────────────────────────────────
      case "subscription.created":
      case "subscription.active": {
        const userId = userIdFromSubscription(data);
        if (!userId) {
          console.warn(`${type}: no userId on subscription, skipping`);
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

      // ── Renewal / plan change → refill credits ─────────────────
      case "subscription.updated": {
        const userId = userIdFromSubscription(data);
        if (!userId) break;
        const subId = data.id || data.subscription_id;
        if (subId) subscriptionMap.remember(subId, userId);
        // Only refill if status remains active.
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

      // ── Canceled (still active until period end) ───────────────
      case "subscription.canceled": {
        const userId =
          userIdFromSubscription(data) ||
          subscriptionMap.getUserId(data.id || data.subscription_id);
        if (!userId) break;
        await credits.cancel(userId);
        break;
      }

      // ── Revoked immediately ───────────────────────────────────
      case "subscription.revoked": {
        const userId =
          userIdFromSubscription(data) ||
          subscriptionMap.getUserId(data.id || data.subscription_id);
        if (!userId) break;
        await credits.set(userId, { credits: 0, canceled: true });
        break;
      }

      // ── Backup: checkout completed ─────────────────────────────
      case "checkout.updated": {
        if (data?.status !== "succeeded") break;
        const userId =
          data?.metadata?.userId ||
          data?.customer_external_id ||
          data?.customer?.external_id;
        if (!userId) break;
        // Will be re-confirmed by subscription.created, but in case
        // the user closes the success page before that fires, we
        // ensure they have at least one credit.
        const rec = await credits.get(userId);
        if (!rec || rec.credits < 6) {
          await credits.refill(userId, {
            email: emailFromSubscription(data),
          });
        }
        break;
      }

      default:
        // Ignore other events silently.
        break;
    }
  } catch (err: any) {
    console.error(`polar webhook handler error (${type}):`, err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
