"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { getPriceDropCount } from "@/lib/client-api";
import { signOut } from "@/lib/actions";
import ThemeToggle from "@/components/ThemeToggle";
import { useCart } from "@/components/CartContext";
import type { AuthUser } from "@/lib/auth";
import type { Profile, Shop } from "@/lib/types";

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost";

function authUrl(path: string): string {
  if (appDomain === "localhost") return path;
  return `https://${appDomain}${path}`;
}

export default function Navbar({
  user: initialUser,
  siteShop = null,
}: {
  user: AuthUser | null;
  siteShop?: Shop | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropCount, setDropCount] = useState(0);
  // Closing the mobile menu is handled by each link's onClick — no
  // pathname effect needed here.
  const pathname = usePathname();
  const { count } = useCart();

  // The layout re-renders with a new `initialUser` after login/logout/signup
  // navigations, but useState only reads the first value — so the previous
  // account's name stays visible until a manual refresh. Adjust the state
  // during render when the account actually changed (logout, login, or a
  // different user signing up). Comparing ids keeps fresher client-fetched
  // profile data for same-user navigations.
  const [syncedUserId, setSyncedUserId] = useState<string | null>(
    initialUser?.id ?? null,
  );
  const incomingUserId = initialUser?.id ?? null;
  if (incomingUserId !== syncedUserId) {
    setSyncedUserId(incomingUserId);
    setUser(initialUser);
  }

  // Clear a previous account's alert count the moment the account changes.
  const activeUserId = user?.id ?? null;
  const [countUserId, setCountUserId] = useState<string | null>(activeUserId);
  if (countUserId !== activeUserId) {
    setCountUserId(activeUserId);
    setDropCount(0);
  }

  async function handleSignOut() {
    // Clear the browser session first: the server action only clears
    // http-only cookies, leaving the local session behind to go stale.
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    setMobileOpen(false);
    await signOut();
  }

  useEffect(() => {
    const supabase = createBrowserClient();

    const refresh = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setUser(null);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();
      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        profile: profile as Profile | null,
        role: (profile as Profile | null)?.role ?? null,
      });
    };

    refresh();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      // SIGNED_OUT fires with a stale session attached — clear instantly
      // instead of re-reading it back via refresh().
      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }
      refresh();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Unseen price-drop alerts (peek only — viewing the wishlist marks them
  // as seen). Refreshed on navigation so the badge clears after a visit.
  useEffect(() => {
    if (!activeUserId) return;
    let cancelled = false;
    getPriceDropCount()
      .then((unseen) => {
        if (!cancelled) setDropCount(unseen);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeUserId, pathname]);

  const role = user?.role;

  // On a shop subdomain the visitor is on that shop's private website:
  // brand the bar for the shop and keep every link inside it. Relative
  // links stay on the subdomain; marketplace links use the main domain.
  const shopMode = Boolean(siteShop);
  const siteUrl = (path: string) => (shopMode ? path : authUrl(path));

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-4 sm:px-6">
        {siteShop ? (
          <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
            <span className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-lg bg-emerald-600 text-lg font-bold text-white sm:h-9 sm:w-9">
              {siteShop.logo_url ? (
                <Image
                  src={siteShop.logo_url}
                  alt={siteShop.name}
                  width={36}
                  height={36}
                  className="h-full w-full object-cover"
                />
              ) : (
                siteShop.name.slice(0, 1).toUpperCase()
              )}
            </span>
            <span className="truncate text-lg font-extrabold tracking-tight text-emerald-900 sm:text-xl dark:text-emerald-200">
              {siteShop.name}
            </span>
          </Link>
        ) : (
          <Link href={authUrl("/")} className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
            <Image
              src="/naatukavala.png"
              alt="Naatukavala"
              width={36}
              height={36}
              className="h-8 w-8 flex-none rounded-full object-cover sm:h-9 sm:w-9"
              priority
            />
            <span className="truncate text-lg font-extrabold tracking-tight text-emerald-900 sm:text-xl dark:text-emerald-200">
              Naatukavala
            </span>
          </Link>
        )}

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
          {shopMode ? (
            <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Home
            </Link>
          ) : (
            <>
              <Link href={authUrl("/")} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                Marketplace
              </Link>
              {(!role || role === "buyer") && (
                <Link href={authUrl("/sell")} className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Sell with us
                </Link>
              )}
              {role === "seller" && (
                <Link href="/dashboard" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Dashboard
                </Link>
              )}
              {(role === "superadmin" || role === "admin") && (
                <Link href="/admin" className="hover:text-emerald-700 dark:hover:text-emerald-400">
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <Link
            href={siteUrl("/wishlist")}
            className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Wishlist"
          >
            Wishlist
            {dropCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                {dropCount}
              </span>
            )}
          </Link>
          <Link
            href={siteUrl("/cart")}
            className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Cart"
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>

          {!user ? (
            <div className="flex items-center gap-2">
              <Link
                href={siteUrl("/login")}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
              >
                Log in
              </Link>
              <Link
                href={siteUrl("/signup")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {user.profile?.full_name
                    ?.split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 dark:text-slate-300 sm:block">
                  {user.profile?.full_name || user.email}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg dark:border-slate-800 dark:bg-slate-900">
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      My orders
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      My wishlist
                    </Link>
                    {role === "seller" && !shopMode && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Seller dashboard
                      </Link>
                    )}
                    {(role === "superadmin" || role === "admin") && !shopMode && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        Admin panel
                      </Link>
                    )}
                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                      >
                        Log out
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile actions: wishlist + cart + hamburger (theme lives in the menu) */}
        <div className="flex flex-none items-center gap-1 md:hidden">
          <Link
            href={siteUrl("/wishlist")}
            className="relative rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Wishlist"
          >
            Wishlist
            {dropCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                {dropCount}
              </span>
            )}
          </Link>
          <Link
            href={siteUrl("/cart")}
            className="relative rounded-lg px-2 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Cart"
          >
            Cart
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="rounded-lg p-2 text-slate-700 hover:bg-emerald-50 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-6 w-6" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav className="border-t border-emerald-100 bg-white px-3 py-3 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            {shopMode ? (
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
              >
                Home
              </Link>
            ) : (
              <>
                <Link
                  href={authUrl("/")}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                >
                  Marketplace
                </Link>
                {(!role || role === "buyer") && (
                  <Link
                    href={authUrl("/sell")}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    Sell with us
                  </Link>
                )}
                {role === "seller" && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    Dashboard
                  </Link>
                )}
                {(role === "superadmin" || role === "admin") && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            <Link
              href={siteUrl("/wishlist")}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
            >
              <span>Wishlist</span>
              {dropCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold text-white">
                  {dropCount}
                </span>
              )}
            </Link>
            <Link
              href={siteUrl("/cart")}
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
            >
              <span>Cart</span>
              {count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>
            <div className="flex items-center justify-between rounded-lg px-3 py-1.5">
              <span>Appearance</span>
              <ThemeToggle />
            </div>

            {!user ? (
              <div className="mt-2 flex gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <Link
                  href={siteUrl("/login")}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg px-4 py-2.5 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
                >
                  Log in
                </Link>
                <Link
                  href={siteUrl("/signup")}
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                >
                  Sign up
                </Link>
              </div>
            ) : (
              <div className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                <p className="truncate px-3 pb-1 text-xs text-slate-500 dark:text-slate-400">
                  {user.profile?.full_name || user.email}
                </p>
                <Link
                  href="/account"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                >
                  My orders
                </Link>
                {role === "seller" && !shopMode && (
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    Seller dashboard
                  </Link>
                )}
                {(role === "superadmin" || role === "admin") && !shopMode && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2.5 hover:bg-emerald-50 dark:hover:bg-slate-800"
                  >
                    Admin panel
                  </Link>
                )}
                <form action={handleSignOut}>
                  <button
                    type="submit"
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    Log out
                  </button>
                </form>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}