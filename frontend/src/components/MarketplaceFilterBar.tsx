"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import SortSelect from "@/components/SortSelect";

export type MarketplaceSort = "featured" | "newest" | "price-asc" | "price-desc";

const sortLabels: Record<MarketplaceSort, string> = {
  featured: "Featured",
  newest: "Newest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
};

/**
 * A "Filters" button that pops the filter section open in a modal sheet:
 * category pills plus shop-site-style filters (sort, max price, in-stock).
 * Everything lives in the URL so links stay shareable.
 */
export default function MarketplaceFilterBar({
  categories,
  resultCount,
}: {
  categories: string[];
  resultCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [priceInput, setPriceInput] = useState(searchParams.get("maxPrice") ?? "");

  const activeCategory = searchParams.get("category") ?? "";
  const activeSort = (searchParams.get("sort") ?? "featured") as MarketplaceSort;
  const activeMaxPrice = searchParams.get("maxPrice") ?? "";
  const inStockOnly = searchParams.get("inStock") === "1";

  const activeCount =
    (activeCategory !== "" ? 1 : 0) +
    (activeSort !== "featured" ? 1 : 0) +
    (activeMaxPrice !== "" ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  // Close on Escape and lock background scroll while the popup is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open ]);

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

  function applyMaxPrice() {
    const value = priceInput.trim();
    // Accept only non-negative numbers; anything else clears the filter.
    if (value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
      return;
    }
    navigate(withUpdated("maxPrice", value));
  }

  function clearAll() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("category");
    params.delete("sort");
    params.delete("maxPrice");
    params.delete("inStock");
    setPriceInput("");
    navigate(params);
  }

  return (
    <>
      <div className="flex-none">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
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
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-3xl sm:p-6 dark:bg-slate-900"
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg dark:text-slate-100">
                Filters
              </h2>
              <div className="flex items-center gap-2">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 sm:text-sm dark:text-emerald-400 dark:hover:bg-slate-800"
                  >
                    Clear all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close filters"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-500 sm:text-sm dark:text-slate-400">
                  Category
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
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
              </div>
            )}

            <div className="mt-4 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 sm:text-sm dark:text-slate-400">
                  Sort by
                </span>
                <SortSelect<MarketplaceSort>
                  value={activeSort}
                  options={(Object.keys(sortLabels) as MarketplaceSort[]).map(
                    (sort) => ({ value: sort, label: sortLabels[sort] }),
                  )}
                  onChange={(next) =>
                    navigate(withUpdated("sort", next === "featured" ? "" : next))
                  }
                />
              </div>

              <form
                className="flex min-w-0 flex-col gap-1.5"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyMaxPrice();
                }}
              >
                <span className="text-xs font-semibold text-slate-500 sm:text-sm dark:text-slate-400">
                  Max price (₹)
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={(event) => setPriceInput(event.target.value)}
                    onBlur={applyMaxPrice}
                    placeholder="e.g. 500"
                    aria-label="Maximum price in rupees"
                    className="h-11 w-full min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <button
                    type="submit"
                    className="h-11 flex-none rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Go
                  </button>
                </div>
              </form>

              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-xs font-semibold text-slate-500 sm:text-sm dark:text-slate-400">
                  Availability
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inStockOnly}
                  onClick={() => navigate(withUpdated("inStock", inStockOnly ? "" : "1"))}
                  className={`flex h-11 w-full items-center justify-between rounded-xl border px-3 text-sm font-medium shadow-sm transition ${
                    inStockOnly
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-200"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  <span>In stock only</span>
                  <span
                    aria-hidden
                    className={`relative h-5 w-9 flex-none rounded-full transition ${
                      inStockOnly ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                        inStockOnly ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-5 h-11 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              Show {resultCount} item{resultCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </>
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
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
      }`}
    >
      {children}
    </button>
  );
}
