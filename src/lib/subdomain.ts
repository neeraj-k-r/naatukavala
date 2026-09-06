const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost";

/**
 * Extracts the shop slug from a request host header.
 * Returns null when the host is the main domain (or www.<main>).
 *
 * Examples (domain = naatukavala.com):
 *   naatukavala.com        -> null
 *   www.naatukavala.com    -> null
 *   handymart.naatukavala.com -> "handymart"
 */
export function getShopSlugFromHost(host: string | null): string | null {
  if (!host) return null;
  const hostname = host.split(":")[0].toLowerCase();
  const base = APP_DOMAIN.toLowerCase().replace(/^www\./, "");

  if (hostname === base || hostname === `www.${base}`) return null;
  if (!hostname.endsWith(`.${base}`)) return null;

  const sub = hostname.slice(0, -(base.length + 1));
  if (!sub || sub === "www") return null;
  return sub;
}

/** Returns whether the current host is the main marketplace domain. */
export function isMainDomain(host: string | null): boolean {
  return getShopSlugFromHost(host) === null;
}

/**
 * Returns the absolute URL for a shop storefront.
 * In production (APP_DOMAIN !== localhost) points at the subdomain;
 * otherwise falls back to a path so the storefront is reachable locally.
 */
export function shopUrl(slug: string): string {
  if (APP_DOMAIN === "localhost") return `/shop/${slug}`;
  const base = APP_DOMAIN.replace(/^www\./, "");
  return `https://${slug}.${base}`;
}

export function getAppDomain(): string {
  return APP_DOMAIN;
}