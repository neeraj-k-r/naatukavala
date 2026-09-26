"use client";

import { useState, useTransition } from "react";

import { requestReturn } from "@/lib/actions";
import { DEFAULT_RETURN_REASONS } from "@/lib/types";

import type { OrderReturn, ReturnStatus } from "@/lib/types";

const statusLabels: Record<ReturnStatus, { label: string; className: string }> = {
  requested: {
    label: "Return requested — awaiting seller",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  },
  approved: {
    label: "Return approved by seller",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  },
  rejected: {
    label: "Return rejected by seller",
    className: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
};

export default function ReturnRequestForm({
  orderId,
  policy,
  existing,
}: {
  orderId: string;
  policy: string;
  existing: OrderReturn | null;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>(DEFAULT_RETURN_REASONS[0]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (existing) {
    const info = statusLabels[existing.status];
    return (
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Return request</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}>
            {info.label}
          </span>
          {existing.decided_at && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Decided on {new Date(existing.decided_at).toLocaleDateString()}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-medium">Reason:</span> {existing.reason}
        </p>
        {existing.description && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{existing.description}</p>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Returns</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{policy}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Request a return
        </button>
      </div>
    );
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void requestReturn(undefined, formData).then((result) => {
        if (result && "error" in result && typeof result.error === "string") {
          setError(result.error);
        }
      });
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800"
    >
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Request a return</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{policy}</p>

      <label
        htmlFor={`return_reason_${orderId}`}
        className="mt-3 mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        What is the issue?
      </label>
      <select
        id={`return_reason_${orderId}`}
        name="reason"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        {DEFAULT_RETURN_REASONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      <textarea
        name="description"
        rows={2}
        disabled={pending}
        placeholder={
          /other/i.test(reason)
            ? "Tell the seller what went wrong…"
            : "Add details (optional)"
        }
        required={/other/i.test(reason)}
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      />

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Submit return request"}
        </button>
      </div>

      <input type="hidden" name="order_id" value={orderId} />
    </form>
  );
}