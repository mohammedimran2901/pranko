/**
 * Server-side auth helpers for Pranko.
 *
 * Magic-link auth via Supabase. Users are identified by `supabase_user_id`.
 * The anonymous `pranko_uid` cookie is a fallback for non-authenticated users.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";

/**
 * Create a Supabase client that reads/writes cookies for session management.
 * Used in server components, route handlers, and middleware.
 */
export function createSupabaseServerClient() {
  const jar = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return jar.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, {
              ...options,
              // Next.js cookies() are read-only in certain contexts,
              // but this pattern works in middleware and route handlers.
            });
          }
        },
      },
    }
  );
}

/**
 * Get the currently authenticated Supabase user (or null).
 * Works in route handlers and server components.
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const sb = createSupabaseServerClient();
    const { data } = await sb.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the "effective" user id for credit lookups.
 * If authenticated, returns supabase user id. Otherwise returns the
 * anonymous cookie id (pranko_uid).
 */
import { getUserId } from "@/lib/credits";

export async function getEffectiveUserId(): Promise<{
  type: "authenticated" | "anonymous";
  userId: string;
}> {
  const user = await getCurrentUser();
  if (user) {
    return { type: "authenticated", userId: user.id };
  }
  const anonId = getUserId();
  if (anonId) {
    return { type: "anonymous", userId: anonId };
  }
  return { type: "anonymous", userId: "" };
}