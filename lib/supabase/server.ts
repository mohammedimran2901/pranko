/**
 * Supabase server client for Pranko.
 *
 * Used by credits store (and optionally job store) for persistent state.
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Add them to .env — see supabase/schema.sql for the table setup."
    );
  }

  // Use service_role key for server-side reads/writes to user_credits table.
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// Singleton warm across hot-reloads in development.
declare global {
  // eslint-disable-next-line no-var
  var __prankoSupabase: ReturnType<typeof getSupabaseClient> | undefined;
}

function getClient(): ReturnType<typeof getSupabaseClient> {
  if (globalThis.__prankoSupabase) return globalThis.__prankoSupabase;
  globalThis.__prankoSupabase = getSupabaseClient();
  return globalThis.__prankoSupabase;
}

/** Table constants — keep in sync with supabase/schema.sql. */
export const CREDITS_TABLE = "user_credits";

export { getClient as getSupabase };