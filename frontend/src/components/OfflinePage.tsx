"use client";

import Image from "next/image";

/**
 * Full-screen "market disconnected" state, shown when the browser reports
 * it is offline. Mirrors the friendly offline pages big marketplaces use
 * (a dog sleeping by the shop) instead of a blank screen or browser error.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf5e9] px-6 py-12 text-center dark:bg-slate-950">
      <Image
        src="/naatukavaladisc.png"
        alt="A dog sleeping in front of a closed shop"
        width={320}
        height={320}
        priority
        className="w-64 max-w-full sm:w-80"
      />

      <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl dark:text-emerald-50">
        Market disconnected
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 sm:text-base dark:text-slate-400">
        Looks like you&apos;re not connected to the internet. Your shops and
        products will be right here when you&apos;re back online.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        Try again
      </button>
    </div>
  );
}
