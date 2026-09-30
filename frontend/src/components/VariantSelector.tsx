"use client";

import type { ProductVariant } from "@/lib/types";

export default function VariantSelector({
  variants,
  selectedId,
  onSelect,
}: {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const groups = new Map<string, ProductVariant[]>();
  for (const variant of variants.filter((v) => v.is_active)) {
    const list = groups.get(variant.option_name) ?? [];
    list.push(variant);
    groups.set(variant.option_name, list);
  }

  if (groups.size === 0) return null;

  return (
    <div className="mt-5 space-y-3">
      {[...groups.entries()].map(([name, options]) => (
        <div key={name}>
          <p className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            {name}
          </p>
          <div className="flex flex-wrap gap-2">
            {options.map((option) => {
              const active = option.id === selectedId;
              const soldOut = option.stock <= 0;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => onSelect(option.id)}
                  aria-pressed={active}
                  title={`${option.option_value} · ₹${option.price}`}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
                    active
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
                  }`}
                >
                  {option.option_value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
