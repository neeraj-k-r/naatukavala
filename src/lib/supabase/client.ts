import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Browser Supabase client for Client Components. */
export function createClient() {
  return createBrowserClient<Database>(url, anonKey);
}