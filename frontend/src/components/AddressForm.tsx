"use client";

import { useActionState } from "react";

import { updateProfile } from "@/lib/actions";
import SubmitButton from "@/components/SubmitButton";

/**
 * Saved delivery details: the buyer edits name, phone and address once
 * and checkout prefills them on every order.
 */
export default function AddressForm({
  initialName,
  initialPhone,
  initialAddress,
}: {
  initialName: string;
  initialPhone: string;
  initialAddress: string;
}) {
  const [state, action] = useActionState(updateProfile, undefined);

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
        Delivery details
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Saved here and prefilled automatically at checkout.
      </p>

      {state?.error && (
        <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="mt-3 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Saved.
        </p>
      )}

      <div className="mt-4 space-y-4">
        <div>
          <label
            htmlFor="profile-full-name"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Full name
          </label>
          <input
            id="profile-full-name"
            name="full_name"
            type="text"
            defaultValue={initialName}
            maxLength={100}
            autoComplete="name"
            placeholder="Your name"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Phone number
          </label>
          <input
            id="profile-phone"
            name="phone"
            type="tel"
            defaultValue={initialPhone}
            autoComplete="tel"
            placeholder="e.g. 98765 43210"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <div>
          <label
            htmlFor="profile-address"
            className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Address
          </label>
          <textarea
            id="profile-address"
            name="address"
            rows={3}
            defaultValue={initialAddress}
            maxLength={500}
            autoComplete="street-address"
            placeholder="House / street, area, city, PIN code"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        <SubmitButton
          pendingText="Saving…"
          className="bg-slate-900 text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Save details
        </SubmitButton>
      </div>
    </form>
  );
}
