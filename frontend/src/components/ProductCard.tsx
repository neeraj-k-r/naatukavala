import Image from "next/image";
import Link from "next/link";

import { formatCurrency } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";
import VerifiedBadge from "@/components/VerifiedBadge";

import type { ProductWithShop } from "@/lib/types";

export default function ProductCard({ product }: { product: ProductWithShop }) {
  const image = product.images?.[0];
  const verified = product.shop?.verification_status === "verified";

  return (
    <Link
      href={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-square bg-slate-100">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl">
            🌿
          </div>
        )}
        {product.stock === 0 && (
          <span className="absolute left-2 top-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-emerald-700">
            {product.shop?.name}
          </span>
          {verified && <VerifiedBadge />}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
          {product.name}
        </h3>
        <p className="mt-auto pt-1 text-base font-bold text-slate-900">
          {formatCurrency(product.price, product.currency)}
        </p>
      </div>
    </Link>
  );
}

export function ShopLink({ slug, name }: { slug: string; name: string }) {
  return (
    <Link href={shopUrl(slug)} className="font-medium text-emerald-700 hover:underline">
      {name}
    </Link>
  );
}