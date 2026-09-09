import Link from "next/link";

import { requireBuyer } from "@/lib/auth";
import { getOrderTracking } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

import type { OrderStatus } from "@/lib/types";

export const metadata = {
  title: "Track order",
};

export const dynamic = "force-dynamic";

const labels: Record<OrderStatus, string> = {
  pending: "Order placed",
  confirmed: "Order confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const order: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

export default async function TrackingPage({
  params,
}: PageProps<"/account/orders/[orderId]">) {
  await requireBuyer();
  const { orderId } = await params;

  const { order: tracking, history } = await getOrderTracking(orderId);

  const events: { status: OrderStatus; note: string | null; created_at: string }[] =
    history.length > 0
      ? history.map((event) => ({
          status: event.status,
          note: event.note,
          created_at: event.created_at,
        }))
      : [];

  if (!events.some((event) => event.status === "pending")) {
    events.unshift({
      status: "pending",
      note: "Order placed and waiting for the shop to confirm.",
      created_at: tracking.created_at,
    });
  }

  const currentIndex = tracking.status === "cancelled"
    ? undefined
    : order.indexOf(tracking.status as (typeof order)[number]);
  const cancelled = tracking.status === "cancelled";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link
        href="/account"
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Back to my orders
      </Link>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {cancelled ? "Order cancelled" : `Order ${tracking.status}`}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Order ID: {tracking.id.slice(0, 8).toUpperCase()}
            </p>
            {tracking.shop && (
              <Link
                href={shopUrl(tracking.shop.slug)}
                className="mt-2 inline-block text-sm font-semibold text-emerald-700 hover:underline"
              >
                {tracking.shop.name}
              </Link>
            )}
          </div>
          {tracking.tracking_number && (
            <div className="rounded-lg bg-slate-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                Tracking number
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-slate-800">
                {tracking.tracking_number}
              </p>
            </div>
          )}
        </div>

        {cancelled ? (
          <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            This order was cancelled. Contact the shop if you have questions.
          </div>
        ) : (
          <div className="mt-8">
            {order.map((status, index) => {
              const done = index <= currentIndex!;
              const isCurrent = index === currentIndex;
              return (
                <div key={status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold ${
                        done
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-slate-200 bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                    {index < order.length - 1 && (
                      <div
                        className={`w-0.5 flex-1 ${
                          index < currentIndex! ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                  <div className="pb-8">
                    <p
                      className={`text-sm font-semibold ${
                        done ? "text-slate-900" : "text-slate-400"
                      }`}
                    >
                      {labels[status]}
                      {isCurrent && (
                        <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          Current
                        </span>
                      )}
                    </p>
                    {isCurrent && (
                      <p className="mt-1 text-xs text-slate-500">
                        Your package is {status === "shipped" ? "on its way." : `marked ${status}.`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {events.length > 1 && (
          <div className="mt-2 border-t border-slate-100 pt-5">
            <h2 className="text-sm font-bold text-slate-900">Update history</h2>
            <div className="mt-3 space-y-3">
              {events.map((event, index) => (
                <div key={index} className="flex items-start gap-3 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold text-slate-800">
                      {labels[event.status]}
                    </p>
                    {event.note && (
                      <p className="text-xs text-slate-500">{event.note}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {formatDate(event.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}