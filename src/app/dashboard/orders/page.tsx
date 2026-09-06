import Image from "next/image";

import OrderStatusSelect from "@/components/OrderStatusSelect";
import { requireSeller } from "@/lib/auth";
import { getOrderItems, getSellerOrders } from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Orders",
};

export default async function SellerOrdersPage() {
  const user = await requireSeller();
  const orders = await getSellerOrders(user.id);
  const orderIds = orders.map((order) => order.id);
  const items = await getOrderItems(orderIds);
  const itemsByOrder = new Map(
    orderIds.map((id) => [id, items.filter((item) => item.order_id === id)]),
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Orders</h2>
        <p className="mt-1 text-sm text-slate-500">
          Orders placed against your shop.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-slate-500">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <OrderStatusSelect
                  orderId={order.id}
                  status={order.status}
                />
              </div>

              <div className="mt-4 divide-y divide-slate-100">
                {(itemsByOrder.get(order.id) ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
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
                    <p className="flex-1 truncate text-sm text-slate-700">
                      {item.product_name}{" "}
                      <span className="text-slate-400">× {item.quantity}</span>
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {formatCurrency(item.unit_price * item.quantity, item.currency)}
                    </p>
                  </div>
                ))}
              </div>

              {order.shipping_address && (
                <p className="mt-2 text-xs text-slate-500">
                  Ship to: {order.shipping_address}
                </p>
              )}
              {order.buyer_note && (
                <p className="mt-1 text-xs italic text-slate-500">
                  Note: {order.buyer_note}
                </p>
              )}

              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm font-bold text-slate-900">
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