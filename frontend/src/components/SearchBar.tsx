"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar({
  variant = "stacked",
  placeholder = "Search products across all shops…",
  onNavigate,
}: {
  /** "inline" stays single-row for tight spots like the navbar. */
  variant?: "stacked" | "inline";
  placeholder?: string;
  /** Runs after navigation (e.g. close the mobile menu). */
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const term = query.trim();
    if (term) {
      router.push(`/?q=${encodeURIComponent(term)}`);
    } else {
      router.push("/");
    }
    onNavigate?.();
  }

  const inline = variant === "inline";

  return (
    <form
      onSubmit={onSubmit}
      role="search"
      className={
        inline
          ? "flex w-full max-w-xl flex-row gap-2"
          : "flex w-full max-w-xl flex-col gap-2 sm:flex-row"
      }
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        aria-label="Search products"
          className={
            inline
              ? "h-10 w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              : "h-11 w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          }
      />
      <button
        type="submit"
        className={
          inline
            ? "h-10 flex-none rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            : "h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 sm:w-auto"
        }
      >
        Search
      </button>
    </form>
  );
}