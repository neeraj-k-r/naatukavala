"use client";

import Link from "next/link";
import { useState } from "react";

import AddToCartButton from "@/components/AddToCartButton";
import VariantSelector from "@/components/VariantSelector";
import WishlistButton from "@/components/WishlistButton";
import { formatCurrency } from "@/lib/utils";

import type { ProductWithShop } from "@/lib/types";

/**
 * Price, stock, option picker and purchase buttons for one product.
 * When the product has options, buyers must pick one — price and stock
 * then come from the chosen variant.
 */
export default function ProductPurchasePanel({
  product,
  wished,
  signedIn,
}: {
  product: ProductWithShop;
  wished: boolean;
  signedIn: boolean;
}) {
  const active =
    (product.variants ?? []).filter((v) => v.is_active) ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(
    active.length === 1 ? active[0].id : null,
  );
  const selected = active.find((v) => v.id === selectedId) ?? null;

  const price = selected ? Number(selected.price) : Number(product.price);
  const stock = selected ? selected.stock : product.stock;
  const needsChoice = active.length > 0 && !selected;
  const variantLabel = selected
    ? `${selected.option_name}: ${selected.option_value}`
    : null;

  return (
    <div>
      <p className="mt-4 text-3xl font-extrabold text-slate-900 dark:text-slate-100">
        {formatCurrency(price, product.currency)}
      </p>

      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {needsChoice
          ? `${active.length} options available — pick one below`
          : stock > 0
            ? `${stock} available in stock`
            : "Currently out of stock"}
      </p>

      <VariantSelector
        variants={product.variants ?? []}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <AddToCartButton
          productId={product.id}
          name={product.name}
          price={price}
          currency={product.currency}
          image={product.images?.[0] ?? null}
          shopName={product.shop.name}
          shopSlug={product.shop.slug}
          deliveryCharge={product.shop.delivery_charge}
          stock={stock}
          variantId={selected?.id ?? null}
          variantLabel={variantLabel}
          disabled={needsChoice}
          disabledLabel="Choose an option"
        />
        <Link
          href="/cart"
          className="inline-flex items-center justify-center rounded-xl border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-slate-800"
        >
          View cart
        </Link>
        <WishlistButton
          productId={product.id}
          initialWished={wished}
          signedIn={signedIn}
          size="detail"
        />
      </div>
    </div>
  );
}
