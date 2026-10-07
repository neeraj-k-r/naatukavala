import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

import DealsShelf from "@/components/DealsShelf";
import HeroCarousel from "@/components/HeroCarousel";
import CategoryRail from "@/components/CategoryRail";
import MarketplaceFilterBar from "@/components/MarketplaceFilterBar";
import ProductGrid from "@/components/ProductGrid";
import { getMarketplace } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { shopUrl } from "@/lib/subdomain";

import type { Shop } from "@/lib/types";

export const metadata = {
  title: { absolute: "Naatukavala" },
};

export default async function MarketplacePage({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = typeof params.sort === "string" ? params.sort : "";
  const maxPrice = typeof params.maxPrice === "string" ? params.maxPrice : "";
  const inStockOnly = params.inStock === "1";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero paints instantly — the catalog streams in below */}
      <HeroCarousel />

      <Suspense
        key={`${search}|${category}|${sort}|${maxPrice}|${inStockOnly}`}
        fallback={<CatalogSkeleton />}
      >
        <MarketplaceCatalog
          search={search}
          category={category}
          sort={sort}
          maxPrice={maxPrice}
          inStockOnly={inStockOnly}
        />
      </Suspense>
    </div>
  );
}

/** Whole catalog from a single backend call, streamed after the hero. */
async function MarketplaceCatalog({
  search,
  category,
  sort,
  maxPrice,
  inStockOnly,
}: {
  search: string;
  category: string;
  sort: string;
  maxPrice: string;
  inStockOnly: boolean;
}) {
  const [bundle, user] = await Promise.all([
    getMarketplace({ search, category }),
    getUser(),
  ]);
  const { shops, spotlight, categories } = bundle;
  const signedIn = Boolean(user);
  const wishlistIds = user ? new Set(bundle.wishlistIds) : new Set<string>();

  // Extra filters applied on top of the backend result (no backend change).
  const cap = Number(maxPrice);
  let products = bundle.products.filter((product) => {
    if (inStockOnly && product.stock <= 0) return false;
    if (maxPrice !== "" && Number.isFinite(cap) && product.price > cap) {
      return false;
    }
    return true;
  });
  products = [...products];
  if (sort === "price-asc") {
    products.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    products.sort((a, b) => b.price - a.price);
  } else if (sort === "newest") {
    products.sort(
      (a, b) => +new Date(b.created_at) - +new Date(a.created_at),
    );
  }

  const promotedProductIds = new Set([
    ...spotlight.products.map((product) => product.id),
  ]);
  const hasSpotlight =
    spotlight.products.length > 0 || spotlight.shops.length > 0;

  // Browse-mode shelf: sponsored picks first, then newest arrivals.
  const shelfProducts =
    search || category
      ? []
      : [
          ...spotlight.products,
          ...products.filter((product) => !promotedProductIds.has(product.id)),
        ].slice(0, 10);

  return (
    <>
      {/* Trending + sponsored share one row on desktop; stacked on mobile */}
      <div className={hasSpotlight ? "lg:grid lg:grid-cols-5 lg:items-start lg:gap-6" : undefined}>
        <div className={hasSpotlight ? "lg:col-span-3 lg:pt-6 lg:[&>section]:mb-0" : undefined}>
          <DealsShelf
            products={shelfProducts}
            promotedIds={promotedProductIds}
            wishlistIds={wishlistIds}
            signedIn={signedIn}
          />
        </div>
        {hasSpotlight && (
          <section className="mb-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 sm:mb-6 lg:col-span-2 dark:border-amber-900 dark:from-amber-950 dark:to-slate-900 sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-amber-950">
                Sponsored
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Featured picks from our sellers
              </h2>
            </div>

            {spotlight.products.length > 0 && (
              <ProductGrid
                products={spotlight.products}
                promotedIds={promotedProductIds}
                wishlistIds={wishlistIds}
                signedIn={signedIn}
              />
            )}

            {spotlight.shops.length > 0 && (
              <div
                className={
                  spotlight.products.length > 0
                    ? "mt-4 grid grid-cols-1 gap-3 sm:gap-4"
                    : "grid grid-cols-1 gap-3 sm:gap-4"
                }
              >
                {spotlight.shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} promoted />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center">
        <CategoryRail categories={categories} active={category} search={search} />
        <Suspense fallback={null}>
          <MarketplaceFilterBar categories={categories} resultCount={products.length} />
        </Suspense>
      </div>

      <section id="all-products" className="scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl dark:text-slate-100">
            {search ? `Results for "${search}"` : "All products"}
          </h2>
          <p className="flex-none rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {products.length} item{products.length === 1 ? "" : "s"}
          </p>
        </div>
        <ProductGrid products={products} promotedIds={promotedProductIds} wishlistIds={wishlistIds} signedIn={signedIn} />
      </section>

      {shops.length > 0 && (
        <section id="featured-shops" className="mt-5 scroll-mt-20 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:mt-6 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-3 text-lg font-extrabold tracking-tight text-slate-900 sm:mb-4 sm:text-xl dark:text-slate-100">
            Featured shops
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}

/** Shimmer placeholder while the catalog streams in. */
function CatalogSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-8 flex flex-wrap gap-2">
        {["w-16", "w-24", "w-20", "w-28"].map((width) => (
          <div
            key={width}
            className={`h-8 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700 ${width}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="aspect-square animate-pulse bg-slate-200 dark:bg-slate-700" />
            <div className="space-y-2 p-4">
              <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShopCard({ shop, promoted = false }: { shop: Shop & { promotion_video_url?: string | null }; promoted?: boolean }) {
  // Video-first layout: video fills the card, text floats on top.
  if (shop.promotion_video_url) {
    return (
      <Link
        href={shopUrl(shop.slug)}
        className="group relative block overflow-hidden rounded-2xl shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <video
            src={shop.promotion_video_url}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent"
          />
          {promoted && (
            <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
              Sponsored
            </span>
          )}
          <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-2.5 p-4">
            <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold text-white backdrop-blur-sm sm:h-10 sm:w-10 sm:text-base">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt={shop.name}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{shop.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-white group-hover:underline sm:text-lg">
                {shop.name}
              </p>
              {shop.tagline && (
                <p className="truncate text-[13px] text-white/80 sm:text-sm">{shop.tagline}</p>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={shopUrl(shop.slug)}
      className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      {promoted && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950">
          Sponsored
        </span>
      )}
      {shop.banner_url && (
        <div className="relative h-20 w-full overflow-hidden bg-slate-100">
          <Image
            src={shop.banner_url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2.5 sm:mb-3 sm:gap-3">
          <div className="flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 sm:h-10 sm:w-10 sm:text-base dark:bg-emerald-950 dark:text-emerald-300">
            {shop.logo_url ? (
              <Image
                src={shop.logo_url}
                alt={shop.name}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{shop.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <p className="min-w-0 break-words text-base font-bold text-emerald-700 group-hover:underline sm:text-lg dark:text-emerald-400">
            {shop.name}
          </p>
        </div>
        {shop.tagline && (
          <p className="mt-1 break-words text-[13px] text-slate-500 sm:text-sm dark:text-slate-400">{shop.tagline}</p>
        )}
        <p className="mt-2 truncate text-xs font-medium text-slate-400 sm:mt-3 dark:text-slate-500">
          {shop.slug}.{process.env.NEXT_PUBLIC_APP_DOMAIN || "shop"}
        </p>
      </div>
    </Link>
  );
}
