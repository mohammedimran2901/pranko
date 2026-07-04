/**
 * Anonymous user identity and credit tracking for Pranko.
 *
 * For launch we use cookie-based anonymous ids (no signup required) and
 * an in-memory store keyed by that id. Polar webhooks grant/refresh the
 * 6 weekly credits; create-job decrements one per generation.
 *
 * In production, swap the in-memory map for Supabase / Postgres. The
 * public API is intentionally narrow so the swap is one file.
 */
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export const USER_COOKIE = "pranko_uid";
export const WEEKLY_CREDITS = 6;

/** Per-user subscription state. */
export interface UserCredits {
  userId: string;
  credits: number;
  /** Polar subscription id, if any. */
  subscriptionId?: string;
  /** ISO timestamp when credits were last refreshed (for renewals). */
  lastRefilledAt?: number;
  /** ISO timestamp of current period end (for renewals). */
  currentPeriodEnd?: number;
  /** Customer email captured by Polar. */
  email?: string;
  /** True if subscription is canceled (won't auto-renew). */
  canceled?: boolean;
}

class CreditsStore {
  private byId: Map<string, UserCredits> = new Map();

  get(userId: string): UserCredits | undefined {
    return this.byId.get(userId);
  }

  /** Get or initialize a credits record for a user. */
  ensure(userId: string): UserCredits {
    let rec = this.byId.get(userId);
    if (!rec) {
      rec = { userId, credits: 0 };
      this.byId.set(userId, rec);
    }
    return rec;
  }

  set(userId: string, patch: Partial<UserCredits>): UserCredits {
    const rec = this.ensure(userId);
    const updated = { ...rec, ...patch };
    this.byId.set(userId, updated);
    return updated;
  }

  /**
   * Grant the weekly 6-credit bundle to a user. Used on subscription
   * creation, on renewal, and on resubscription. We do NOT add to
   * the existing balance — we refill the bucket — so unused credits
   * do not pile up indefinitely.
   */
  refill(userId: string, opts: { subscriptionId?: string; email?: string; periodEnd?: number } = {}): UserCredits {
    return this.set(userId, {
      credits: WEEKLY_CREDITS,
      subscriptionId: opts.subscriptionId,
      email: opts.email,
      currentPeriodEnd: opts.periodEnd,
      lastRefilledAt: Date.now(),
      canceled: false,
    });
  }

  /**
   * Decrement one credit. Returns the new balance, or `null` if the user
   * has no credits (caller should redirect to checkout).
   */
  consume(userId: string): number | null {
    const rec = this.get(userId);
    if (!rec) return null;
    if (rec.credits <= 0) return null;
    const next = rec.credits - 1;
    this.byId.set(userId, { ...rec, credits: next });
    return next;
  }

  cancel(userId: string): void {
    const rec = this.get(userId);
    if (!rec) return;
    this.byId.set(userId, { ...rec, canceled: true });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __prankoCredits: CreditsStore | undefined;
}

export const credits: CreditsStore =
  globalThis.__prankoCredits ??
  (globalThis.__prankoCredits = new CreditsStore());

/** Read or create an anonymous user id from the request cookies. */
export function getOrCreateUserId(): string {
  const jar = cookies();
  const existing = jar.get(USER_COOKIE)?.value;
  if (existing && existing.length >= 8) return existing;
  const fresh = nanoid(24);
  jar.set(USER_COOKIE, fresh, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return fresh;
}

/** Read an existing user id (or null) without creating one. */
export function getUserId(): string | null {
  return cookies().get(USER_COOKIE)?.value || null;
}

/** Server-side helper: get a user's credit balance, or 0 if anonymous. */
export function getCreditBalance(): { userId: string; credits: number } {
  const userId = getUserId();
  if (!userId) return { userId: "", credits: 0 };
  const rec = credits.get(userId);
  return { userId, credits: rec?.credits ?? 0 };
}
