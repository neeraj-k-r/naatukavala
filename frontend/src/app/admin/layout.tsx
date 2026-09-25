import Link from "next/link";

import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Admin panel ·{" "}
        <span className="text-base font-medium text-slate-500 capitalize">
          {user.profile?.role ?? user.role}
        </span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-[200px_1fr]">
        <aside className="rounded-2xl border border-slate-100 bg-white p-4 text-sm font-medium text-slate-600 shadow-sm">
          <nav className="flex flex-col gap-1">
            <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              Overview
            </Link>
            <Link href="/admin/reports" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              📊 Sales report
            </Link>
            <Link href="/admin/bookings" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              📦 Bookings & dispatch
            </Link>
            <Link href="/admin/shops" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              Shops & sellers
            </Link>
            <Link href="/admin/promotions" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              Promotions
            </Link>
            <Link href="/admin/notifications" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              Alerts
            </Link>
            <Link href="/admin/users" className="rounded-lg px-3 py-2 hover:bg-slate-50">
              Users & roles
            </Link>
            <Link href="/" className="mt-4 rounded-lg px-3 py-2 text-slate-400 hover:text-emerald-700">
              Marketplace
            </Link>
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}