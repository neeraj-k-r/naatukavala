"use client";

import { useState } from "react";

export default function ShopShareCard({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be unavailable — select the text as a fallback.
      const input = document.getElementById("shop-url");
      if (input instanceof HTMLInputElement) input.select();
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950">
      <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Your website</h3>
      <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
        Share this link with customers — visitors see only your shop and your
        products, with your branding, like your own private website.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          id="shop-url"
          readOnly
          value={url}
          onFocus={(event) => event.target.select()}
          className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 outline-none dark:border-emerald-800 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="button"
          onClick={copy}
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
