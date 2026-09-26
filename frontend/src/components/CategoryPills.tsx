import Link from "next/link";

export default function CategoryPills({
  categories,
  active,
}: {
  categories: string[];
  active: string;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Pill href="/" active={active === ""}>
        All
      </Pill>
      {categories.map((category) => (
        <Pill
          key={category}
          href={`/?category=${encodeURIComponent(category)}`}
          active={active === category}
        >
          {category}
        </Pill>
      ))}
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-emerald-600 bg-emerald-600 text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
      }`}
    >
      {children}
    </Link>
  );
}
