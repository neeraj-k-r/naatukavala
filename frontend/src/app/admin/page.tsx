import Link from "next/link";

import { requireAdmin } from "@/lib/auth";
import { getAdminSalesReport, getAllPromotions, getAllShops } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Admin panel",
};

async function loadPromotions() {
  try {
    return { list: await getAllPromotions(), available: true };
  } catch {
    return { list: [], available: false };
  }
}

export default async function AdminOverviewPage() {
  const user = await requireAdmin();
  // Promotions (and the sales report) degrade gracefully when their backend
  // pieces aren't ready yet — the rest of the overview must still render.
  const [shops, promoResult, report] = await Promise.all([
    getAllShops(),
    loadPromotions(),
    getAdminSalesReport().catch(() => null),
  ]);
  const promotions = promoResult.list;
  const promotionsAvailable = promoResult.available;
  const pending = shops.filter((shop) => shop.status === "pending");
  const pendingPromotions = promotions.filter(
    (promotion) => promotion.status === "requested",
  );

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
              {pendingPromotions.length > 0 && (
                <> · {pendingPromotions.length} promotion request{pendingPromotions.length === 1 ? "" : "s"}</>
              )}
            </p>
            <p className="text-xs text-amber-700">
              Review new sellers so their stores go live.
            </p>
          </div>
          <div className="flex gap-2">
            {pendingPromotions.length > 0 && (
              <Link
                href="/admin/promotions"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Review promotions
              </Link>
            )}
            <Link
              href="/admin/shops"
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Review shops
            </Link>
          </div>
        </div>
      </div>

      {!promotionsAvailable && (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
          Promotions are unavailable — run{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            backend/supabase/migrations/20260919_promotions.sql
          </code>{" "}
          in the Supabase SQL editor to enable them.
        </div>
      )}

      {report && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                {formatCurrency(report.summary.totalRevenue, report.currency)} lifetime revenue ·{" "}
                {report.summary.upcoming} upcoming · {report.summary.inTransit} in transit
                {report.summary.needsTracking > 0 && (
                  <> · {report.summary.needsTracking} need tracking ⚠️</>
                )}
              </p>
              <p className="text-xs text-emerald-700">
                Today {formatCurrency(report.summary.todayRevenue, report.currency)} · last 7d{" "}
                {formatCurrency(report.summary.last7Revenue, report.currency)} · delivered{" "}
                {report.summary.delivered}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/admin/reports"
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Sales report
              </Link>
              <Link
                href="/admin/bookings?group=dispatch"
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50"
              >
                Dispatch queue
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/reports"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md"
        >
          <p className="text-sm text-slate-500">📊 Sales (30d)</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {report ? formatCurrency(report.summary.last30Revenue, report.currency) : "—"}
          </p>
          <p className="mt-1 text-xs text-emerald-600">
            {report ? `${report.summary.netOrders} net orders` : "View sales report"} →
          </p>
        </Link>
        <Link
          href="/admin/bookings?group=upcoming"
          className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md"
        >
          <p className="text-sm text-slate-500">📅 Upcoming bookings</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {report ? report.summary.upcoming : "—"}
          </p>
          <p className="mt-1 text-xs text-amber-600">
            Pending + confirmed →
          </p>
        </Link>
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