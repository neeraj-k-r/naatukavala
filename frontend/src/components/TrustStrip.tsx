const items = [
  {
    title: "100% local shops",
    text: "Every seller is a neighbourhood shop or independent vendor.",
    icon: (
      <path d="M4 10v10h16V10M3 10l1.5-5h15L21 10M9 20v-6h6v6M4 10h16" />
    ),
  },
  {
    title: "Verified sellers",
    text: "Look for the badge — shop identities are checked.",
    icon: (
      <path d="M12 3l2.5 1 2.7-.4 1 2.5 2.5 1-.4 2.7L21.5 12l-1 2.5.4 2.7-2.5 1-1 2.5-2.7-.4-2.5 1-2.5-1-2.7.4-1-2.5-2.5-1 .4-2.7L2.5 12l1-2.5-.4-2.7 2.5-1 1-2.5 2.7.4L12 3zM9 12l2 2 4-4" />
    ),
  },
  {
    title: "Secure checkout",
    text: "Payments and accounts guarded by industry standards.",
    icon: (
      <path d="M12 3l8 3v6c0 4.5-3.2 7.6-8 9-4.8-1.4-8-4.5-8-9V6l8-3zM9 12l2 2 4-4" />
    ),
  },
];

/**
 * Honest reassurance strip under the hero: only claims the marketplace
 * actually keeps (no free-shipping / COD promises — those vary per shop).
 */
export default function TrustStrip() {
  return (
    <section
      aria-label="Why shop with Naatukavala"
      className="mb-5 grid grid-cols-1 gap-2 sm:mb-6 sm:grid-cols-3 sm:gap-3"
    >
      {items.map((item) => (
        <div
          key={item.title}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              {item.icon}
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {item.title}
            </span>
            <span className="block text-xs leading-snug text-slate-500 sm:text-[13px] dark:text-slate-400">
              {item.text}
            </span>
          </span>
        </div>
      ))}
    </section>
  );
}
