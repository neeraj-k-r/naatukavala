import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

import SearchBar from "@/components/SearchBar";
import CategoryPills from "@/components/CategoryPills";
import ProductGrid from "@/components/ProductGrid";
import { getActiveShops, getMarketplaceProducts } from "@/lib/api";
import { shopUrl } from "@/lib/subdomain";

export const metadata = {
  title: "Marketplace — every local shop, online",
};

export default async function MarketplacePage({
  searchParams,
}: PageProps<"/">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";

  const [products, shops] = await Promise.all([
    getMarketplaceProducts({ search, category }),
    getActiveShops(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Hero */}
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

      {/* Category filters */}
      <Suspense fallback={null}>
        <div className="mb-8">
          <CategoryPills />
        </div>
      </Suspense>

      <div className="mb-5 flex items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">
          {search ? `Results for "${search}"` : "All products"}
        </h2>
        <p className="text-sm text-slate-500">
          {products.length} item{products.length === 1 ? "" : "s"}
        </p>
      </div>

      <ProductGrid products={products} />

      {shops.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Featured shops
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={shopUrl(shop.slug)}
                className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
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
                    <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-emerald-50 text-base font-bold text-emerald-700">
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
                    <p className="text-lg font-bold text-emerald-700 group-hover:underline">
                      {shop.name}
                    </p>
                  </div>
                  {shop.tagline && (
                    <p className="mt-1 text-sm text-slate-500">
                      {shop.tagline}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    {shop.slug}.{process.env.NEXT_PUBLIC_APP_DOMAIN || "shop"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}