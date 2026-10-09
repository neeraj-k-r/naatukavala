"use client";

const KEY = "naatukavala:search-history";
const MAX_ITEMS = 8;

/** Recent searches, newest first (per-device, like Google). */
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

/** Adds a term to the top, de-duplicated, capped at MAX_ITEMS. */
export function addSearchHistory(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return getSearchHistory();
  const next = [
    trimmed,
    ...getSearchHistory().filter(
      (item) => item.toLowerCase() !== trimmed.toLowerCase(),
    ),
  ].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private mode etc. — history just won't persist.
  }
  return next;
}

/** Removes one term from history. */
export function removeSearchHistory(term: string): string[] {
  const next = getSearchHistory().filter(
    (item) => item.toLowerCase() !== term.trim().toLowerCase(),
  );
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Ignore persistence failures.
  }
  return next;
}

/** Clears all history. */
export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Ignore persistence failures.
  }
}
