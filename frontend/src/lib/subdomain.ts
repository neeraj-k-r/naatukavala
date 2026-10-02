const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost";

/**
 * Free hosting domains (netlify.app, vercel.app, …) don't issue SSL for
 * nested shop subdomains like shop.site.netlify.app (browser cert error),
 * so shops fall back to /shop/<slug> paths there. Bare custom domains
 * (naatukavala.com) keep real subdomains.
 */
const NO_SUBDOMAIN_SUFFIXES = [
  ".netlify.app",
  ".vercel.app",
  ".pages.dev",
  ".onrender.com",
];

function subdomainsEnabled(): boolean {
  const base = APP_DOMAIN.toLowerCase();
  if (base === "localhost") return false;
  return !NO_SUBDOMAIN_SUFFIXES.some((suffix) => base.endsWith(suffix));
}

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
  if (!host || !subdomainsEnabled()) return null;
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
 * Real subdomains in production (APP_DOMAIN is a custom domain);
 * otherwise falls back to a path so the storefront stays reachable
 * locally and on free hosts without wildcard SSL.
 */
export function shopUrl(slug: string): string {
  if (!subdomainsEnabled()) return `/shop/${slug}`;
  const base = APP_DOMAIN.replace(/^www\./, "");
  return `https://${slug}.${base}`;
}

export function getAppDomain(): string {
  return APP_DOMAIN;
}