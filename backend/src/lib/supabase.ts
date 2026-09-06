import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.js";

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let admin: ReturnType<typeof createClient<Database>>;

export function getSupabaseAdmin() {
  if (!admin) {
    admin = createClient<Database>(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return admin;
}
