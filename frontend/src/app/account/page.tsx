import Image from "next/image";
import Link from "next/link";

import ClearCartOnMount from "@/components/ClearCartOnMount";
import FeedbackForm from "@/components/FeedbackForm";
import ReturnRequestForm from "@/components/ReturnRequestForm";
import { requireBuyer } from "@/lib/auth";
import { getBuyerOrders, getOrderItems, getOrderReturns } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";
import type { OrderReturn } from "@/lib/types";

export const metadata = {
  title: "My orders",
};

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700",
};

export default async function AccountPage({
  searchParams,
}: PageProps<"/account">) {
  const { id: userId } = await requireBuyer();
  const params = await searchParams;
  const placed = params.placed === "1";

  const orders = await getBuyerOrders(userId);
  const orderIds = orders.map((order) => order.id);
  const returnEligible = orders.filter(
    (order) => order.status === "delivered" && order.shop?.return_policy,
  );
  const [items, returns] = await Promise.all([
    getOrderItems(orderIds.length > 0 ? orderIds : []),
    getOrderReturns(returnEligible.map((order) => order.id)),
  ]);
  const itemsByOrder = new Map(
    orderIds.map((id) => [id, items.filter((item) => item.order_id === id)]),
  );
  const returnsByOrder = new Map<string, OrderReturn | null>();
  returnEligible.forEach((order, index) => {
    returnsByOrder.set(order.id, returns[index] ?? null);
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      {placed && (
        <>
          <ClearCartOnMount />
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
            <p className="font-semibold">Order placed!</p>
            <p className="text-sm">
              The shops will review and confirm your orders soon.
            </p>
          </div>
        </>
      )}

      <h1 className="text-2xl font-bold text-slate-900">My orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {orders.map((order) => {
            const lineItems = itemsByOrder.get(order.id) ?? [];
            return (
              <div
                key={order.id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400">
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[order.status]}`}
                  >
                    {order.status}
                  </span>
                </div>

                {order.shop && (
                  <Link
                    href={shopUrl(order.shop.slug)}
                    className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline"
                  >
                    {order.shop.name}
                  </Link>
                )}

                {order.status !== "cancelled" && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-emerald-700"
                    >
                      Track package
                      <span aria-hidden>→</span>
                    </Link>
                    {order.tracking_number && (
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                        {order.tracking_number}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 divide-y divide-slate-100">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product_name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-lg">
                            🌿
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-slate-400">
                          × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.unit_price * item.quantity, item.currency)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>

                {order.status === "delivered" && (
                  <FeedbackForm
                    orderId={order.id}
                    initialRating={order.rating}
                    initialFeedback={order.feedback}
                  />
                )}

                {order.status === "delivered" &&
                  order.shop?.return_policy && (
                    <ReturnRequestForm
                      orderId={order.id}
                      policy={order.shop.return_policy}
                      existing={returnsByOrder.get(order.id) ?? null}
                    />
                  )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}