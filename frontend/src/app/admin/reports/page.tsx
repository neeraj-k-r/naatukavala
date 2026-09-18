import Image from "next/image";
import Link from "next/link";

import AdminBookingActions from "@/components/AdminBookingActions";
import { MonthlyBarChart, RevenueAreaChart, StatusBars } from "@/components/AdminCharts";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings, getAdminSalesReport } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Sales report",
};

const DAY_OPTIONS = [7, 30, 90];

const statusPill: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  shipped: "bg-violet-50 text-violet-700",
  delivered: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-500",
};

function BookingRow({
  order,
}: {
  order: Awaited<ReturnType<typeof getAdminBookings>>["orders"][number];
}) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-bold text-slate-900">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold capitalize ${statusPill[order.status] ?? "bg-slate-100 text-slate-600"}`}
          >
            {order.status}
          </span>
          {order.tracking_number && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[11px] text-slate-600">
              {order.tracking_number}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {order.shop?.name ?? "Unknown shop"} · {order.buyer_name ?? "guest buyer"} ·{" "}
          {formatDate(order.created_at)}
          {order.shipping_address ? ` · ${order.shipping_address}` : ""}
        </p>
      </div>
      <p className="text-sm font-extrabold text-slate-900">
        {formatCurrency(order.total, order.currency)}
      </p>
      <AdminBookingActions orderId={order.id} status={order.status} tracking={order.tracking_number} />
    </li>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const days = DAY_OPTIONS.includes(Number(params.days)) ? Number(params.days) : 30;

  const [report, upcoming, dispatch] = await Promise.all([
    getAdminSalesReport(days),
    getAdminBookings({ group: "upcoming", limit: 8 }),
    getAdminBookings({ group: "dispatch", limit: 8 }),
  ]);

  const { summary, daily, monthly, byStatus, topShops, topProducts, pendingReturns, currency } = report;
  const maxShopRevenue = Math.max(...topShops.map((s) => s.revenue), 1);
  const maxProductRevenue = Math.max(...topProducts.map((p) => p.revenue), 1);

  const kpis: { label: string; value: string; sub: string }[] = [
    { label: "Total revenue", value: formatCurrency(summary.totalRevenue, currency), sub: `${summary.netOrders} net orders · avg ${formatCurrency(summary.avgOrderValue, currency)}` },
    { label: "Today", value: formatCurrency(summary.todayRevenue, currency), sub: `${summary.todayOrders} orders today` },
    { label: "Last 7 days", value: formatCurrency(summary.last7Revenue, currency), sub: "rolling 7-day sales" },
    { label: "Last 30 days", value: formatCurrency(summary.last30Revenue, currency), sub: "rolling 30-day sales" },
    { label: "Upcoming bookings", value: String(summary.upcoming), sub: `pending ${summary.pending} · confirmed ${summary.confirmed}` },
    { label: "In transit (dispatched)", value: String(summary.inTransit), sub: summary.needsTracking > 0 ? `${summary.needsTracking} shipped without tracking ⚠️` : "all tracked ✓" },
    { label: "Delivered / cancelled", value: `${summary.delivered} / ${summary.cancelled}`, sub: `${summary.pendingReturns} returns awaiting review` },
    { label: "All bookings", value: String(summary.totalOrders), sub: "lifetime across all shops" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Sales report</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revenue, bookings, fulfilment queues and dispatch tracking — marketplace-wide.
          </p>
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {DAY_OPTIONS.map((option) => (
            <Link
              key={option}
              href={`/admin/reports?days=${option}`}
              className={`rounded-lg px-3 py-1.5 ${days === option ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              {option}D
            </Link>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{kpi.label}</p>
            <p className="mt-1 truncate text-xl font-extrabold text-slate-900" title={kpi.value}>
              {kpi.value}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Graphs */}
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Revenue — last {days} days</h3>
            <Link href="/admin/bookings" className="text-xs font-semibold text-emerald-700 hover:underline">
              All bookings →
            </Link>
          </div>
          <RevenueAreaChart daily={daily} currency={currency} />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Booking status mix</h3>
          <p className="mt-1 text-xs text-slate-500">Where every order sits in the fulfilment pipeline.</p>
          <StatusBars byStatus={byStatus} />
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <Link href="/admin/bookings?group=upcoming" className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800 hover:bg-amber-200">
              Upcoming: {summary.upcoming}
            </Link>
            <Link href="/admin/bookings?group=ongoing" className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-800 hover:bg-sky-200">
              Ongoing: {summary.confirmed + summary.shipped}
            </Link>
            <Link href="/admin/bookings?group=dispatch" className="rounded-full bg-violet-100 px-3 py-1 font-semibold text-violet-800 hover:bg-violet-200">
              Dispatched: {summary.inTransit}
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Monthly revenue — last 6 months</h3>
          <MonthlyBarChart monthly={monthly} currency={currency} />
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">Top shops by revenue</h3>
          {topShops.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">No sales yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {topShops.slice(0, 5).map((shop, i) => (
                <li key={shop.shop_id} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-extrabold text-slate-300">#{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{shop.shop_name}</p>
                      <p className="shrink-0 text-sm font-bold text-slate-900">{formatCurrency(shop.revenue, currency)}</p>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.max((shop.revenue / maxShopRevenue) * 100, 3)}%` }}
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">{shop.orders} orders</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Top products across the marketplace</h3>
        {topProducts.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No products sold yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {topProducts.slice(0, 6).map((product) => (
              <li key={product.product_id} className="flex items-center gap-3 py-2.5">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {product.image_url ? (
                    <Image src={product.image_url} alt={product.product_name} fill sizes="40px" className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">🌿</div>
                  )}
                </div>
                <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">{product.product_name}</p>
                <p className="hidden text-xs text-slate-400 sm:block">{product.units} sold</p>
                <div className="hidden h-2 w-32 overflow-hidden rounded-full bg-slate-100 md:block">
                  <div
                    className="h-full rounded-full bg-emerald-400"
                    style={{ width: `${Math.max((product.revenue / maxProductRevenue) * 100, 3)}%` }}
                  />
                </div>
                <p className="w-24 text-right text-sm font-bold text-slate-900">
                  {formatCurrency(product.revenue, product.currency)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Fulfilment queues */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              📅 Upcoming bookings <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{summary.upcoming}</span>
            </h3>
            <Link href="/admin/bookings?group=upcoming" className="text-xs font-semibold text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Pending + confirmed orders waiting to be fulfilled. Confirm them to start dispatch.</p>
          {upcoming.orders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No upcoming bookings — all caught up. 🎉</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {upcoming.orders.map((order) => (
                <BookingRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              🚚 Dispatch queue <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">{summary.inTransit + summary.confirmed}</span>
            </h3>
            <Link href="/admin/bookings?group=dispatch" className="text-xs font-semibold text-emerald-700 hover:underline">
              View all →
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">Confirmed (ready to ship) + shipped (in transit). Add tracking numbers as you dispatch.</p>
          {dispatch.orders.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Nothing waiting for dispatch.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100">
              {dispatch.orders.map((order) => (
                <BookingRow key={order.id} order={order} />
              ))}
            </ul>
          )}
        </div>
      </div>

      {pendingReturns.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900">↩️ Returns awaiting review ({pendingReturns.length})</h3>
          <ul className="mt-2 divide-y divide-slate-100">
            {pendingReturns.slice(0, 8).map((ret) => (
              <li key={ret.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <p className="text-slate-700">
                  <span className="font-mono font-bold text-slate-900">#{ret.order_id.slice(0, 8).toUpperCase()}</span>
                  {" · "}{ret.reason}
                </p>
                <span className="text-xs text-slate-400">{formatDate(ret.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
