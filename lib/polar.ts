/**
 * Polar payments client for Pranko.
 * Handles checkout session creation, webhook verification, and
 * product/price lookups for two products:
 *   - Single: $1.99 / 1 credit (one-time)
 *   - Weekly: $4.99 / 6 credits (recurring)
 */
import { Polar } from "@polar-sh/sdk";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN || "";
const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID || "";
const POLAR_WEBHOOK_SECRET = process.env.POLAR_WEBHOOK_SECRET || "";
const POLAR_SERVER = (process.env.POLAR_SERVER || "sandbox") as
  | "sandbox"
  | "production";

/** Single one-time product ($1.99, 1 credit). */
export const PRANKO_SINGLE_PRODUCT_ID =
  process.env.POLAR_SINGLE_PRODUCT_ID || "";

/** Weekly subscription product ($4.99/week, 6 credits). */
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

export type CheckoutType = "single" | "weekly";

export interface CheckoutInput {
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  metadata?: Record<string, string>;
  externalCustomerId?: string;
  customerEmail?: string;
  /** "single" = one-time $1.99, "weekly" = recurring $4.99 */
  type: CheckoutType;
}

/**
 * Create a Polar checkout session for either a single video or weekly plan.
 */
export async function createCheckout(
  input: CheckoutInput
): Promise<{ id: string; url: string }> {
  const productId =
    input.type === "single"
      ? PRANKO_SINGLE_PRODUCT_ID
      : PRANKO_WEEKLY_PRODUCT_ID;

  if (!productId) {
    const name = input.type === "single" ? "POLAR_SINGLE_PRODUCT_ID" : "POLAR_WEEKLY_PRODUCT_ID";
    throw new Error(
      `${name} is not configured. Create the product in Polar and add its id to .env.`
    );
  }

  const polar = getPolarClient();
  const session = await polar.checkouts.create({
    products: [productId],
    successUrl: input.successUrl,
    customerEmail: input.customerEmail,
    externalCustomerId: input.externalCustomerId,
    metadata: {
      ...(input.metadata || {}),
      plan: input.type,
      credits: input.type === "single" ? "1" : "6",
    },
  });
  return { id: session.id, url: session.url };
}

/** Legacy wrapper for backward compatibility. */
export async function createWeeklyCheckout(
  input: Omit<CheckoutInput, "type">
): Promise<{ id: string; url: string }> {
  return createCheckout({ ...input, type: "weekly" });
}

/**
 * Create a checkout for a single video ($1.99 one-time).
 */
export async function createSingleCheckout(
  input: Omit<CheckoutInput, "type">
): Promise<{ id: string; url: string }> {
  return createCheckout({ ...input, type: "single" });
}

// ── Webhook verification ──────────────────────────────────────────

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
  singleProductId: PRANKO_SINGLE_PRODUCT_ID,
  weeklyProductId: PRANKO_WEEKLY_PRODUCT_ID,
};