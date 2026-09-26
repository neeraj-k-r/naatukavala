"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export type ShopSort = "featured" | "newest" | "price-asc" | "price-desc";

const sortLabels: Record<ShopSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

/**
 * Shop-scoped filters for a private storefront: search, category pills and
 * sorting. Everything is stored in the URL so links stay shareable, and
 * navigation is relative so it works on subdomains and the path fallback.
 */
export default function ShopFilterBar({
  categories,
  shopName,
}: {
  categories: string[];
  shopName: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = (searchParams.get("sort") ?? "featured") as ShopSort;

  function navigate(params: URLSearchParams) {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function withUpdated(key: string, value: string): URLSearchParams {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    return params;
  }

  function onSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(withUpdated("q", query.trim()));
  }

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <form onSubmit={onSearch} className="flex flex-1 gap-2">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`Search in ${shopName}…`}
            aria-label="Search products in this shop"
            className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
          >
            Search
          </button>
        </form>
        <select
          value={activeSort}
          onChange={(event) =>
            navigate(
              withUpdated(
                "sort",
                event.target.value === "featured" ? "" : event.target.value,
              ),
            )
          }
          aria-label="Sort products"
          className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {(Object.keys(sortLabels) as ShopSort[]).map((sort) => (
            <option key={sort} value={sort}>
              {sortLabels[sort]}
            </option>
          ))}
        </select>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <FilterPill
            active={activeCategory === ""}
            onClick={() => navigate(withUpdated("category", ""))}
          >
            All
          </FilterPill>
          {categories.map((category) => (
            <FilterPill
              key={category}
              active={activeCategory === category}
              onClick={() => navigate(withUpdated("category", category))}
            >
              {category}
            </FilterPill>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}
