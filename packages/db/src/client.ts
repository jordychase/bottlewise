/**
 * Supabase client factory.
 *
 * Reads connection from env. The service role key is required for
 * adapter writes to source_records / source_runs / formulas — anon
 * key cannot bypass RLS on user-scoped tables, but the source layer
 * is server-only so we use service role.
 *
 * Required env:
 *   SUPABASE_URL              e.g. https://abcdefgh.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY service-role JWT (NEVER expose to client)
 *
 * For local Supabase: defaults work after `supabase start` populates
 * the env via `supabase status`.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });
  return cached;
}

export function hasSupabaseCredentials(): boolean {
  return !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export type { SupabaseClient };
