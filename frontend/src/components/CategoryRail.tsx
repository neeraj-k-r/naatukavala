import Link from "next/link";

/**
 * Flipkart-style "shop by category" rail: horizontally scrolling tiles.
 * Keeps the active search term so switching category doesn't lose it.
 */
export default function CategoryRail({
  categories,
  active,
  search,
}: {
  categories: string[];
  active: string;
  search: string;
}) {
  if (categories.length === 0) return null;

  const hrefFor = (category: string) => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (category) params.set("category", category);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <section aria-label="Shop by category" className="w-full sm:min-w-0 sm:flex-1">
      <div className="-mx-4 flex snap-x snap-mandatory gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        <RailTile label="All" href={hrefFor("")} active={active === ""} />
        {categories.map((category) => (
          <RailTile
            key={category}
            label={category}
            href={hrefFor(category)}
            active={active === category}
          />
        ))}
      </div>
    </section>
  );
}

function RailTile({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={`flex flex-none snap-start items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium shadow-sm transition sm:px-4 ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
      }`}
    >
      <span
        aria-hidden
        className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-extrabold ${
          active
            ? "bg-white/20 text-white"
            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
        }`}
      >
        {label.slice(0, 1).toUpperCase()}
      </span>
      <span className="max-w-28 truncate">{label}</span>
    </Link>
  );
}
