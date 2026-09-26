"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleHelpful } from "@/lib/actions";

export default function HelpfulButton({
  orderId,
  initialVoted,
  initialCount,
  signedIn,
}: {
  orderId: string;
  initialVoted: boolean;
  initialCount: number;
  signedIn: boolean;
}) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const next = !voted;
    setVoted(next);
    setCount((prev) => Math.max(0, prev + (next ? 1 : -1)));
    startTransition(async () => {
      const formData = new FormData();
      formData.append("order_id", orderId);
      const result = await toggleHelpful(undefined, formData);
      if (!result || result.error) {
        setVoted(!next);
        setCount(initialCount);
      } else {
        setVoted(result.helpful ?? next);
        setCount(result.count ?? count);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={voted}
      className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-60 ${
        voted
          ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
      }`}
    >
      {voted ? "✓ " : ""}Helpful{count > 0 ? ` (${count})` : ""}
    </button>
  );
}
