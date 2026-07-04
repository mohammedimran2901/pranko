# Pranko · Polar payments setup

This document walks you through wiring Pranko up to Polar in 5 minutes
flat. Do this once before deploying to production.

## Why Polar

- **Merchant of record** — Polar handles tax, VAT, invoicing, dunning.
- **Built-in subscriptions** — no Stripe customer objects, no "trial
  ended" emails to write yourself.
- **Standard webhooks** — signed with `webhook-id` / `webhook-signature`
  headers. We verify with `@polar-sh/sdk/webhooks`.
- **Apple Pay / Google Pay / cards** out of the box.
- **Sandbox mode** — test the whole flow without real money.

## 1. Create the Polar product

1. Sign in at <https://polar.sh> and create an Organization.
2. Go to **Products → New product**.
3. Fill in:
   - **Name:** `Pranko Weekly`
   - **Description:** `6 prank video credits per week`
   - **Recurring price:** `$4.99 USD`, interval `week`
4. Save. Copy the product id (looks like `prod_01H…`) — this is
   `POLAR_WEEKLY_PRODUCT_ID`.

## 2. Get an access token

Polar Dashboard → **Settings → Developers → Access tokens** →
**Create token**. Pick the scopes your org needs (we use `checkouts:write`,
`subscriptions:read`, `subscriptions:write` at minimum).

Copy the token (`polar_oat_…`) — this is `POLAR_ACCESS_TOKEN`.

## 3. Wire the webhook

Polar Dashboard → **Settings → Developers → Webhooks → Add endpoint**.

- **URL:** `https://<your-domain>/api/polar/webhook`
- **Events to send:**
  - `subscription.created`
  - `subscription.active`
  - `subscription.updated`
  - `subscription.canceled`
  - `subscription.revoked`
  - `checkout.updated` (succeeded only)

Copy the **webhook secret** — this is `POLAR_WEBHOOK_SECRET`.

## 4. Fill in `.env.local`

```env
POLAR_ACCESS_TOKEN=polar_oat_…
POLAR_ORGANIZATION_ID=org_…
POLAR_WEEKLY_PRODUCT_ID=prod_…
POLAR_WEBHOOK_SECRET=whsec_…
POLAR_SERVER=sandbox        # or "production" when going live
```

`POLAR_ORGANIZATION_ID` is in the URL when you log into the Polar
dashboard (`polar.sh/<org-slug>`).

## 5. Test the flow

```bash
npm run dev
# 1. Open http://localhost:3000/create
# 2. Upload a photo + prompt
# 3. Click Generate → "Subscribe to generate" should appear
# 4. Click it → redirected to Polar sandbox checkout
# 5. Use card 4242 4242 4242 4242 (any future date, any CVC)
# 6. On success, redirected to /en/result/success
# 7. The success page should show "6 credits ready" within ~1 second
# 8. Click "Make my first prank" → video should generate
```

## 6. Going live

When you're ready to take real money:

1. Polar Dashboard → **Settings → Account** → complete payout details.
2. Flip `POLAR_SERVER=production` in your Vercel env.
3. Make sure your webhook endpoint points to the **production** domain.
4. Test one real $4.99 transaction with your own card, refund it, ship.

## Architecture notes

### Credit model

- 1 subscription = 6 credits, refreshed weekly.
- We **replace** the credit bucket on every refill (renewal or new sub)
  so unused credits don't pile up. If you want rollover, edit
  `refill()` in `lib/credits.ts` to do `existing + 6`.
- One credit = one video, decremented inside `/api/create-job` *before*
  we hit fal.ai. If the generation errors, the credit is refunded.

### Why we charge *before* generation

The original Pranko flow generated the video first, then put a paywall
in front of the result. That felt scammy: you did the work, then we
asked for money. The new flow is:

1. User uploads photo + prompt.
2. User clicks **Generate prank video**.
3. If 0 credits → bounced into Polar checkout.
4. If 1+ credit → we burn 1, run fal.ai, hand back the video.
5. The result page just plays it. No post-generation nag.

### File map

```
lib/
  polar.ts                 # Polar SDK client + webhook verification
  credits.ts               # in-memory credit store + cookie-based user id
  subscriptions.ts         # subscriptionId → userId lookup table
app/api/
  checkout/route.ts        # POST → creates a Polar checkout session
  polar/webhook/route.ts   # POST → receives subscription events
  create-job/route.ts      # POST → checks credits, runs fal.ai
  credits/route.ts         # GET  → returns the user's credit balance
app/[locale]/
  create/page.tsx          # upload + prompt; paywall banner when no credits
  pricing/page.tsx         # the one and only plan
  result/success/page.tsx  # post-checkout landing (polls for credits)
  result/view/page.tsx     # plays the generated video (no paywall)
```

### Swapping in Supabase for production scale

`lib/credits.ts` is a single Map. Replace `getOrCreateUserId` and the
`credits` store with Supabase queries — the public API is intentionally
narrow so the swap is one file.
