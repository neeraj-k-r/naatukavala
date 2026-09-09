import Image from "next/image";
import Link from "next/link";

import { requireSeller } from "@/lib/auth";
import { getSellerStats } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "Sales analytics",
};

const monthLabel = (month: string) => {
  const [year, index] = month.split("-");
  const labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${labels[Number(index) - 1]} ${year.slice(2)}`;
};

export default async function SellerAnalyticsPage() {
  const user = await requireSeller();
  const stats = await getSellerStats();
  const { summary, monthly, products } = stats;

  const maxMonthly = Math.max(...monthly.map((entry) => entry.revenue), 0);
  const maxProductRevenue = Math.max(...products.map((entry) => entry.revenue), 0);
  const currency = products[0]?.currency ?? "INR";

  const chips: { label: string; value: number; style: string }[] = [
    { label: "Delivered", value: summary.delivered, style: "bg-emerald-50 text-emerald-700" },
    { label: "In progress", value: summary.pending + summary.confirmed + summary.shipped, style: "bg-blue-50 text-blue-700" },
    { label: "Cancelled", value: summary.cancelled, style: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Sales analytics</h2>
        <p className="mt-1 text-sm text-slate-500">
          Revenue and order performance for your shop.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Total revenue
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatCurrency(summary.revenue, currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Orders
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {summary.orders}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Avg order value
          </p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">
            {formatCurrency(summary.avgOrderValue, currency)}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${chip.style}`}
          >
            {chip.label}: {chip.value}
          </span>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">
          Revenue — last 6 months
        </h3>
        {monthly.every((entry) => entry.orders === 0) ? (
          <p className="mt-2 text-sm text-slate-500">
            No sales yet. Orders will appear here once your shop gets them.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {monthly.map((entry) => (
              <div key={entry.month} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-xs font-semibold text-slate-500">
                  {monthLabel(entry.month)}
                </span>
                <div className="h-7 flex-1 overflow-hidden rounded-lg bg-slate-100">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-emerald-500 px-2"
                    style={{
                      width: `${maxMonthly ? Math.max((entry.revenue / maxMonthly) * 100, 4) : 0}%`,
                    }}
                  >
                    {entry.revenue > 0 && (
                      <span className="text-[11px] font-bold text-white">
                        {formatCurrency(entry.revenue, currency)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="w-8 shrink-0 text-right text-xs text-slate-400">
                  {entry.orders}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900">Top products</h3>
        {products.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            No products sold yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {products.map((product) => (
              <div key={product.product_id} className="flex items-center gap-4 py-3">
                <Link
                  href={`/product/${product.product_id}`}
                  className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100"
                >
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.product_name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-lg">
                      🌿
                    </div>
                  )}
                </Link>
                <Link
                  href={`/product/${product.product_id}`}
                  className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 hover:text-emerald-700"
                >
                  {product.product_name}
                </Link>
                <p className="hidden w-14 text-right text-xs text-slate-500 sm:block">
                  {product.units} sold
                </p>
                <div className="hidden w-40 sm:block">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-400"
                      style={{
                        width: `${maxProductRevenue ? Math.max((product.revenue / maxProductRevenue) * 100, 3) : 0}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="w-28 text-right text-sm font-bold text-slate-900">
                  {formatCurrency(product.revenue, product.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}