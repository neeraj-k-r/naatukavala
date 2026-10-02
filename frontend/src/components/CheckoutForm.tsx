"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { placeOrder } from "@/lib/actions";
import SubmitButton from "@/components/SubmitButton";
import UseLocationButton from "@/components/UseLocationButton";
import { useCart, cartGroupedByShop } from "@/components/CartContext";
import { validateCoupon } from "@/lib/client-api";
import type { CouponPreviewResult } from "@/lib/client-api";
import { formatCurrency } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

export default function CheckoutForm({
  initialAddress = "",
  initialPhone = "",
}: {
  initialAddress?: string;
  initialPhone?: string;
}) {
  const { items, subtotal, deliveryTotal } = useCart();
  const router = useRouter();
  const [state, action, pending] = useActionState(placeOrder, undefined);
  const groups = cartGroupedByShop(items);

  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{
    preview: CouponPreviewResult;
    cartKey: string;
  } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [address, setAddress] = useState(initialAddress);

  // The preview belongs to the exact cart it was computed for.
  const cartKey = items
    .map((item) => `${item.product_id}:${item.quantity}`)
    .join("|");
  const activePreview =
    applied && applied.cartKey === cartKey ? applied.preview : null;
  const discountTotal = activePreview?.discount_total ?? 0;

  useEffect(() => {
    if (items.length === 0 && !pending) {
      router.replace("/cart");
    }
  }, [items.length, pending, router]);

  if (items.length === 0 && !pending) return null;

  async function applyCoupon() {
    setCouponError(null);
    const term = code.trim();
    if (!term || applying) return;
    setApplying(true);
    try {
      const result = await validateCoupon(
        term,
        items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          variant_id: item.variant_id ?? null,
        })),
      );
      if (result.valid) {
        setApplied({ preview: result, cartKey });
      } else {
        setApplied(null);
        setCouponError(result.message);
      }
    } catch (err) {
      setApplied(null);
      setCouponError(
        err instanceof Error ? err.message : "Could not check the code.",
      );
    } finally {
      setApplying(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Checkout</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form action={action} className="space-y-5">
          <input type="hidden" name="cart" value={JSON.stringify(
            items.map(({ product_id, quantity }) => ({ product_id, quantity })),
          )} />
          <input
            type="hidden"
            name="coupon_code"
            value={activePreview ? activePreview.code : ""}
          />

          {state?.error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Delivery details</h2>

            <div className="mt-4">
              <label
                htmlFor="shipping_address"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Shipping address
              </label>
              <div className="mb-2 flex justify-end">
                <UseLocationButton onResolved={setAddress} />
              </div>
              <textarea
                id="shipping_address"
                name="shipping_address"
                required
                rows={3}
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="House / street, area, city, PIN code"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="buyer_phone"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Phone number
              </label>
              <input
                id="buyer_phone"
                name="buyer_phone"
                type="tel"
                required
                autoComplete="tel"
                defaultValue={initialPhone}
                placeholder="e.g. 98765 43210"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                The shop uses this to contact you about delivery.
              </p>
            </div>

            <div className="mt-4">
              <label
                htmlFor="buyer_note"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Note to seller <span className="text-slate-400 dark:text-slate-500">(optional)</span>
              </label>
              <input
                id="buyer_note"
                name="buyer_note"
                type="text"
                placeholder="e.g. Call before delivering"
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Payment</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              No online payment yet — pay the shop on delivery, or agree a payment
              method with the seller after your order is confirmed.
            </p>
          </div>

          <SubmitButton
            pendingText="Placing order…"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
          >
            Place order · {formatCurrency(subtotal + deliveryTotal - discountTotal)}
          </SubmitButton>
        </form>

        <aside className="h-fit rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-slate-100">Order summary</h3>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            {activePreview ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {activePreview.code} · −{formatCurrency(activePreview.discount_total)}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setApplied(null);
                    setCode("");
                    setCouponError(null);
                  }}
                  className="text-xs font-medium text-slate-400 hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Coupon code"
                    aria-label="Coupon code"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applying || !code.trim()}
                    className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                  >
                    {applying ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponError && (
                  <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                    {couponError}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {groups.map((group) => (
              <div key={group.shop_slug}>
                <Link
                  href={shopUrl(group.shop_slug)}
                  className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  {group.shop_name}
                </Link>
                <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  <span>
                    {group.items.reduce((sum, item) => sum + item.quantity, 0)} item(s) ·{" "}
                    {formatCurrency(group.total, group.items[0].currency)}
                  </span>
                  {group.delivery_charge > 0 && (
                    <span className="block text-xs text-slate-400 dark:text-slate-500">
                      + delivery {formatCurrency(group.delivery_charge, group.items[0].currency)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 space-y-1 border-t border-slate-100 pt-4 text-sm font-bold text-slate-900 dark:border-slate-800 dark:text-slate-100">
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
            {discountTotal > 0 && (
              <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                <span>Coupon{activePreview ? ` (${activePreview.code})` : ""}</span>
                <span>−{formatCurrency(discountTotal)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base dark:border-slate-800">
              <span>Total</span>
              <span>{formatCurrency(subtotal + deliveryTotal - discountTotal)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}