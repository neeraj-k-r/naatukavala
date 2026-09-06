"use client";

import Image from "next/image";
import Link from "next/link";

import { cartGroupedByShop, useCart } from "@/components/CartContext";
import { formatCurrency } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotal, deliveryTotal, count, clear } =
    useCart();
  const groups = cartGroupedByShop(items);

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Your cart is empty
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse the marketplace and add products you love.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">
          Your cart ({count})
        </h1>
        <button
          onClick={clear}
          className="text-sm font-medium text-slate-400 hover:text-red-600"
        >
          Clear cart
        </button>
      </div>

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <div
            key={group.shop_slug}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
          >
            <Link
              href={shopUrl(group.shop_slug)}
              className="text-sm font-bold text-emerald-700 hover:underline"
            >
              {group.shop_name}
            </Link>

            <div className="mt-3 divide-y divide-slate-100">
              {group.items.map((item) => (
                <div
                  key={item.product_id}
                  className="flex items-center gap-4 py-4"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl">
                        🌿
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/product/${item.product_id}`}
                      className="block truncate text-sm font-semibold text-slate-800 hover:text-emerald-700"
                    >
                      {item.name}
                    </Link>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">
                      {formatCurrency(item.price, item.currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(item.product_id, item.quantity - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-lg font-medium text-slate-600 hover:bg-slate-50"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(item.product_id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-lg font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="ml-2 text-sm text-slate-400 hover:text-red-600"
                      aria-label="Remove item"
                    >
                      ✕
                    </button>
                  </div>

                  <p className="w-24 text-right text-sm font-bold text-slate-900">
                    {formatCurrency(item.price * item.quantity, item.currency)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-2 flex flex-col items-end gap-0.5 text-sm font-bold text-slate-800">
              <span>Shop total: {formatCurrency(group.total, group.items[0].currency)}</span>
              {group.delivery_charge > 0 && (
                <span className="font-medium text-slate-500">
                  + delivery {formatCurrency(group.delivery_charge, group.items[0].currency)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-col items-end gap-1">
        <p className="text-sm text-slate-500">Cart items total</p>
        <p className="text-lg font-bold text-slate-900">
          {formatCurrency(subtotal)}
        </p>
        {deliveryTotal > 0 && (
          <>
            <p className="text-sm text-slate-500">
              Delivery ({groups.length} shop{groups.length > 1 ? "s" : ""})
            </p>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(deliveryTotal)}
            </p>
          </>
        )}
        <p className="mt-1 text-3xl font-extrabold text-slate-900">
          {formatCurrency(subtotal + deliveryTotal)}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Payment is arranged with each shop at delivery.
        </p>
        <Link
          href="/checkout"
          className="mt-4 rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}