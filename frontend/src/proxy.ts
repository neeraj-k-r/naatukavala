import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getShopSlugFromHost } from "@/lib/subdomain";

/**
 * Runs before every matched request:
 * 1. Refreshes the Supabase session cookie (validates via getUser so expired
 *    tokens are rotated and stale cookies never linger after logout/signup).
 * 2. Rewrites `<slug>.<app-domain>/` to the internal `/_sites/<slug>` route.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey && hasAuthCookies(request)) {
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // getUser() validates with the Supabase server and refreshes the session
    // when needed. Never use getSession() here — it only reads cookies.
    await supabase.auth.getUser();
  }

  const host = request.headers.get("host");
  const slug = getShopSlugFromHost(host);

  if (slug && request.nextUrl.pathname === "/") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/_sites/${slug}`;
    const rewritten = NextResponse.rewrite(rewriteUrl, { request });
    // Carry any refreshed auth cookies onto the rewrite response.
    response.cookies.getAll().forEach((cookie) => {
      rewritten.cookies.set(cookie.name, cookie.value);
    });
    return rewritten;
  }

  return response;
}

/**
 * Supabase SSR stores the session in `sb-<project-ref>-auth-token*`
 * cookies. With none present there is no session to validate or refresh,
 * so the network roundtrip is skipped entirely (logged-out page loads).
 */
function hasAuthCookies(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
