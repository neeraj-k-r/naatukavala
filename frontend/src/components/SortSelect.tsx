"use client";

import { useEffect, useRef, useState } from "react";

export interface SortOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Custom sort dropdown in the app font. Native <select> option popups are
 * rendered by the OS (wrong font, blue highlight) and can't be styled —
 * this listbox version stays on-brand in light and dark mode.
 */
export default function SortSelect<T extends string>({
  value,
  options,
  onChange,
  label = "Sort products",
}: {
  value: T;
  options: SortOption<T>[];
  onChange: (next: T) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open ]);

  const current = options.find((option) => option.value === value);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 font-sans text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-emerald-400 focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500"
      >
        <span className="truncate">{current?.label ?? ""}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`h-4 w-4 flex-none text-slate-400 transition-transform dark:text-slate-500 ${open ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white py-1 font-sans shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition ${
                    selected
                      ? "bg-emerald-50 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      : "font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {selected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                      className="h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
