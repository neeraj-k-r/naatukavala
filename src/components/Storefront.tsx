import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductGrid from "@/components/ProductGrid";
import { getShopBySlug } from "@/lib/queries";

export default async function Storefront({ slug }: { slug: string }) {
  const result = await getShopBySlug(slug);
  if (!result) notFound();

  const { shop, products } = result;

  return (
    <div>
      {/* Banner */}
      <div className="h-40 w-full bg-gradient-to-r from-emerald-100 via-teal-100 to-emerald-50 sm:h-52">
        {shop.banner_url && (
          <div className="relative h-full w-full">
            <Image
              src={shop.banner_url}
              alt={shop.name}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="-mt-10 mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white text-3xl shadow">
              {shop.logo_url ? (
                <Image
                  src={shop.logo_url}
                  alt={shop.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              ) : (
                <span>{shop.name.slice(0, 1).toUpperCase()}</span>
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-extrabold text-slate-900">
                {shop.name}
              </h1>
              {shop.tagline && (
                <p className="mt-1 text-sm text-slate-500">{shop.tagline}</p>
              )}
            </div>
          </div>

          <p className="text-xs font-medium text-slate-400">
            {shop.slug}.{process.env.NEXT_PUBLIC_APP_DOMAIN || "shop"}
          </p>
        </div>

        {shop.description && (
          <p className="mb-8 max-w-2xl text-sm text-slate-600">
            {shop.description}
          </p>
        )}

        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Products from {shop.name}
          </h2>
          <p className="text-sm text-slate-500">
            {products.length} item{products.length === 1 ? "" : "s"}
          </p>
        </div>

        <ProductGrid
          products={products.map((product) => ({
            ...product,
            shop: {
              name: shop.name,
              slug: shop.slug,
              delivery_charge: shop.delivery_charge,
            },
          }))}
        />

        <div className="mt-10 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-emerald-700 hover:underline"
          >
            ← Back to the full Naatukavala marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}