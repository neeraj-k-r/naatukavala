import ProductCard from "@/components/ProductCard";

import type { ProductWithShop } from "@/lib/types";

export default function ProductGrid({
  products,
  promotedIds,
  wishlistIds,
  signedIn = false,
  dealLabels,
}: {
  products: ProductWithShop[];
  promotedIds?: ReadonlySet<string>;
  wishlistIds?: ReadonlySet<string>;
  signedIn?: boolean;
  dealLabels?: Record<string, string>;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
        <p className="text-lg font-semibold text-slate-700">No products found</p>
        <p className="mt-1 text-sm text-slate-500">
          Try a different search or category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          promoted={promotedIds?.has(product.id) ?? false}
          wished={wishlistIds?.has(product.id) ?? false}
          signedIn={signedIn}
          dealLabel={dealLabels?.[product.id]}
        />
      ))}
    </div>
  );
}