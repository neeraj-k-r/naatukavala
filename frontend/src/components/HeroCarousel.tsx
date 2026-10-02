"use client";

import Image from "next/image";
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
  /** Optional photo background that matches the slide's message. */
  photo?: string;
  /** Readability scrim over the photo, tinted to the slide's color. */
  scrim?: string;
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
    photo: "/hero-shopkeeper.jpg",
    scrim:
      "bg-gradient-to-r from-orange-950/80 via-orange-950/45 via-[45%] to-orange-950/10",
  },
  {
    id: "shops",
    eyebrow: "Neighbourhood favourites",
    title: "Discover verified sellers near you.",
    cta: { label: "Browse shops", href: "#featured-shops" },
    theme: "brand",
    backdrop: "bg-gradient-to-br from-teal-600 to-emerald-800",
    photo: "/hero-storefront.jpg",
    scrim:
      "bg-gradient-to-r from-emerald-950/80 via-emerald-950/45 via-[45%] to-emerald-950/10",
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
      className="mb-4 sm:mb-5"
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
            className={`col-start-1 row-start-1 overflow-hidden px-4 py-4 transition-opacity duration-500 sm:px-6 sm:py-6 ${slide.backdrop} ${
              slideIndex === index
                ? "pointer-events-auto relative z-10 opacity-100"
                : "pointer-events-none relative z-0 opacity-0"
            }`}
          >
            {slide.theme === "editorial" ? (
              <>
                <span aria-hidden className="absolute inset-0">
                  <Image
                    src="/hero-market.jpg"
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 60vw"
                    priority={slideIndex === 0}
                    className="object-cover object-center"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-r from-[#faf5e9] via-[#faf5e9]/85 via-[45%] to-[#faf5e9]/5 dark:from-slate-900 dark:via-slate-900/85 dark:to-slate-900/5"
                  />
                </span>
                <div className="relative z-10 max-w-2xl">
                  <span
                    aria-hidden
                    className="block h-1.5 w-12 rounded-full bg-orange-500"
                  />
                  <h1 className="mt-2 text-balance text-2xl font-extrabold leading-tight text-emerald-950 sm:text-4xl dark:text-emerald-50">
                    {slide.title}{" "}
                    {slide.accent && (
                      <span className="text-orange-600 dark:text-orange-400">
                        {slide.accent}
                      </span>
                    )}
                  </h1>
                  <div className="mt-4 sm:mt-4">
                    <Link
                      href={slide.cta.href}
                      tabIndex={slideIndex === index ? 0 : -1}
                      className="inline-flex h-10 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      {slide.cta.label}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                {slide.photo && (
                  <span aria-hidden className="absolute inset-0">
                    <Image
                      src={slide.photo}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, 60vw"
                      className="object-cover object-center"
                    />
                    {slide.scrim && (
                      <span aria-hidden className={`absolute inset-0 ${slide.scrim}`} />
                    )}
                  </span>
                )}
                <div className="relative z-10 max-w-2xl">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 sm:text-xs">
                    {slide.eyebrow}
                  </p>
                  <h1 className="mt-0.5 text-balance text-lg font-extrabold leading-tight text-white sm:text-2xl">
                    {slide.title}
                  </h1>
                </div>
                <div className="relative z-10 mt-3 sm:mt-4">
                  <Link
                    href={slide.cta.href}
                    tabIndex={slideIndex === index ? 0 : -1}
                    className="inline-block h-9 items-center rounded-xl bg-white/95 px-4 py-1.5 text-[13px] font-bold text-slate-900 shadow-sm transition hover:bg-white"
                  >
                    {slide.cta.label}
                  </Link>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(index - 1); }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Previous banner"
          className="cursor-pointer rounded-full border border-white/40 bg-white/20 p-1.5 text-white opacity-80 shadow backdrop-blur-md transition hover:bg-white/35 hover:opacity-100 sm:hidden"
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
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(index + 1); }}
          onMouseDown={(e) => e.stopPropagation()}
          aria-label="Next banner"
          className="cursor-pointer rounded-full border border-white/40 bg-white/20 p-1.5 text-white opacity-80 shadow backdrop-blur-md transition hover:bg-white/35 hover:opacity-100 sm:hidden"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </section>
  );
}
