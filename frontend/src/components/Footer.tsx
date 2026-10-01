"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Shop } from "@/lib/types";

const CONTACT_EMAIL = "naatukavala.admin@gmail.com";

export default function Footer({ siteShop = null }: { siteShop?: Shop | null }) {
  const pathname = usePathname();

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

  // About block lives only on auth pages — everywhere else shows contact.
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname?.startsWith("/auth/");

  return (
    <footer className="mt-auto border-t border-emerald-100 bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        {isAuthPage ? (
          <div className="mx-auto w-full max-w-2xl text-center sm:mx-0 sm:text-left">
            <p className="flex items-center justify-center gap-2 text-base font-extrabold text-emerald-900 sm:justify-start sm:text-lg dark:text-emerald-200">
              <Image
                src="/naatukavala.png"
                alt="Naatukavala"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
              <span className="truncate">Naatukavala</span>
            </p>
            <p className="mt-3 text-balance text-[13px] leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
              About us — Naatukavala brings your neighbourhood shops online.
              Discover groceries, stationery, crafts and more from local
              shop-owners and independent sellers, and buy from them directly
              in one marketplace.
            </p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl text-center sm:mx-0 sm:text-left">
            <p className="flex items-center justify-center gap-2 text-base font-extrabold text-emerald-900 sm:justify-start sm:text-lg dark:text-emerald-200">
              <Image
                src="/naatukavala.png"
                alt="Naatukavala"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
              <span className="truncate">Contact us</span>
            </p>
            <p className="mt-3 text-balance text-[13px] leading-relaxed text-slate-600 sm:text-sm dark:text-slate-400">
              Questions about an order, selling, or your shop? Reach us at{" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="font-semibold text-emerald-700 break-all hover:underline dark:text-emerald-400"
              >
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </div>
        )}
        <div className="mt-6 flex w-full flex-col items-center justify-between gap-1.5 border-t border-emerald-100 pt-4 text-center text-[11px] text-slate-500 sm:mt-8 sm:flex-row sm:pt-5 sm:text-left sm:text-xs dark:border-slate-800 dark:text-slate-500">
          <p>© {new Date().getFullYear()} Naatukavala. All rights reserved.</p>
          <p>Made for local shops and independent sellers.</p>
        </div>
      </div>
    </footer>
  );
}
