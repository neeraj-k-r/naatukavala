import Link from "next/link";

import { requireSeller } from "@/lib/auth";
import { getShopByOwner } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSeller();
  const shop = await getShopByOwner(user.id);

  const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
    pending: {
      bg: "bg-amber-50 dark:bg-amber-950",
      text: "text-amber-800 dark:text-amber-200",
      label: "Your shop is pending approval.",
    },
    approved: {
      bg: "bg-emerald-50 dark:bg-emerald-950",
      text: "text-emerald-800 dark:text-emerald-200",
      label: "Your shop is live.",
    },
    rejected: {
      bg: "bg-red-50 dark:bg-red-950",
      text: "text-red-700 dark:text-red-300",
      label: "Your shop was not approved. Please contact support.",
    },
    suspended: {
      bg: "bg-red-50 dark:bg-red-950",
      text: "text-red-700 dark:text-red-300",
      label: "Your shop has been suspended.",
    },
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900 dark:text-slate-100">Seller dashboard</h1>

      {shop && statusStyles[shop.status] && (
        <div
          className={`mb-6 rounded-2xl px-5 py-4 text-sm font-medium ${statusStyles[shop.status].bg} ${statusStyles[shop.status].text}`}
        >
          {statusStyles[shop.status].label}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <nav className="flex flex-col gap-1">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              Overview
            </Link>
            <Link href="/dashboard/shop" className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              Shop profile
            </Link>
            <Link href="/dashboard/products" className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              Products
            </Link>
            <Link href="/dashboard/orders" className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              Orders
            </Link>
            <Link href="/dashboard/analytics" className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              Sales
            </Link>
            <Link href="/dashboard/promotion" className="rounded-lg px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              Promote
            </Link>
            <Link href="/" className="mt-4 rounded-lg px-3 py-2 text-slate-400 hover:text-emerald-700 dark:text-slate-500 dark:hover:text-emerald-400">
              Marketplace
            </Link>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}