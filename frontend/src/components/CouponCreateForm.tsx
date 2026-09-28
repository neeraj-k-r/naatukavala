"use client";

import { useActionState, useState } from "react";

import { createCoupon } from "@/lib/actions";
import SubmitButton from "@/components/SubmitButton";

export default function CouponCreateForm() {
  const [state, action] = useActionState(createCoupon, undefined);
  const [kind, setKind] = useState("flat");

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="font-bold text-slate-900 dark:text-slate-100">
        New coupon code
      </h3>

      {state?.error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Coupon created — buyers can use it right away.
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="coupon-code"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Code
          </label>
          <input
            id="coupon-code"
            name="code"
            type="text"
            required
            placeholder="e.g. SAVE10"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm uppercase outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div>
          <label
            htmlFor="coupon-kind"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Discount type
          </label>
          <select
            id="coupon-kind"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <option value="flat">Flat ₹ off (once per checkout)</option>
            <option value="percent">Percent % off (per shop order)</option>
          </select>
        </div>
        <div>
          <label
            htmlFor="coupon-value"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Value {kind === "flat" ? "(₹)" : "(%)"}
          </label>
          <input
            id="coupon-value"
            name="value"
            type="number"
            min="1"
            step="any"
            required
            placeholder={kind === "flat" ? "e.g. 10" : "e.g. 10"}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div>
          <label
            htmlFor="coupon-min"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Minimum order (₹)
          </label>
          <input
            id="coupon-min"
            name="min_order_value"
            type="number"
            min="0"
            step="any"
            defaultValue={0}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        {kind === "percent" && (
          <div>
            <label
              htmlFor="coupon-cap"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Max discount per order (₹, optional)
            </label>
            <input
              id="coupon-cap"
              name="max_discount"
              type="number"
              min="1"
              step="any"
              placeholder="No cap"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
        )}
        <div>
          <label
            htmlFor="coupon-max-uses"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Total uses (optional)
          </label>
          <input
            id="coupon-max-uses"
            name="max_uses"
            type="number"
            min="1"
            step="1"
            placeholder="Unlimited"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div>
          <label
            htmlFor="coupon-per-user"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Uses per buyer
          </label>
          <input
            id="coupon-per-user"
            name="per_user_limit"
            type="number"
            min="1"
            step="1"
            defaultValue={1}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
        <div>
          <label
            htmlFor="coupon-ends"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Expires on (optional)
          </label>
          <input
            id="coupon-ends"
            name="ends_at"
            type="date"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>
      </div>

      <SubmitButton
        pendingText="Creating…"
        className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Create coupon
      </SubmitButton>
    </form>
  );
}
