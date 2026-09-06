import Link from "next/link";

import { getCategories } from "@/lib/api";

export default async function CategoryPills() {
  const categories = await getCategories();

  if (categories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href="/"
        className="rounded-full border border-emerald-600 bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white"
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category}
          href={`/?category=${encodeURIComponent(category)}`}
          className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-emerald-400 hover:text-emerald-700"
        >
          {category}
        </Link>
      ))}
    </div>
  );
}