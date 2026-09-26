"use client";

import { useState } from "react";

import { useCart } from "@/components/CartContext";

interface Props {
  productId: string;
  name: string;
  price: number;
  currency: string;
  image: string | null;
  shopName: string;
  shopSlug: string;
  deliveryCharge: number;
  stock: number;
}

export default function AddToCartButton({
  productId,
  name,
  price,
  currency,
  image,
  shopName,
  shopSlug,
  deliveryCharge,
  stock,
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (stock === 0) {
    return (
      <span className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        Out of stock
      </span>
    );
  }

  return (
    <button
      onClick={() => {
        addItem({
          product_id: productId,
          name,
          price,
          currency,
          image,
          shop_name: shopName,
          shop_slug: shopSlug,
          delivery_charge: deliveryCharge,
          stock,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
      }}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
    >
      {added ? "Added to cart ✓" : "Add to cart"}
    </button>
  );
}