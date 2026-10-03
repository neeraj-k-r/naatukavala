"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import AdaptiveProductImage from "@/components/AdaptiveProductImage";

import WishlistButton from "@/components/WishlistButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { formatCurrency } from "@/lib/utils";

import type { ProductWithShop } from "@/lib/types";

const AUTOPLAY_MS = 4000;
const SWIPE_THRESHOLD_PX = 40;

/**
 * "Trending now" as a single-image hero carousel: one product at a
 * time, auto-sliding with arrows, dots and swipe.
 */
export default function DealsShelf({
  products,
  promotedIds,
  wishlistIds,
  signedIn,
}: {
  products: ProductWithShop[];
  promotedIds: Set<string>;
  wishlistIds: Set<string>;
  signedIn: boolean;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  const count = products.length;
  const safeIndex = count === 0 ? 0 : index % count;

  useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(
      () => setIndex((prev) => (prev + 1) % count),
      AUTOPLAY_MS,
    );
    return () => clearInterval(timer);
  }, [paused, count]);

  if (count === 0) return null;

  const go = (next: number) => setIndex(((next % count) + count) % count);
  const product = products[safeIndex];
  const image = product.images?.[0];
  const verified = product.shop?.verification_status === "verified";

  return (
    <section aria-label="Trending now" className="mb-8 sm:mb-10">
      <h2 className="mb-3 text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
        Trending now
      </h2>

      <div
        aria-roledescription="carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(event) => {
          startX.current = event.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(event) => {
          if (startX.current !== null) {
            const delta = event.changedTouches[0].clientX - startX.current;
            if (delta <= -SWIPE_THRESHOLD_PX) go(safeIndex + 1);
            else if (delta >= SWIPE_THRESHOLD_PX) go(safeIndex - 1);
          }
          startX.current = null;
          setPaused(false);
        }}
        className="group relative touch-pan-y overflow-hidden rounded-2xl border border-slate-100 bg-slate-200 shadow-sm sm:rounded-3xl dark:border-slate-800 dark:bg-slate-800"
      >
        <Link
          key={product.id}
          href={`/product/${product.id}`}
          className="block sm:flex sm:items-stretch"
        >
          <div className="relative h-64 w-full shrink-0 overflow-hidden sm:h-72 sm:w-1/2 lg:h-80">
            {image ? (
              <AdaptiveProductImage
                src={image}
                alt={product.name}
                sizes="(max-width: 640px) 100vw, 50vw"
                priority
                foregroundClassName="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-5xl">
                🌿
              </div>
            )}
            {/* Mobile overlay caption — z-20 so it sits above the z-10 image */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent p-4 pt-12 sm:hidden">
              <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-300">
                <span className="min-w-0 truncate">{product.shop?.name}</span>
                {verified && <VerifiedBadge />}
                {promotedIds.has(product.id) && (
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                    Sponsored
                  </span>
                )}
              </p>
              <p className="mt-1 text-lg font-extrabold text-white">
                {product.name}
              </p>
              <p className="mt-0.5 text-base font-bold text-white">
                {formatCurrency(product.price, product.currency)}
              </p>
            </div>
          </div>
          {/* Desktop side panel — no cropping, no overlay */}
          <div className="hidden flex-1 flex-col justify-center gap-1 p-6 sm:flex lg:p-8">
            <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="min-w-0 truncate">{product.shop?.name}</span>
              {verified && <VerifiedBadge />}
              {promotedIds.has(product.id) && (
                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-bold text-amber-950">
                  Sponsored
                </span>
              )}
            </p>
            <p className="line-clamp-2 text-xl font-extrabold text-slate-900 lg:text-2xl dark:text-slate-100">
              {product.name}
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(product.price, product.currency)}
            </p>
            <span className="mt-3 inline-flex w-fit items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
              View product
            </span>
          </div>
        </Link>

        <div className="absolute right-3 top-3 z-10">
          <WishlistButton
            productId={product.id}
            initialWished={wishlistIds.has(product.id)}
            signedIn={signedIn}
            size="trending"
          />
        </div>

        <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-between px-2">
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(safeIndex - 1); }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Previous trending product"
                className="cursor-pointer rounded-full border border-white/40 bg-white/20 p-2 text-white opacity-80 shadow backdrop-blur-md transition hover:bg-white/35 hover:opacity-100 pointer-events-auto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(safeIndex + 1); }}
                onMouseDown={(e) => e.stopPropagation()}
                aria-label="Next trending product"
                className="cursor-pointer rounded-full border border-white/40 bg-white/20 p-2 text-white opacity-80 shadow backdrop-blur-md transition hover:bg-white/35 hover:opacity-100 pointer-events-auto"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {count > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {products.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => go(dotIndex)}
              aria-label={`Show trending product ${dotIndex + 1}: ${item.name}`}
              aria-current={dotIndex === safeIndex}
              className={`h-2 rounded-full transition-all ${
                dotIndex === safeIndex
                  ? "w-6 bg-emerald-600"
                  : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
