"use client";

import { useState, useTransition } from "react";

import { updateAdminBooking } from "@/lib/actions";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default function AdminBookingActions({
  orderId,
  status,
  tracking,
}: {
  orderId: string;
  status: string;
  tracking: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [editingTracking, setEditingTracking] = useState(false);

  function submit(formData: FormData) {
    setMessage(null);
    startTransition(async () => {
      const result = await updateAdminBooking(undefined, formData);
      if (result?.error) setMessage(result.error);
      else {
        setMessage("Saved ✓");
        setEditingTracking(false);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action={submit}
        className="flex items-center gap-2"
        onChange={(e) => e.currentTarget.requestSubmit()}
      >
        <input type="hidden" name="order_id" value={orderId} />
        <input type="hidden" name="tracking_number" value={tracking ?? ""} />
        <select
          name="status"
          defaultValue={status}
          disabled={isPending}
          aria-label="Update booking status"
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold capitalize text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
        >
          {STATUSES.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </form>

      {editingTracking ? (
        <form action={submit} className="flex items-center gap-1.5">
          <input type="hidden" name="order_id" value={orderId} />
          <input type="hidden" name="status" value={status} />
          <input
            name="tracking_number"
            defaultValue={tracking ?? ""}
            placeholder="Tracking #"
            disabled={isPending}
            className="w-32 rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditingTracking(false)}
            className="px-1 text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setEditingTracking(true)}
          title={tracking ? `Tracking: ${tracking}` : "Add tracking number"}
          className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold ${
            tracking
              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 dark:hover:bg-emerald-900"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300 dark:hover:bg-amber-900"
          }`}
        >
          {tracking ? `📦 ${tracking.length > 14 ? `${tracking.slice(0, 14)}…` : tracking}` : "+ tracking"}
        </button>
      )}
      {message && <span className="text-[11px] text-slate-400 dark:text-slate-500">{message}</span>}
    </div>
  );
}
