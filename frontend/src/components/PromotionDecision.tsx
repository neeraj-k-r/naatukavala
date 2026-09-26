"use client";

import { useActionState } from "react";

import { decidePromotion } from "@/lib/actions";

const durations = ["7", "15", "30", "60", "90"];

export default function PromotionDecision({
  promotionId,
  status,
}: {
  promotionId: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(decidePromotion, undefined);

  return (
    <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      {state?.error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}

      {status === "requested" && (
        <div className="flex flex-col gap-2">
          <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="promotion_id" value={promotionId} />
            <input type="hidden" name="decision" value="approve" />
            <select
              name="duration_days"
              defaultValue="30"
              aria-label="Promotion duration"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {durations.map((days) => (
                <option key={days} value={days}>
                  {days} days
                </option>
              ))}
            </select>
            <input
              name="decision_note"
              type="text"
              maxLength={300}
              placeholder="Note for seller (optional)"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Approve
            </button>
          </form>
          <form action={action} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="promotion_id" value={promotionId} />
            <input type="hidden" name="decision" value="reject" />
            <input
              name="decision_note"
              type="text"
              maxLength={300}
              placeholder="Rejection reason (optional)"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
            >
              Reject
            </button>
          </form>
        </div>
      )}

      {status === "approved" && (
        <form action={action} className="flex items-center gap-2">
          <input type="hidden" name="promotion_id" value={promotionId} />
          <input type="hidden" name="decision" value="expire" />
          <p className="flex-1 text-xs text-emerald-700 dark:text-emerald-400">
            Live in the marketplace spotlight.
          </p>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            End promotion
          </button>
        </form>
      )}
    </div>
  );
}
