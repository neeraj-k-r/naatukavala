"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const SWIPE_THRESHOLD_PX = 40;

export default function ProductGallery({
  images,
  name,
  stock,
}: {
  images: string[];
  name: string;
  stock: number;
}) {
  const [selected, setSelected] = useState(0);
  const active = images[Math.min(selected, images.length - 1)];
  const startX = useRef<number | null>(null);

  function goNext() {
    setSelected((prev) => (prev + 1) % images.length);
  }

  function goPrev() {
    setSelected((prev) => (prev - 1 + images.length) % images.length);
  }

  function handleSwipe(deltaX: number) {
    if (images.length < 2) return;
    if (deltaX <= -SWIPE_THRESHOLD_PX) goNext();
    else if (deltaX >= SWIPE_THRESHOLD_PX) goPrev();
  }

  return (
    <div>
      <div
        className="relative aspect-square touch-pan-y overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm select-none dark:border-slate-800 dark:bg-slate-900"
        onTouchStart={(event) => {
          startX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          if (startX.current === null) return;
          handleSwipe(event.changedTouches[0].clientX - startX.current);
          startX.current = null;
        }}
        onMouseDown={(event) => {
          startX.current = event.clientX;
        }}
        onMouseUp={(event) => {
          if (startX.current === null) return;
          handleSwipe(event.clientX - startX.current);
          startX.current = null;
        }}
        onMouseLeave={() => {
          startX.current = null;
        }}
      >
        {active ? (
          <Image
            key={active}
            src={active}
            alt={name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-6xl">
            🌿
          </div>
        )}
        {stock === 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-md transition hover:bg-white dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-[11px] font-semibold text-white">
              {selected + 1} / {images.length}
            </span>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
          {images.map((src, index) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(index)}
              aria-label={`View image ${index + 1}`}
              aria-pressed={index === selected}
              className={`h-20 w-20 flex-none overflow-hidden rounded-xl border object-cover transition ${
                index === selected
                  ? "border-emerald-600 ring-2 ring-emerald-600 dark:border-emerald-500 dark:ring-emerald-500"
                  : "border-slate-100 opacity-70 hover:opacity-100 dark:border-slate-700"
              }`}
            >
              <Image
                src={src}
                alt=""
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
