import Image from "next/image";

import HelpfulButton from "@/components/HelpfulButton";
import { formatDate } from "@/lib/utils";

import type { RatingSummary } from "@/lib/types";

function stars(value: number) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
}

export default function ReviewsSection({
  summary,
  title,
  emptyMessage,
  votedIds,
  signedIn = false,
}: {
  summary: RatingSummary;
  title: string;
  emptyMessage: string;
  votedIds?: ReadonlySet<string>;
  signedIn?: boolean;
}) {
  if (summary.count === 0) {
    return (
      <section className="mt-12">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      </section>
    );
  }

  const max = Math.max(...summary.distribution.map((entry) => entry.count), 1);

  return (
    <section className="mt-12">
      <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>

      <div className="mt-4 grid gap-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[200px_1fr]">
        <div className="text-center md:border-r md:border-slate-100 md:pr-6 dark:md:border-slate-800">
          <p className="text-5xl font-extrabold text-slate-900 dark:text-slate-100">
            {summary.average?.toFixed(1) ?? "—"}
          </p>
          <p className="mt-1 tracking-wide text-amber-400">
            {stars(summary.average ?? 0)}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {summary.count} review{summary.count === 1 ? "" : "s"}
          </p>
        </div>

        <div className="space-y-1.5 self-center">
          {summary.distribution.map(({ stars: value, count }) => (
            <div key={value} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-right text-slate-500 dark:text-slate-400">{value}</span>
              <span className="text-amber-400">★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${count / max * 100}%` }}
                />
              </div>
              <span className="w-6 text-right text-slate-400 dark:text-slate-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {summary.reviews.map((review, index) => (
          <li
            key={index}
            className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="tracking-wide text-amber-400">
                {stars(review.rating)}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {review.created_at ? formatDate(review.created_at) : ""}
              </span>
            </div>
            {review.feedback && (
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {review.feedback}
              </p>
            )}
            {review.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {review.images.map((src) => (
                  <div
                    key={src}
                    className="relative h-20 w-20 overflow-hidden rounded-lg border border-slate-100 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <Image
                      src={src}
                      alt="Customer review photo"
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              {review.buyer_name || "Verified buyer"}
            </p>
            <HelpfulButton
              orderId={review.order_id}
              initialVoted={votedIds?.has(review.order_id) ?? false}
              initialCount={review.helpful_count}
              signedIn={signedIn}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}