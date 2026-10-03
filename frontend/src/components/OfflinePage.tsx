"use client";

/**
 * Full-screen "market disconnected" state, shown when the browser reports
 * it is offline. Mirrors the friendly offline pages big marketplaces use
 * (a dog sleeping by the shop) instead of a blank screen or browser error.
 */
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#faf5e9] px-6 py-12 text-center dark:bg-slate-950">
      <OfflineIllustration />

      <h1 className="mt-8 text-2xl font-extrabold tracking-tight text-emerald-950 sm:text-3xl dark:text-emerald-50">
        Market disconnected
      </h1>
      <p className="mt-2 max-w-md text-sm text-slate-600 sm:text-base dark:text-slate-400">
        Looks like you&apos;re not connected to the internet. Your shops and
        products will be right here when you&apos;re back online.
      </p>

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-800"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden
        >
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
        Try again
      </button>
    </div>
  );
}

function OfflineIllustration() {
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label="A dog sleeping in front of a closed shop"
      className="w-64 max-w-full sm:w-80"
    >
      <ellipse cx="160" cy="208" rx="140" ry="20" fill="#e8dfc8" />

      <path
        d="M70 92 L160 46 L250 92 Z"
        fill="#c2410c"
        stroke="#7c2d12"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g stroke="#7c2d12" strokeWidth="3">
        <line x1="92" y1="86" x2="104" y2="70" />
        <line x1="122" y1="80" x2="134" y2="64" />
        <line x1="152" y1="76" x2="164" y2="60" />
        <line x1="182" y1="80" x2="194" y2="64" />
        <line x1="212" y1="86" x2="224" y2="70" />
      </g>
      <rect
        x="86"
        y="92"
        width="148"
        height="86"
        rx="6"
        fill="#b45309"
        stroke="#78350f"
        strokeWidth="4"
      />
      <g stroke="#78350f" strokeWidth="3" strokeLinecap="round">
        <line x1="100" y1="106" x2="220" y2="106" />
        <line x1="100" y1="120" x2="220" y2="120" />
        <line x1="100" y1="134" x2="220" y2="134" />
        <line x1="100" y1="148" x2="220" y2="148" />
      </g>
      <rect
        x="78"
        y="176"
        width="164"
        height="14"
        rx="4"
        fill="#92400e"
        stroke="#78350f"
        strokeWidth="4"
      />

      <ellipse cx="112" cy="196" rx="34" ry="16" fill="#d97706" />
      <circle cx="84" cy="188" r="13" fill="#d97706" />
      <path d="M76 180 Q70 168 80 172 Q86 176 82 182 Z" fill="#92400e" />
      <path
        d="M78 188 Q82 191 86 188"
        fill="none"
        stroke="#451a03"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M144 190 Q158 184 156 196"
        fill="none"
        stroke="#d97706"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="104" cy="206" rx="18" ry="5" fill="#b45309" opacity="0.5" />

      <g stroke="#78716c" strokeWidth="2.5" strokeLinecap="round">
        <path d="M238 120 h18 M247 111 v18" />
      </g>
      <circle cx="247" cy="120" r="14" fill="none" stroke="#78716c" strokeWidth="2.5" />
    </svg>
  );
}
