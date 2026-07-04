/**
 * Polar payments client for Pranko.
 * Handles checkout session creation, webhook signature verification, and
 * product/price lookups for the 6-credit weekly subscription.
 */
import { Polar } from "@polar-sh/sdk";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || "";
const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID || "";
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || "";
const POLAR_SERVER = (process.env.POLAR_SERVER || "sandbox") as
  | "sandbox"
  | "production";

/** Weekly subscription product in Polar (one product, $4.99/week, 6 credits). */
export const PRANKO_WEEKLY_PRODUCT_ID =
  process.env.POLAR_WEEKLY_PRODUCT_ID || "";

let _client: Polar | null = null;

export function getPolarClient(): Polar {
  if (!POLAR_ACCESS_TOKEN) {
    throw new Error(
      "POLAR_ACCESS_TOKEN is not configured. Add it to .env (Polar Settings → Developers → Tokens)."
    );
  }
  if (!_client) {
    _client = new Polar({
      accessToken: POLAR_ACCESS_TOKEN,
      server: POLAR_SERVER,
    });
  }
  return _client;
}

export interface CheckoutInput {
  /** Locale-aware success URL. Polar will append ?checkout_id=<id>. */
  successUrl: string;
  /** Locale-aware cancel URL. */
  cancelUrl: string;
  /** Optional pre-existing Polar customer id (e.g. returning subscriber). */
  customerId?: string;
  /** Free-form metadata forwarded to the webhook. */
  metadata?: Record<string, string>;
  /** External customer id (our own anonymous id) — Polar will reuse / create. */
  externalCustomerId?: string;
  /** Customer email (optional convenience). */
  customerEmail?: string;
}

/**
 * Create a Polar checkout session for the weekly subscription.
 * Polar handles the hosted checkout page (card, Apple Pay, Google Pay, etc.)
 * and redirects back to `successUrl` on completion.
 */
export async function createWeeklyCheckout(
  input: CheckoutInput
): Promise<{ id: string; url: string }> {
  if (!PRANKO_WEEKLY_PRODUCT_ID) {
    throw new Error(
      "POLAR_WEEKLY_PRODUCT_ID is not configured. Create the product in Polar and put its id in .env."
    );
  }
  const polar = getPolarClient();
  const session = await polar.checkouts.create({
    products: [PRANKO_WEEKLY_PRODUCT_ID],
    successUrl: input.successUrl,
    customerEmail: input.customerEmail,
    externalCustomerId: input.externalCustomerId,
    metadata: {
      ...(input.metadata || {}),
      plan: "weekly",
      credits: "6",
    },
  });
  return { id: session.id, url: session.url };
}

/**
 * Verify a Polar webhook payload using the standard-webhooks library.
 * Returns the parsed event, or throws if verification fails.
 *
 * Polar webhook headers follow the Standard Webhooks spec:
 *   - `webhook-id`
 *   - `webhook-timestamp`
 *   - `webhook-signature`
 */
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

export type PolarEvent = {
  type: string;
  data: any;
};

export function verifyPolarWebhook({
  body,
  headers,
}: {
  body: string;
  headers: {
    "webhook-id"?: string;
    "webhook-timestamp"?: string;
    "webhook-signature"?: string;
  };
}): PolarEvent {
  if (!POLAR_WEBHOOK_SECRET) {
    throw new Error("POLAR_WEBHOOK_SECRET is not configured");
  }
  try {
    const event = validateEvent(body, headers, POLAR_WEBHOOK_SECRET);
    return event as unknown as PolarEvent;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      throw new Error("Invalid webhook signature");
    }
    throw err;
  }
}

export const POLAR_CONFIG = {
  organizationId: POLAR_ORGANIZATION_ID,
  server: POLAR_SERVER,
  weeklyProductId: PRANKO_WEEKLY_PRODUCT_ID,
};
