/**
 * Anonymous user identity and credit tracking for Pranko.
 *
 * Credits are persisted in Supabase so they survive server restarts,
 * cold starts, and deployments. The anonymous user id (pranko_uid) is
 * stored in an httpOnly cookie.
 *
 * Fallback: if Supabase env vars are missing, we fall back to an
 * in-memory store (useful for local dev without a Supabase project).
 */
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { getSupabase, CREDITS_TABLE } from "@/lib/supabase/server";

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

/**
 * Database row shape — maps to the `user_credits` table
 * defined in supabase/schema.sql.
 */
interface CreditsRow {
  user_id: string;
  credits: number;
  subscription_id: string | null;
  last_refilled_at: number | null;
  current_period_end: number | null;
  email: string | null;
  canceled: boolean;
}

function rowToCredits(row: CreditsRow): UserCredits {
  return {
    userId: row.user_id,
    credits: row.credits,
    subscriptionId: row.subscription_id ?? undefined,
    lastRefilledAt: row.last_refilled_at ?? undefined,
    currentPeriodEnd: row.current_period_end ?? undefined,
    email: row.email ?? undefined,
    canceled: row.canceled ?? false,
  };
}

// ── In-memory fallback (used when Supabase is not configured) ────────

class InMemoryCreditsStore {
  private byId: Map<string, UserCredits> = new Map();

  get(userId: string): UserCredits | undefined {
    return this.byId.get(userId);
  }

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

  refill(
    userId: string,
    opts: {
      subscriptionId?: string;
      email?: string;
      periodEnd?: number;
    } = {}
  ): UserCredits {
    return this.set(userId, {
      credits: WEEKLY_CREDITS,
      subscriptionId: opts.subscriptionId,
      email: opts.email,
      currentPeriodEnd: opts.periodEnd,
      lastRefilledAt: Date.now(),
      canceled: false,
    });
  }

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

// ── Supabase-backed store ────────────────────────────────────────────

function hasSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

class SupabaseCreditsStore {
  async get(userId: string): Promise<UserCredits | undefined> {
    try {
      const sb = getSupabase();
      const { data } = await sb
        .from(CREDITS_TABLE)
        .select("*")
        .eq("user_id", userId)
        .single();
      if (!data) return undefined;
      return rowToCredits(data as CreditsRow);
    } catch {
      // Table may not exist yet, or Supabase unreachable.
      return undefined;
    }
  }

  async ensure(userId: string): Promise<UserCredits> {
    const existing = await this.get(userId);
    if (existing) return existing;
    const rec: UserCredits = { userId, credits: 0 };
    try {
      const sb = getSupabase();
      await sb.from(CREDITS_TABLE).upsert({
        user_id: userId,
        credits: 0,
        canceled: false,
      });
    } catch {
      // Fall through — caller gets the in-memory object.
    }
    return rec;
  }

  async set(
    userId: string,
    patch: Partial<UserCredits>
  ): Promise<UserCredits> {
    const existing = await this.ensure(userId);
    const updated: UserCredits = { ...existing, ...patch };
    try {
      const sb = getSupabase();
      const row: CreditsRow = {
        user_id: userId,
        credits: updated.credits,
        subscription_id: updated.subscriptionId ?? null,
        last_refilled_at: updated.lastRefilledAt ?? null,
        current_period_end: updated.currentPeriodEnd ?? null,
        email: updated.email ?? null,
        canceled: updated.canceled ?? false,
      };
      await sb.from(CREDITS_TABLE).upsert(row);
    } catch (err) {
      console.error("credits.set upsert failed:", err);
    }
    return updated;
  }

  async refill(
    userId: string,
    opts: {
      subscriptionId?: string;
      email?: string;
      periodEnd?: number;
    } = {}
  ): Promise<UserCredits> {
    return this.set(userId, {
      credits: WEEKLY_CREDITS,
      subscriptionId: opts.subscriptionId,
      email: opts.email,
      currentPeriodEnd: opts.periodEnd,
      lastRefilledAt: Date.now(),
      canceled: false,
    });
  }

  async consume(userId: string): Promise<number | null> {
    // Use an atomic decrement to avoid race conditions.
    try {
      const sb = getSupabase();
      const { data, error } = await sb
        .rpc("consume_credit", { p_user_id: userId });
      if (error) {
        // RPC may not exist (first deploy). Fall back to read-then-write.
        const rec = await this.get(userId);
        if (!rec || rec.credits <= 0) return null;
        const next = rec.credits - 1;
        await this.set(userId, { credits: next });
        return next;
      }
      // consume_credit returns the new balance or null if no credits.
      return (data as any)?.new_balance ?? null;
    } catch {
      // Fallback: read-modify-write (non-atomic but works for low traffic).
      const rec = await this.get(userId);
      if (!rec || rec.credits <= 0) return null;
      const next = rec.credits - 1;
      await this.set(userId, { credits: next });
      return next;
    }
  }

  async cancel(userId: string): Promise<void> {
    await this.set(userId, { canceled: true });
  }
}

// ── Unified public API ───────────────────────────────────────────────

const inMemory = new InMemoryCreditsStore();
const supabaseStore = new SupabaseCreditsStore();

function useSupabase(): boolean {
  return hasSupabaseConfig();
}

export const credits = {
  get(userId: string): Promise<UserCredits | undefined> {
    if (useSupabase()) return supabaseStore.get(userId);
    return Promise.resolve(inMemory.get(userId));
  },

  ensure(userId: string): Promise<UserCredits> {
    if (useSupabase()) return supabaseStore.ensure(userId);
    return Promise.resolve(inMemory.ensure(userId));
  },

  set(
    userId: string,
    patch: Partial<UserCredits>
  ): Promise<UserCredits> {
    if (useSupabase()) return supabaseStore.set(userId, patch);
    return Promise.resolve(inMemory.set(userId, patch));
  },

  refill(
    userId: string,
    opts?: {
      subscriptionId?: string;
      email?: string;
      periodEnd?: number;
    }
  ): Promise<UserCredits> {
    if (useSupabase()) return supabaseStore.refill(userId, opts);
    return Promise.resolve(inMemory.refill(userId, opts));
  },

  consume(userId: string): Promise<number | null> {
    if (useSupabase()) return supabaseStore.consume(userId);
    return Promise.resolve(inMemory.consume(userId));
  },

  cancel(userId: string): Promise<void> {
    if (useSupabase()) return supabaseStore.cancel(userId);
    return Promise.resolve(inMemory.cancel(userId));
  },
};

// ── Cookie helpers ───────────────────────────────────────────────────

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