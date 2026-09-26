"use client";

import Image from "next/image";
import { useActionState } from "react";

import { decideVerification } from "@/lib/actions";

export default function VerificationDecision({
  shopId,
  docUrl,
  status,
}: {
  shopId: string;
  docUrl: string | null;
  status: string;
}) {
  const [, action, pending] = useActionState(decideVerification, undefined);

  if (!docUrl || status === "none") {
    return null;
  }

  return (
    <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        Identity verification
      </p>

      <div className="mt-2 flex items-start gap-3">
        <a
          href={docUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-700"
        >
          <Image
            src={docUrl}
            alt="Identity document"
            fill
            sizes="128px"
            className="object-cover"
          />
        </a>

        <div className="flex items-center gap-2">
          {status === "pending" && (
            <>
              <form action={action}>
                <input type="hidden" name="shop_id" value={shopId} />
                <input type="hidden" name="decision" value="verified" />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  Verify
                </button>
              </form>
              <form action={action}>
                <input type="hidden" name="shop_id" value={shopId} />
                <input type="hidden" name="decision" value="rejected" />
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950"
                >
                  Reject
                </button>
              </form>
            </>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
              status === "verified"
                ? "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200"
                : status === "pending"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                  : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}