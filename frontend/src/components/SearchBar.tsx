"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { fetchSuggestions, type SearchSuggestion } from "@/lib/client-api";
import {
  getSearchHistory,
  removeSearchHistory,
} from "@/lib/searchHistory";
import { shopUrl } from "@/lib/subdomain";

const DEBOUNCE_MS = 250;

/** Bolds the typed part inside a suggestion, like Google. */
function Highlighted({ text, term }: { text: string; term: string }) {
  const index = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (index < 0) return <span className="truncate">{text}</span>;
  return (
    <span className="truncate">
      {text.slice(0, index)}
      <span className="font-extrabold text-slate-900 dark:text-white">
        {text.slice(index, index + term.length)}
      </span>
      {text.slice(index + term.length)}
    </span>
  );
}

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
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  /** 0 = "Search for …" row, 1..n = suggestions. */
  const [highlight, setHighlight] = useState(0);
  const reqId = useRef(0);

  // Debounced fetch as the user types (ignores stale responses).
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    const id = ++reqId.current;
    const timer = setTimeout(async () => {
      const list = await fetchSuggestions(term);
      if (id === reqId.current) {
        setSuggestions(list);
        setHighlight(0);
        setOpen(true);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  function runTextSearch(term: string) {
    const trimmed = term.trim();
    if (trimmed) {
      router.push(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/");
    }
    setOpen(false);
    onNavigate?.();
  }

  function goToSuggestion(s: SearchSuggestion) {
    setOpen(false);
    setQuery(s.label);
    if (s.kind === "product" && s.id) {
      router.push(`/product/${s.id}`);
    } else if (s.kind === "shop" && s.id) {
      router.push(shopUrl(s.id));
    } else if (s.kind === "category") {
      router.push(`/?category=${encodeURIComponent(s.label)}`);
    } else {
      runTextSearch(s.label);
    }
    onNavigate?.();
  }

  /** Row 0 runs the text search, rows 1..n jump straight to the match. */
  function selectRow(row: number) {
    if (row <= 0) runTextSearch(query);
    else {
      const s = suggestions[row - 1];
      if (s) goToSuggestion(s);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runTextSearch(query);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const rows = suggestions.length + 1;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setHighlight((h) => (h + 1) % rows);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((h) => (h - 1 + rows) % rows);
    } else if (event.key === "Enter" && open && highlight > 0) {
      event.preventDefault();
      selectRow(highlight);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const inline = variant === "inline";
  const term = query.trim();
  const showSuggestions = open && term.length >= 2;
  const showHistory = open && term.length < 2 && history.length > 0;
  const showList = showSuggestions || showHistory;

  const rowClass = (active: boolean) =>
    `flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
      active
        ? "bg-emerald-50 text-slate-900 dark:bg-emerald-950 dark:text-slate-100"
        : "text-slate-700 dark:text-slate-300"
    }`;

  return (
    <div
      className="relative w-full max-w-xl"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <form
        onSubmit={onSubmit}
        role="search"
        className={
          inline
            ? "flex w-full flex-row gap-2"
            : "flex w-full flex-col gap-2 sm:flex-row"
        }
      >
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(0);
          }}
          onFocus={() => {
            if (term.length >= 2) {
              setOpen(true);
            } else {
              const recent = getSearchHistory();
              setHistory(recent);
              setOpen(recent.length > 0);
            }
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search products"
          aria-expanded={showList}
          aria-autocomplete="list"
          role="combobox"
          autoComplete="off"
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

      {showHistory && (
        <ul
          role="listbox"
          aria-label="Recent searches"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <li
            aria-hidden
            className="px-4 pb-1 pt-2 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500"
          >
            Recent searches
          </li>
          {history.map((item) => (
            <li key={item} role="option" aria-selected={false} className="flex items-center">
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  setQuery(item);
                  runTextSearch(item);
                }}
                className="flex min-w-0 flex-1 items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <span aria-hidden className="text-slate-400">
                  ◷
                </span>
                <span className="truncate">{item}</span>
              </button>
              <button
                type="button"
                aria-label={`Remove ${item} from history`}
                onMouseDown={(event) => {
                  event.preventDefault();
                  setHistory(removeSearchHistory(item));
                }}
                className="flex-none px-3 py-2.5 text-sm text-slate-400 hover:text-red-600 dark:text-slate-500"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      {showSuggestions && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          <li role="option" aria-selected={highlight === 0}>
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                selectRow(0);
              }}
              onMouseEnter={() => setHighlight(0)}
              className={rowClass(highlight === 0)}
            >
              <span aria-hidden className="text-slate-400">
                ⌕
              </span>
              <span className="truncate">
                Search for “<Highlighted text={term} term={term} />”
              </span>
            </button>
          </li>
          {suggestions.map((s, i) => (
            <li
              key={`${s.kind}-${s.id ?? s.label}`}
              role="option"
              aria-selected={highlight === i + 1}
            >
              <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectRow(i + 1);
                }}
                onMouseEnter={() => setHighlight(i + 1)}
                className={rowClass(highlight === i + 1)}
              >
                <span
                  aria-hidden
                  className="flex-none rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                >
                  {s.kind === "product"
                    ? "Item"
                    : s.kind === "shop"
                      ? "Shop"
                      : "Cat"}
                </span>
                <span className="min-w-0 flex-1">
                  <Highlighted text={s.label} term={term} />
                </span>
                {s.sub && (
                  <span className="flex-none truncate text-xs text-slate-400 dark:text-slate-500">
                    {s.sub}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}