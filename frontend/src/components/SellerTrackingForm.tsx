"use client";

import { useState, useTransition } from "react";

import { addTrackingNumber } from "@/lib/actions";

export default function SellerTrackingForm({
  orderId,
  status,
  initialTracking,
}: {
  orderId: string;
  status: string;
  initialTracking: string | null;
}) {
  const [value, setValue] = useState(initialTracking ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void addTrackingNumber(undefined, formData).then((result) => {
        if (result && "error" in result && typeof result.error === "string") {
          setError(result.error);
        }
      });
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <input
        name="tracking_number"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        disabled={pending}
        placeholder={
          initialTracking ? "Update tracking number" : "Add tracking number (e.g. courier AWB)"
        }
        className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      />
      <button
        type="submit"
        disabled={pending || value.trim().length === 0}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        {pending ? "Saving…" : initialTracking ? "Update" : "Add"}
      </button>
      {error && <p className="w-full text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}