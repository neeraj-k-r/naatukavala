import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database";

let adminClient: SupabaseClient<Database> | null = null;

/**
 * Server-only Supabase client using the service role key.
 * Bypasses RLS — use ONLY in server-side code (Server Actions and Route
 * Handlers) after verifying the caller's role. Never import into a
 * Client Component or expose the key to the browser.
 */
export function getAdminClient(): SupabaseClient<Database> {
  if (adminClient) return adminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  adminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}