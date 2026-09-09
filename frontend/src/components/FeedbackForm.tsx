"use client";

import { useState, useTransition } from "react";

import { submitFeedback } from "@/lib/actions";

export default function FeedbackForm({
  orderId,
  initialRating,
  initialFeedback,
}: {
  orderId: string;
  initialRating: number | null;
  initialFeedback: string | null;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void submitFeedback(undefined, formData).then((result) => {
        if (result && "error" in result && typeof result.error === "string") {
          setError(result.error);
        }
      });
    });
  }

  const hasFeedback = Boolean(initialRating || initialFeedback);

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
    >
      <p className="text-sm font-semibold text-slate-800">
        {hasFeedback ? "Your feedback" : "Leave feedback for this order"}
      </p>

      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => setRating(value)}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            className={`text-2xl leading-none transition-colors disabled:opacity-60 ${
              value <= rating ? "text-amber-400" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-xs font-medium text-slate-500">
            {rating}/5
          </span>
        )}
        <input type="hidden" name="rating" value={rating} readOnly />
      </div>

      <textarea
        name="feedback"
        rows={3}
        defaultValue={initialFeedback ?? ""}
        disabled={pending}
        placeholder="How was your order? Share what you liked or how it could be better…"
        className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 disabled:opacity-60"
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : hasFeedback
              ? "Update feedback"
              : "Submit feedback"}
        </button>
      </div>

      <input type="hidden" name="order_id" value={orderId} />
    </form>
  );
}