"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const ROTATE_MS = 6000;
const SWIPE_THRESHOLD_PX = 40;

type Slide = {
  id: string;
  eyebrow: string;
  title: string;
  /** Orange accent suffix rendered after the title (editorial slide). */
  accent?: string;
  cta: { label: string; href: string };
  theme: "editorial" | "brand";
  backdrop: string;
};

const slides: Slide[] = [
  {
    id: "harvest",
    eyebrow: "",
    title: "Local products. Straight from",
    accent: "our land.",
    cta: { label: "Shop now", href: "#all-products" },
    theme: "editorial",
    backdrop: "bg-[#faf5e9] dark:bg-slate-900",
  },
  {
    id: "sell",
    eyebrow: "For shop owners",
    title: "Open your shop online in minutes.",
    cta: { label: "Sell with us", href: "/sell" },
    theme: "brand",
    backdrop: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  {
    id: "shops",
    eyebrow: "Neighbourhood favourites",
    title: "Discover verified sellers near you.",
    cta: { label: "Browse shops", href: "#featured-shops" },
    theme: "brand",
    backdrop: "bg-gradient-to-br from-teal-600 to-emerald-800",
  },
];

/**
 * Store-style hero banner: auto-rotating slides with dots, arrows and
 * swipe. Opens with a cream editorial harvest banner; search lives in
 * the navbar.
 */
export default function HeroCarousel() {
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
            className={`col-start-1 row-start-1 overflow-hidden px-5 py-8 transition-opacity duration-500 sm:px-10 sm:py-12 ${slide.backdrop} ${
              slideIndex === index
                ? "pointer-events-auto relative z-10 opacity-100"
                : "pointer-events-none relative z-0 opacity-0"
            }`}
          >
            {slide.theme === "editorial" ? (
              <div className="relative max-w-2xl">
                <span
                  aria-hidden
                  className="block h-1.5 w-12 rounded-full bg-orange-500"
                />
                <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight text-emerald-950 sm:text-5xl dark:text-emerald-50">
                  {slide.title}{" "}
                  {slide.accent && (
                    <span className="text-orange-600 dark:text-orange-400">
                      {slide.accent}
                    </span>
                  )}
                </h1>
                <div className="mt-5 sm:mt-6">
                  <Link
                    href={slide.cta.href}
                    tabIndex={slideIndex === index ? 0 : -1}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                  >
                    {slide.cta.label}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-200/50 blur-2xl dark:bg-emerald-900/40"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-14 right-24 h-32 w-32 rounded-full bg-orange-200/60 blur-2xl dark:bg-orange-900/30"
                />
              </div>
            ) : (
              <>
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/80 sm:text-sm">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-1 text-balance text-2xl font-extrabold leading-tight text-white sm:text-4xl">
                    {slide.title}
                  </h1>
                </div>
                <div className="mt-5 sm:mt-8">
                  <Link
                    href={slide.cta.href}
                    tabIndex={slideIndex === index ? 0 : -1}
                    className="inline-block h-11 items-center rounded-xl bg-white/95 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-white"
                  >
                    {slide.cta.label}
                  </Link>
                </div>
              </>
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
