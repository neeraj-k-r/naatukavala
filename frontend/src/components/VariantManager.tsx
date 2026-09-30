"use client";

import { useState } from "react";

import type { ProductVariant } from "@/lib/types";

interface VariantRow {
  key: number;
  option_name: string;
  option_value: string;
  price: string;
  stock: string;
}

function toRow(variant: ProductVariant, key: number): VariantRow {
  return {
    key,
    option_name: variant.option_name,
    option_value: variant.option_value,
    price: String(variant.price),
    stock: String(variant.stock),
  };
}

/**
 * Dynamic option rows (Size:Large, Color:Red, …) serialized into a hidden
 * `variants` JSON field the product actions forward to the backend.
 */
export default function VariantManager({
  initial = [],
}: {
  initial?: ProductVariant[];
}) {
  const [rows, setRows] = useState<VariantRow[]>(() =>
    initial.map((variant, index) => toRow(variant, index)),
  );
  const [nextKey, setNextKey] = useState(initial.length);

  function updateRow(key: number, patch: Partial<VariantRow>) {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: nextKey, option_name: "", option_value: "", price: "", stock: "" },
    ]);
    setNextKey((key) => key + 1);
  }

  const payload = JSON.stringify(
    rows
      .filter((row) => row.option_name.trim() && row.option_value.trim())
      .map((row) => ({
        option_name: row.option_name.trim(),
        option_value: row.option_value.trim(),
        price: Number(row.price) || 0,
        stock: Math.max(0, Math.floor(Number(row.stock) || 0)),
      })),
  );

  return (
    <div>
      <input type="hidden" name="variants" value={payload} />
      <p className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Options{" "}
        <span className="font-normal text-slate-400 dark:text-slate-500">
          (optional — e.g. Size, Color, each with own price & stock)
        </span>
      </p>

      {rows.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">
          No options — buyers purchase at the base price and stock above.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.key} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_90px_80px_auto]">
              <input
                value={row.option_name}
                onChange={(event) =>
                  updateRow(row.key, { option_name: event.target.value })
                }
                placeholder="Option (Size)"
                aria-label="Option name"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <input
                value={row.option_value}
                onChange={(event) =>
                  updateRow(row.key, { option_value: event.target.value })
                }
                placeholder="Value (Large)"
                aria-label="Option value"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <input
                value={row.price}
                onChange={(event) =>
                  updateRow(row.key, { price: event.target.value })
                }
                placeholder="₹ price"
                aria-label="Variant price"
                type="number"
                min="0"
                step="any"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <input
                value={row.stock}
                onChange={(event) =>
                  updateRow(row.key, { stock: event.target.value })
                }
                placeholder="Stock"
                aria-label="Variant stock"
                type="number"
                min="0"
                step="1"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() =>
                  setRows((prev) => prev.filter((r) => r.key !== row.key))
                }
                aria-label="Remove option"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400 hover:text-red-600 dark:border-slate-700 dark:text-slate-500 dark:hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={addRow}
        className="mt-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-600 dark:text-slate-300 dark:hover:text-emerald-400"
      >
        + Add option
      </button>
    </div>
  );
}
