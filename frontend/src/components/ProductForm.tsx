"use client";

import { useActionState } from "react";

import ProductImageUpload from "@/components/ProductImageUpload";
import SubmitButton from "@/components/SubmitButton";

import type { Product } from "@/lib/types";

type Action = (state: unknown, formData: FormData) => Promise<unknown>;

export default function ProductForm({
  product,
  action,
  submitLabel,
}: {
  product?: Product;
  action: Action;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-5">
      {product && <input type="hidden" name="id" value={product.id} />}
      {product && (
        <input type="hidden" name="is_active" value={String(product.is_active)} />
      )}

      {state !== null &&
        typeof state === "object" &&
        "error" in state && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {String((state as { error: string }).error)}
          </div>
        )}

      <div>
        <label
          htmlFor="product_name"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Product name
        </label>
        <input
          id="product_name"
          name="name"
          type="text"
          required
          defaultValue={product?.name ?? ""}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="price"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Price (₹)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.price ?? ""}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
        <div>
          <label
            htmlFor="stock"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Stock quantity
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min="0"
            required
            defaultValue={product?.stock ?? 0}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Category
        </label>
        <input
          id="category"
          name="category"
          type="text"
          placeholder="e.g. Stationery, Grocery, Craft"
          defaultValue={product?.category ?? ""}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <ProductImageUpload initialImages={product?.images ?? []} />

      <SubmitButton
        pendingText="Saving…"
        className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
      >
        {submitLabel}
      </SubmitButton>
    </form>
  );
}