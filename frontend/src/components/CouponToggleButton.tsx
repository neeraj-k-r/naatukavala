"use client";

import { useActionState } from "react";

import { toggleCoupon } from "@/lib/actions";

export default function CouponToggleButton({
  couponId,
  isActive,
}: {
  couponId: string;
  isActive: boolean;
}) {
  const [state, action, pending] = useActionState(toggleCoupon, undefined);

  return (
    <div>
      {state?.error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      <form action={action}>
        <input type="hidden" name="coupon_id" value={couponId} />
        <input type="hidden" name="is_active" value={String(isActive)} />
        <button
          type="submit"
          disabled={pending}
          className={`rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
            isActive
              ? "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              : "border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
          }`}
        >
          {isActive ? "Pause" : "Activate"}
        </button>
      </form>
    </div>
  );
}
