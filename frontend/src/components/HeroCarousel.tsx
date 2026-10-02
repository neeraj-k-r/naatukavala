"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ROTATE_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

const slides = [
  {
    id: "marketplace",
    eyebrow: "Naatukavala marketplace",
    title: "Every local shop, one marketplace.",
    cta: null as { label: string; href: string } | null,
    backdrop: "bg-gradient-to-br from-emerald-600 to-teal-700",
  },
  {
    id: "sell",
    eyebrow: "For shop owners",
    title: "Open your shop online in minutes.",
    cta: { label: "Sell with us", href: "/sell" },
    backdrop: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    id: "shops",
    eyebrow: "Neighbourhood favourites",
    title: "Discover verified sellers near you.",
    cta: { label: "Browse shops", href: "#featured-shops" },
    backdrop: "bg-gradient-to-br from-teal-600 to-emerald-800",
  },
];

/**
 * Store-style hero banner: auto-rotating slides with dots, arrows and
 * swipe. The first slide carries the product search.
 */
export default function HeroCarousel({
  searchSlot,
}: {
  searchSlot: React.ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const timer = setTimeout(
      () => setIndex((prev) => (prev + 1) % slides.length),
      ROTATE_MS,
    );
    return () => clearTimeout(timer);
  }, [index, paused]);

  const go = (next: number) =>
    setIndex((next + slides.length) % slides.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured"
      className="mb-5 sm:mb-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="grid touch-pan-y overflow-hidden rounded-2xl shadow-sm sm:rounded-3xl"
        onTouchStart={(event) => {
          startX.current = event.touches[0].clientX;
          setPaused(true);
        }}
        onTouchEnd={(event) => {
          if (startX.current !== null) {
            const delta = event.changedTouches[0].clientX - startX.current;
            if (delta <= -SWIPE_THRESHOLD_PX) go(index + 1);
            else if (delta >= SWIPE_THRESHOLD_PX) go(index - 1);
          }
          startX.current = null;
          setPaused(false);
        }}
      >
        {slides.map((slide, slideIndex) => (
          <div
            key={slide.id}
            aria-hidden={slideIndex !== index}
            className={`col-start-1 row-start-1 px-5 py-8 text-white transition-opacity duration-500 sm:px-10 sm:py-12 ${slide.backdrop} ${
              slideIndex === index
                ? "pointer-events-auto relative z-10 opacity-100"
                : "pointer-events-none relative z-0 opacity-0"
            }`}
          >
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-white/80 sm:text-sm">
                {slide.eyebrow}
              </p>
              <h1 className="mt-1 text-balance text-2xl font-extrabold leading-tight sm:text-4xl">
                {slide.title}
              </h1>
            </div>
            {slideIndex === 0 ? (
              <div className="mt-5 sm:mt-8">{searchSlot}</div>
            ) : (
              slide.cta && (
                <div className="mt-5 sm:mt-8">
                  <Link
                    href={slide.cta.href}
                    tabIndex={slideIndex === index ? 0 : -1}
                    className="inline-block h-11 items-center rounded-xl bg-white/95 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
                  >
                    {slide.cta.label}
                  </Link>
                </div>
              )
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous banner"
          className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-emerald-700 sm:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="flex items-center gap-1.5">
          {slides.map((slide, dotIndex) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => go(dotIndex)}
              aria-label={`Show banner ${dotIndex + 1}: ${slide.title}`}
              aria-current={dotIndex === index}
              className={`h-2 rounded-full transition-all ${
                dotIndex === index
                  ? "w-6 bg-emerald-600"
                  : "w-2 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700 dark:hover:bg-slate-600"
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next banner"
          className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:text-emerald-700 sm:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
