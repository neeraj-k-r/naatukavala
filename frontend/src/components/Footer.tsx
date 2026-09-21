import Link from "next/link";

import type { Shop } from "@/lib/types";

export default function Footer({ siteShop = null }: { siteShop?: Shop | null }) {
  // On a shop subdomain the visitor is on that shop's private website —
  // keep the footer inside it with a small powered-by note.
  if (siteShop) {
    return (
      <footer className="mt-auto border-t border-emerald-100 bg-emerald-50/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:px-6">
          <p className="font-semibold text-emerald-900">
            {siteShop.name} · powered by Naatukavala
          </p>
          <nav className="flex items-center gap-5">
            <Link href="/" className="hover:text-emerald-700">
              Home
            </Link>
            <Link href="/cart" className="hover:text-emerald-700">
              Cart
            </Link>
          </nav>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-auto border-t border-emerald-100 bg-emerald-50/60">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:px-6">
        <p className="font-semibold text-emerald-900">
          Naatukavala — every local shop, online.
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/sell" className="hover:text-emerald-700">
            Sell with us
          </Link>
          <Link href="/" className="hover:text-emerald-700">
            Marketplace
          </Link>
          <Link href="/cart" className="hover:text-emerald-700">
            Cart
          </Link>
        </nav>
      </div>
    </footer>
  );
}