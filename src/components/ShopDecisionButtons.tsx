"use client";

import { useActionState } from "react";

import { approveShop } from "@/lib/actions";

export default function ShopDecisionButtons({
  shopId,
  status,
}: {
  shopId: string;
  status: string;
}) {
  const [, action, pending] = useActionState(approveShop, undefined);

  return (
    <div className="flex items-center gap-2">
      {status !== "approved" && (
        <form action={action}>
          <input type="hidden" name="shop_id" value={shopId} />
          <input type="hidden" name="decision" value="approve" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Approve
          </button>
        </form>
      )}

      {status === "pending" && (
        <form action={action}>
          <input type="hidden" name="shop_id" value={shopId} />
          <input type="hidden" name="decision" value="reject" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
        </form>
      )}

      {status === "approved" && (
        <form action={action}>
          <input type="hidden" name="shop_id" value={shopId} />
          <input type="hidden" name="decision" value="suspend" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Suspend
          </button>
        </form>
      )}

      <span
        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
          status === "approved"
            ? "bg-emerald-100 text-emerald-800"
            : status === "pending"
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-700"
        }`}
      >
        {status}
      </span>
    </div>
  );
}