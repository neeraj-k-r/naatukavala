import Link from "next/link";

import type { Shop } from "@/lib/types";

export default function Footer({ siteShop = null }: { siteShop?: Shop | null }) {
  // On a shop subdomain the visitor is on that shop's private website —
  // keep the footer inside it with a small powered-by note.
  if (siteShop) {
    return (
      <footer className="mt-auto border-t border-emerald-100 bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:px-6">
          <p className="font-semibold text-emerald-900 dark:text-emerald-200">
            {siteShop.name} · powered by Naatukavala
          </p>
          <nav className="flex items-center gap-5">
            <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Home
            </Link>
            <Link href="/cart" className="hover:text-emerald-700 dark:hover:text-emerald-400">
              Cart
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-emerald-100 bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:px-6">
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">
          Naatukavala — every local shop, online.
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/sell" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Sell with us
          </Link>
          <Link href="/" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Marketplace
          </Link>
          <Link href="/cart" className="hover:text-emerald-700 dark:hover:text-emerald-400">
            Cart
          </Link>
        </nav>
      </div>
    </footer>
  );
}