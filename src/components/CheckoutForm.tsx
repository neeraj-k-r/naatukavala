"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { placeOrder } from "@/lib/actions";
import SubmitButton from "@/components/SubmitButton";
import { useCart, cartGroupedByShop } from "@/components/CartContext";
import { formatCurrency } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

export default function CheckoutForm() {
  const { items, subtotal, deliveryTotal } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, undefined);
  const groups = cartGroupedByShop(items);

  useEffect(() => {
    if (items.length === 0 && !pending) {
      router.replace("/cart");
    }
  }, [items.length, pending, router]);

  if (items.length === 0 && !pending) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form action={action} className="space-y-5">
          <input type="hidden" name="cart" value={JSON.stringify(
            items.map(({ product_id, quantity }) => ({ product_id, quantity })),
          )} />

          {state?.error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Delivery details</h2>

            <div className="mt-4">
              <label
                htmlFor="shipping_address"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Shipping address
              </label>
              <textarea
                id="shipping_address"
                name="shipping_address"
                required
                rows={3}
                placeholder="House / street, area, city, PIN code"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="buyer_note"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Note to seller <span className="text-slate-400">(optional)</span>
              </label>
              <input
                id="buyer_note"
                name="buyer_note"
                type="text"
                placeholder="e.g. Call before delivering"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Payment</h2>
            <p className="mt-2 text-sm text-slate-500">
              No online payment yet — pay the shop on delivery, or agree a payment
              method with the seller after your order is confirmed.
            </p>
          </div>

          <SubmitButton
            pendingText="Placing order…"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Place order · {formatCurrency(subtotal + deliveryTotal)}
          </SubmitButton>
        </form>

        <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-slate-900">Order summary</h3>
          <div className="mt-4 space-y-4">
            {groups.map((group) => (
              <div key={group.shop_slug}>
                <Link
                  href={shopUrl(group.shop_slug)}
                  className="text-sm font-semibold text-emerald-700 hover:underline"
                >
                  {group.shop_name}
                </Link>
                <div className="mt-1 text-sm text-slate-500">
                  <span>
                    {group.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) ·{" "}
                    {formatCurrency(group.total, group.items[0].currency)}
                  </span>
                  {group.delivery_charge > 0 && (
                    <span className="block text-xs text-slate-400">
                      + delivery {formatCurrency(group.delivery_charge, group.items[0].currency)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-1 border-t border-slate-100 pt-4 text-sm font-bold text-slate-900">
            <div className="flex justify-between">
              <span>Items total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {deliveryTotal > 0 && (
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{formatCurrency(deliveryTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base">
              <span>Total</span>
              <span>{formatCurrency(subtotal + deliveryTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}