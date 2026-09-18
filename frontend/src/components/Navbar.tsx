"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions";
import { useCart } from "@/components/CartContext";
import type { AuthUser } from "@/lib/auth";
import type { Profile } from "@/lib/types";

const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost";

function authUrl(path: string): string {
  if (appDomain === "localhost") return path;
  return `https://${appDomain}${path}`;
}

export default function Navbar({ user: initialUser }: { user: AuthUser | null }) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();

  // The layout re-renders with a new `initialUser` after login/logout/signup
  // navigations. useState only reads the first value, so sync it — otherwise
  // the previous account's name stays visible until a manual refresh.
  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  async function handleSignOut() {
    // Clear the browser session first: the server action only clears
    // http-only cookies, leaving the local session behind to go stale.
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
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

  const role = user?.role;

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={authUrl("/")} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-lg font-bold text-white">
            N
          </span>
          <span className="text-xl font-extrabold tracking-tight text-emerald-900">
            Naatukavala
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <Link href={authUrl("/")} className="hover:text-emerald-700">
            Marketplace
          </Link>
          <Link href={authUrl("/sell")} className="hover:text-emerald-700">
            Sell with us
          </Link>
          {role === "seller" && (
            <Link href="/dashboard" className="hover:text-emerald-700">
              Dashboard
            </Link>
          )}
          {(role === "superadmin" || role === "admin") && (
            <Link href="/admin" className="hover:text-emerald-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href={authUrl("/cart")}
            className="relative rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-emerald-50"
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
                href={authUrl("/login")}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                Log in
              </Link>
              <Link
                href={authUrl("/signup")}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-emerald-50"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {user.profile?.full_name
                    ?.split(" ")
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </span>
                <span className="hidden max-w-28 truncate text-sm font-medium text-slate-700 sm:block">
                  {user.profile?.full_name || user.email}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-slate-100 bg-white p-1.5 shadow-lg">
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      My orders
                    </Link>
                    {role === "seller" && (
                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Seller dashboard
                      </Link>
                    )}
                    {(role === "superadmin" || role === "admin") && (
                      <Link
                        href="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Admin panel
                      </Link>
                    )}
                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
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
      </div>
    </header>
  );
}