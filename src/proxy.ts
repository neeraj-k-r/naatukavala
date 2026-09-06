import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getShopSlugFromHost } from "@/lib/subdomain";

/**
 * Subdomain routing: requests to `<slug>.<app-domain>` are rewritten to the
 * internal `/_sites/<slug>` route which renders that seller's storefront.
 * Everything on the main domain flows through as-is.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get("host");
  const slug = getShopSlugFromHost(host);

  if (slug && request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/_sites/${slug}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};