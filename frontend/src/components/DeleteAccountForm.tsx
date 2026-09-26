"use client";

import { useActionState, useState } from "react";

import { deleteAccount } from "@/lib/actions";

export default function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccount, undefined);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
      >
        Delete my account
      </button>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900 dark:bg-red-950/40"
    >
      <p className="text-sm font-semibold text-red-900 dark:text-red-100">
        Delete your account permanently?
      </p>
      <p className="mt-1 text-sm text-red-700 dark:text-red-300">
        Your profile, wishlist and order history are removed and this cannot
        be undone. Shops with order history cannot be deleted this way.
      </p>

      {state?.error && (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-sm text-red-700 dark:bg-slate-900 dark:text-red-300">
          {state.error}
        </p>
      )}

      <label
        htmlFor="delete-password"
        className="mb-1.5 mt-4 block text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Enter your password to confirm
      </label>
      <input
        id="delete-password"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        disabled={pending}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-red-400 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      />

      <div className="mt-4 flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Deleting…" : "Delete forever"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
