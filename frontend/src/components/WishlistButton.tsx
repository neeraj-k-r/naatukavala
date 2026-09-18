"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { toggleWishlist } from "@/lib/actions";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`h-5 w-5 ${filled ? "fill-rose-500 stroke-rose-500" : "fill-none stroke-slate-500"}`}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

export default function WishlistButton({
  productId,
  initialWished,
  signedIn,
  size = "card",
}: {
  productId: string;
  initialWished: boolean;
  signedIn: boolean;
  size?: "card" | "detail";
}) {
  const [wished, setWished] = useState(initialWished);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onClick(event: React.MouseEvent) {
    // Product cards are links — don't navigate when tapping the heart.
    event.preventDefault();
    event.stopPropagation();
    if (!signedIn) {
      router.push("/login");
      return;
    }
    const next = !wished;
    setWished(next);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("product_id", productId);
      const result = await toggleWishlist(undefined, formData);
      if (result?.error) {
        setWished(!next);
      } else {
        setWished(result?.wished ?? next);
        router.refresh();
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={wished}
      className={
        size === "card"
          ? "absolute bottom-2 right-2 rounded-full bg-white/90 p-2 shadow-sm ring-1 ring-slate-200 transition hover:scale-105 disabled:opacity-60"
          : "inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      }
    >
      <HeartIcon filled={wished} />
      {size === "detail" && (wished ? "Saved" : "Wishlist")}
    </button>
  );
}
