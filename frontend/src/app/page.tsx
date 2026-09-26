import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import ProductGrid from "@/components/ProductGrid";
import { getMarketplace } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { shopUrl } from "@/lib/subdomain";

import type { Shop } from "@/lib/types";

export const metadata = {
  title: "Marketplace — every local shop, online",
};

export default async function MarketplacePage({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero paints instantly — the catalog streams in below */}
      <section className="mb-10 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 px-6 py-12 text-white sm:px-10">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
            Every local shop, one marketplace.
          </h1>
          <p className="mt-3 text-emerald-50">
            Stationery, groceries, crafts and more — browse products from shops
            and independent sellers across your neighbourhood, and buy online.
          </p>
        </div>
        <div className="mt-8">
          <Suspense fallback={null}>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      <Suspense
        key={`${search}|${category}`}
        fallback={<CatalogSkeleton />}
      >
        <MarketplaceCatalog search={search} category={category} />
      </Suspense>
    </div>
  );
}

/** Whole catalog from a single backend call, streamed after the hero. */
async function MarketplaceCatalog({
  search,
  category,
}: {
  search: string;
  category: string;
}) {
  const [bundle, user] = await Promise.all([
    getMarketplace({ search, category }),
    getUser(),
  ]);
  const { products, shops, spotlight, categories } = bundle;
  const signedIn = Boolean(user);
  const wishlistIds = user ? new Set(bundle.wishlistIds) : new Set<string>();

  const promotedProductIds = new Set([
    ...spotlight.products.map((product) => product.id),
  ]);
  const hasSpotlight =
    spotlight.products.length > 0 || spotlight.shops.length > 0;

  return (
    <>
      <div className="mb-8">
        <CategoryPills categories={categories} active={category} />
      </div>

      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          {search ? `Results for "${search}"` : "All products"}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {products.length} item{products.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Sponsored spotlight — admin-approved promotions get top placement */}
      {hasSpotlight && (
        <section className="mb-10 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 dark:border-amber-900 dark:from-amber-950 dark:to-slate-900 sm:p-6">
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
                  ? "mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                  : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              }
            >
              {spotlight.shops.map((shop) => (
                <ShopCard key={shop.id} shop={shop} promoted />
              ))}
            </div>
          )}
        </section>
      )}

      <ProductGrid products={products} promotedIds={promotedProductIds} wishlistIds={wishlistIds} signedIn={signedIn} />

      {shops.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-bold text-slate-900 dark:text-slate-100">
            Featured shops
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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

function ShopCard({ shop, promoted = false }: { shop: Shop; promoted?: boolean }) {
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
      <div className="p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-base font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
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
          <p className="text-lg font-bold text-emerald-700 group-hover:underline dark:text-emerald-400">
            {shop.name}
          </p>
        </div>
        {shop.tagline && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{shop.tagline}</p>
        )}
        <p className="mt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
          {shop.slug}.{process.env.NEXT_PUBLIC_APP_DOMAIN || "shop"}
        </p>
      </div>
    </Link>
  );
}
