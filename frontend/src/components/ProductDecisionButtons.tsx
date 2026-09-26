"use client";

import { useActionState } from "react";

import { decideProductApproval } from "@/lib/actions";

export default function ProductDecisionButtons({
  productId,
}: {
  productId: string;
}) {
  const [state, action, pending] = useActionState(decideProductApproval, undefined);

  return (
    <div>
      {state?.error && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-2">
        <form action={action}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="decision" value="approve" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Approve
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="product_id" value={productId} />
          <input type="hidden" name="decision" value="reject" />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            Reject
          </button>
        </form>
      </div>
    </div>
  );
}
