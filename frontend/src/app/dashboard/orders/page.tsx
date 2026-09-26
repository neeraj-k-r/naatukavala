import Image from "next/image";

import OrderStatusSelect from "@/components/OrderStatusSelect";
import ReturnDecision from "@/components/ReturnDecision";
import SellerTrackingForm from "@/components/SellerTrackingForm";
import { requireSeller } from "@/lib/auth";
import { getOrderItems, getOrderReturns, getSellerOrders } from "@/lib/api";
import { formatCurrency, formatDate, autoCancelAt } from "@/lib/utils";
import type { OrderReturn } from "@/lib/types";

export const metadata = {
  title: "Orders",
};

export default async function SellerOrdersPage() {
  const user = await requireSeller();
  const orders = await getSellerOrders(user.id);
  const orderIds = orders.map((order) => order.id);
  const [items, returns] = await Promise.all([
    getOrderItems(orderIds.length > 0 ? orderIds : []),
    getOrderReturns(orderIds),
  ]);
  const itemsByOrder = new Map(
    orderIds.map((id) => [id, items.filter((item) => item.order_id === id)]),
  );
  const returnsByOrder = new Map<string, OrderReturn | null>();
  orders.forEach((order, index) => {
    returnsByOrder.set(order.id, returns[index] ?? null);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Orders</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Orders placed against your shop.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(order.created_at)}
                  </p>
                  {order.status === "pending" && (
                    <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                      Confirm soon — auto-cancels{" "}
                      {formatDate(autoCancelAt(order.created_at).toISOString())}
                    </p>
                  )}
                </div>
                <OrderStatusSelect
                  orderId={order.id}
                  status={order.status}
                />
              </div>

              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {(itemsByOrder.get(order.id) ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.product_name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg">
                          🌿
                        </div>
                      )}
                    </div>
                    <p className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                      {item.product_name}{" "}
                      <span className="text-slate-400 dark:text-slate-500">× {item.quantity}</span>
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {formatCurrency(item.unit_price * item.quantity, item.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {order.shipping_address && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Ship to: {order.shipping_address}
                </p>
              )}
              {order.buyer_note && (
                <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">
                  Note: {order.buyer_note}
                </p>
              )}

              {order.shop?.return_policy &&
                (() => {
                  const ret = returnsByOrder.get(order.id) ?? null;
                  return ret ? (
                    <ReturnDecision orderId={order.id} ret={ret} />
                  ) : (
                      order.status === "delivered" && (
                      <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Your shop accepts returns — buyers can request them once
                        an order is delivered.
                      </p>
                    )
                  );
                })()}

              {["shipped", "delivered"].includes(order.status) && (
                <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    Package tracking
                  </p>
                  {order.tracking_number && (
                    <p className="mt-1 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                      {order.tracking_number}
                    </p>
                  )}
                  <SellerTrackingForm
                    orderId={order.id}
                    status={order.status}
                    initialTracking={order.tracking_number}
                  />
                </div>
              )}

              {(order.rating || order.feedback) && (
                <div className="mt-3 rounded-xl bg-amber-50 p-3 dark:bg-amber-950">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Buyer feedback
                  </p>
                  {order.rating && (
                    <p className="mt-1 text-base leading-none tracking-wide text-amber-400">
                      {"★".repeat(order.rating)}
                      <span className="text-slate-300">
                        {"★".repeat(5 - order.rating)}
                      </span>
                    </p>
                  )}
                  {order.feedback && (
                    <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{order.feedback}</p>
                  )}
                  {order.feedback_at && (
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(order.feedback_at)}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                <span>Order total</span>
                <span>{formatCurrency(order.total, order.currency)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}