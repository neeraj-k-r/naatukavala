import ProductCard from "@/components/ProductCard";

import type { ProductWithShop } from "@/lib/types";

/**
 * Store-style "trending" shelf: snap-scrolling product cards in one row,
 * like the deal carousels on big marketplaces. Hidden for search/filter
 * result views — it only fronts casual browsing.
 */
export default function DealsShelf({
  products,
  promotedIds,
  wishlistIds,
  signedIn,
}: {
  products: ProductWithShop[];
  promotedIds: Set<string>;
  wishlistIds: Set<string>;
  signedIn: boolean;
}) {
  if (products.length === 0) return null;

  return (
    <section aria-label="Trending now" className="mb-8 sm:mb-10">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
          Trending now
        </h2>
        <p className="flex-none text-xs font-medium text-slate-400 sm:text-sm dark:text-slate-500">
          Swipe to explore
        </p>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <div
            key={product.id}
            className="w-40 flex-none snap-start sm:w-52"
          >
            <ProductCard
              product={product}
              promoted={promotedIds.has(product.id)}
              wished={wishlistIds.has(product.id)}
              signedIn={signedIn}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
