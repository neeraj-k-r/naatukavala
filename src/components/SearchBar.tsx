"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
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
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search products across all shops…"
        className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
      />
      <button
        type="submit"
        className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
      >
        Search
      </button>
    </form>
  );
}