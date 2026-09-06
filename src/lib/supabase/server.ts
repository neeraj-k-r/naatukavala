import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "@/lib/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Server-side Supabase client bound to the incoming request cookies.
 * Used inside Server Components, Server Actions and Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const cookieDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Share the session cookie across shop subdomains via a shared domain.
            if (cookieDomain) {
              cookieStore.set(name, value, {
                ...options,
                domain: cookieDomain,
                // Cookies set with a domain may drop the Secure flag automatically;
                // keep it explicit for production HTTPS.
                secure:
                  options?.secure ??
                  process.env.NODE_ENV === "production",
              });
            } else {
              cookieStore.set(name, value, options);
            }
          });
        } catch {
          // Called from a Server Component. This is safe to ignore when
          // middleware is not refreshing sessions.
        }
      },
    },
  });
}