"use client";

import { useTransition } from "react";

import { updateOrderStatus } from "@/lib/actions";

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

export default function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void updateOrderStatus(undefined, formData);
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2">
      <input type="hidden" name="order_id" value={orderId} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        disabled={pending}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium capitalize text-slate-700 outline-none focus:border-emerald-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
      >
        {statuses.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </form>
  );
}