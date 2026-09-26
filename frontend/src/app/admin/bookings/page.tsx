import Link from "next/link";

import AdminBookingActions from "@/components/AdminBookingActions";
import { requireAdmin } from "@/lib/auth";
import { getAdminBookings } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Bookings & dispatch",
};

const GROUPS = [
  { id: "all", label: "All bookings" },
  { id: "upcoming", label: "📅 Upcoming" },
  { id: "ongoing", label: "🔄 Ongoing" },
  { id: "dispatch", label: "🚚 Dispatch" },
  { id: "needs-tracking", label: "⚠️ Needs tracking" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
] as const;

const GROUP_HINT: Record<string, string> = {
  all: "Every order placed across the marketplace, newest first.",
  upcoming: "Pending + confirmed bookings waiting to be fulfilled.",
  ongoing: "Confirmed + shipped orders currently being prepared or on the way.",
  dispatch: "Confirmed (ready to ship) + shipped (dispatched, in transit). Update status and tracking here.",
  "needs-tracking": "Shipped orders with no tracking number — add one so buyers can follow their package.",
  delivered: "Completed bookings.",
  cancelled: "Cancelled bookings (excluded from revenue).",
};

const statusPill: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 dark:bg-amber-900 dark:text-amber-200",
  confirmed: "bg-sky-50 text-sky-700 dark:bg-sky-900 dark:text-sky-200",
  shipped: "bg-violet-50 text-violet-700 dark:bg-violet-900 dark:text-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string; search?: string }>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const group = params.group && GROUPS.some((g) => g.id === params.group) ? params.group : "all";
  const search = (params.search ?? "").trim();

  // The backend only knows a few status values; map the tab to a query it understands.
  const query =
    group === "delivered" || group === "cancelled"
      ? { status: group, limit: 60, ...(search ? { search } : {}) }
      : { group, limit: 60, ...(search ? { search } : {}) };
  const { orders, total } = await getAdminBookings(query);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Bookings & dispatch</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{GROUP_HINT[group]}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {GROUPS.map((tab) => (
          <Link
            key={tab.id}
            href={`/admin/bookings?group=${tab.id}${search ? `&search=${encodeURIComponent(search)}` : ""}`}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              group === tab.id
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:ring-slate-600"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <form method="GET" action="/admin/bookings" className="flex gap-2">
        <input type="hidden" name="group" value={group} />
        <input
          name="search"
          defaultValue={search}
          placeholder="Search order id, tracking #, shop, address…"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Search
        </button>
        {search && (
          <Link
            href={`/admin/bookings?group=${group}`}
            className="shrink-0 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Clear
          </Link>
        )}
      </form>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        Showing {orders.length} of {total} bookings{search ? ` matching “${search}”` : ""}.
      </p>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">No bookings in this view.</p>
          <Link href="/admin/reports" className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
            ← Back to sales report
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold capitalize ${statusPill[order.status] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.created_at)}</span>
                </div>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {formatCurrency(order.total, order.currency)}
                </p>
              </div>

              <div className="mt-2 grid gap-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                <p>
                  🏪 <span className="font-semibold text-slate-700 dark:text-slate-300">{order.shop?.name ?? "Unknown shop"}</span>
                  {order.buyer_name ? (
                    <> · 🧑 {order.buyer_name}</>
                  ) : null}
                </p>
                {order.shipping_address && <p>📍 {order.shipping_address}</p>}
                {order.buyer_note && <p className="italic">💬 “{order.buyer_note}”</p>}
                {order.tracking_number && (
                  <p className="font-mono font-semibold text-slate-700 dark:text-slate-300">📦 {order.tracking_number}</p>
                )}
              </div>

              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <AdminBookingActions orderId={order.id} status={order.status} tracking={order.tracking_number} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
