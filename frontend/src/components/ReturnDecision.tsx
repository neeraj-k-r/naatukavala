"use client";

import { useState, useTransition } from "react";

import { decideReturn } from "@/lib/actions";

import type { OrderReturn } from "@/lib/types";

export default function ReturnDecision({
  orderId,
  ret,
}: {
  orderId: string;
  ret: OrderReturn;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function decide(decision: "approved" | "rejected") {
    setError(null);
    const formData = new FormData();
    formData.set("order_id", orderId);
    formData.set("decision", decision);
    startTransition(() => {
      void decideReturn(undefined, formData).then((result) => {
        if (result && "error" in result && typeof result.error === "string") {
          setError(result.error);
        }
      });
    });
  }

  return (
    <div className="mt-3 rounded-xl bg-violet-50 p-3 dark:bg-violet-950">
      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Return requested</p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
        <span className="font-medium">Reason:</span> {ret.reason}
      </p>
      {ret.description && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{ret.description}</p>
      )}
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Requested on {new Date(ret.created_at).toLocaleDateString()}
      </p>

      {ret.status === "requested" ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("approved")}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Approve return
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => decide("rejected")}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
          >
            Reject
          </button>
        </div>
      ) : (
        <p
          className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
            ret.status === "approved"
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
          }`}
        >
          {ret.status === "approved" ? "Approved" : "Rejected"}
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}