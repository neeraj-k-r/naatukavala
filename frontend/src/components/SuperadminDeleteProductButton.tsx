"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { deleteProductAsAdmin } from "@/lib/actions";

export default function SuperadminDeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [state, action, pending] = useActionState(deleteProductAsAdmin, undefined);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open ]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setReason("");
          setOpen(true);
        }}
        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl backdrop:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-900"
      >
        <form action={action} className="space-y-4">
          <input type="hidden" name="product_id" value={productId} />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Delete product?
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              “{productName}” will be removed from the marketplace. Tell the
              seller why — this reason is saved to the deletion audit log.
            </p>
          </div>

          {state?.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </p>
          )}
          {state?.success && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              Product deleted. Close this dialog — the list refreshes automatically.
            </p>
          )}

          <div>
            <label
              htmlFor={`delete-reason-${productId}`}
              className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Reason for deletion
            </label>
            <textarea
              id={`delete-reason-${productId}`}
              name="reason"
              required
              minLength={5}
              maxLength={500}
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Prohibited item — violates marketplace policy"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {reason.trim().length}/500 · minimum 5 characters
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || reason.trim().length < 5}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {pending ? "Deleting…" : "Delete product"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
