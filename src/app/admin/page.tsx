import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { getAllShops } from "@/lib/admin-queries";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Admin panel",
};

export default async function AdminOverviewPage() {
  const user = await requireAdmin();
  const shops = await getAllShops();
  const pending = shops.filter((shop) => shop.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Overview</h2>
        <p className="mt-1 text-sm text-slate-500">
          Signed in as {user.profile?.role ?? user.role} · {user.email}
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pending.length} shop{pending.length === 1 ? "" : "s"} awaiting
              approval
            </p>
            <p className="text-xs text-amber-700">
              Review new sellers so their stores go live.
            </p>
          </div>
          <Link
            href="/admin/shops"
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            Review shops
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/shops"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md"
        >
          <p className="text-sm text-slate-500">Shops</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {shops.length}
          </p>
          <p className="mt-1 text-xs text-amber-600">
            {pending.length} pending approval
          </p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md"
        >
          <p className="text-sm text-slate-500">Pending reviews</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {pending.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Go to shops approval</p>
        </Link>
        <Link
          href="/admin/users"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md"
        >
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            Manage
          </p>
          <p className="mt-1 text-xs text-slate-400">Roles & accounts</p>
        </Link>
      </div>

      {pending.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900">Pending shops</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {pending.map((shop) => (
              <li key={shop.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {shop.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {shop.slug} · joined {formatDate(shop.created_at)} ·{" "}
                    {shop.owner_name ?? "unknown owner"}
                  </p>
                </div>
                <Link
                  href="/admin/shops"
                  className="text-sm font-medium text-emerald-700 hover:underline"
                >
                  Review →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}