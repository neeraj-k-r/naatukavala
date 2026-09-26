import Image from "next/image";
import Link from "next/link";

import ClearCartOnMount from "@/components/ClearCartOnMount";
import DeleteAccountForm from "@/components/DeleteAccountForm";
import FeedbackForm from "@/components/FeedbackForm";
import ReturnRequestForm from "@/components/ReturnRequestForm";
import { requireBuyer } from "@/lib/auth";
import { getBuyerOrders, getOrderItems, getOrderReturns } from "@/lib/api";
import { formatCurrency, formatDate, autoCancelAt } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";
import type { OrderReturn } from "@/lib/types";

export const metadata = {
  title: "My orders",
};

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
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
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            <p className="font-semibold">Order placed!</p>
            <p className="text-sm">
              The shops will review and confirm your orders soon.
            </p>
          </div>
        </>
      )}

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My orders</h1>

      {orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">You haven&apos;t placed any orders yet.</p>
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
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Placed on {formatDate(order.created_at)}
                    </p>
                    {order.status === "pending" && (
                      <p className="mt-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                        Auto-cancels if the shop doesn&apos;t confirm by{" "}
                        {formatDate(autoCancelAt(order.created_at).toISOString())}
                      </p>
                    )}
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
                    className="mt-3 inline-block text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                  >
                    {order.shop.name}
                  </Link>
                )}

                {order.status !== "cancelled" && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800 hover:text-emerald-700 dark:text-slate-200 dark:hover:text-emerald-400"
                    >
                      Track package
                      <span aria-hidden>→</span>
                    </Link>
                    {order.tracking_number && (
                      <span className="rounded-lg bg-slate-50 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {order.tracking_number}
                      </span>
                    )}
                  </div>
                )}

                <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-4 py-3"
                    >
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
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
                        <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {item.product_name}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          × {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(item.unit_price * item.quantity, item.currency)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex justify-between border-t border-slate-100 pt-3 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, order.currency)}</span>
                </div>

                {order.status === "delivered" && (
                  <FeedbackForm
                    orderId={order.id}
                    initialRating={order.rating}
                    initialFeedback={order.feedback}
                    initialImages={order.feedback_images ?? []}
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

      <section className="mt-12">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Danger zone</h2>
        <div className="mt-3">
          <DeleteAccountForm />
        </div>
      </section>
    </div>
  );
}