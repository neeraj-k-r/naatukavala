"use client";

import { useActionState } from "react";

import { requestPromotion } from "@/lib/actions";
import SubmitButton from "@/components/SubmitButton";

import type { Product } from "@/lib/types";

export default function PromotionRequestForm({
  shopName,
  products,
}: {
  shopName: string;
  products: Product[];
}) {
  const [state, action] = useActionState(requestPromotion, undefined);

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-bold text-slate-900">Request a sponsored spot</h3>
      <p className="mt-1 text-sm text-slate-500">
        Approved promotions appear in the marketplace spotlight with a
        Sponsored badge, like Flipkart and Amazon ads.
      </p>

      {state?.error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Request sent! Our team will review it soon.
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="target"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          What should we promote?
        </label>
        <select
          id="target"
          name="target"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="shop">My whole shop — {shopName}</option>
          {products
            .filter((product) => product.is_active)
            .map((product) => (
              <option key={product.id} value={product.id}>
                Product — {product.name}
              </option>
            ))}
        </select>
      </div>

      <div className="mt-4">
        <label
          htmlFor="note"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          Note for the review team{" "}
          <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={300}
          placeholder="e.g. Festival offer on this product this month"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <SubmitButton
        pendingText="Sending request…"
        className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Request promotion
      </SubmitButton>
    </form>
  );
}
