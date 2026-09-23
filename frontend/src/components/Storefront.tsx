import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import ProductGrid from "@/components/ProductGrid";
import ReviewsSection from "@/components/ReviewsSection";
import ShopFilterBar from "@/components/ShopFilterBar";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getShopBySlug, getShopReviews, getWishlistIds } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { getShopSlugFromHost } from "@/lib/subdomain";

export interface ShopFilters {
  q: string;
  category: string;
  sort: string;
}

export default async function Storefront({
  slug,
  filters,
}: {
  slug: string;
  filters?: ShopFilters;
}) {
  const [result, user] = await Promise.all([getShopBySlug(slug), getUser()]);
  if (!result) notFound();

  const { shop, products } = result;
  const [reviews, wishlistIds] = await Promise.all([
    getShopReviews(slug),
    user ? getWishlistIds() : Promise.resolve(new Set<string>()),
  ]);

  // On the shop's own subdomain there is no wider marketplace to go back
  // to — the back link only makes sense on the main domain / path fallback.
  const onShopDomain =
    getShopSlugFromHost((await headers()).get("host")) !== null;

  const query = (filters?.q ?? "").trim().toLowerCase();
  const activeCategory = filters?.category ?? "";
  const sort = filters?.sort ?? "featured";

  const categories = [
    ...new Set(
      products
        .map((product) => product.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  ].sort();

  const visible = products.filter((product) => {
    if (activeCategory && product.category !== activeCategory) return false;
    if (!query) return true;
    return (
      product.name.toLowerCase().includes(query) ||
      (product.description?.toLowerCase().includes(query) ?? false)
    );
  });

  const sorted = [...visible].sort((a, b) => {
    if (sort === "price-asc") return Number(a.price) - Number(b.price);
    if (sort === "price-desc") return Number(b.price) - Number(a.price);
    if (sort === "newest")
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    return 0;
  });

  const isFiltered = query !== "" || activeCategory !== "";

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {shop.name}
                </h1>
                {shop.verification_status === "verified" && (
                  <VerifiedBadge size="lg" />
                )}
              </div>
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

        <div className="mb-8 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-slate-50 px-3 py-1.5 font-medium text-slate-600">
            Delivery:{" "}
            {shop.delivery_charge > 0
              ? `₹${shop.delivery_charge} per order`
              : "Free"}
          </span>
          {shop.return_policy && (
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
              Returns: {shop.return_policy}
            </span>
          )}
        </div>

        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Products from {shop.name}
          </h2>
          <p className="text-sm text-slate-500">
            {isFiltered
              ? `${sorted.length} of ${products.length} items`
              : `${products.length} item${products.length === 1 ? "" : "s"}`}
          </p>
        </div>

        <Suspense
          fallback={
            <div className="mb-6 h-11 rounded-xl bg-slate-100 animate-pulse" />
          }
        >
          <ShopFilterBar categories={categories} shopName={shop.name} />
        </Suspense>

        <ProductGrid
          products={sorted.map((product) => ({
            ...product,
            shop: {
              name: shop.name,
              slug: shop.slug,
              delivery_charge: shop.delivery_charge,
              return_policy: shop.return_policy,
              verification_status: shop.verification_status,
            },
          }))}
          wishlistIds={wishlistIds}
          signedIn={Boolean(user)}
        />

        {!onShopDomain && (
          <div className="mt-10 text-center">
            <Link
              href="/"
              className="text-sm font-medium text-emerald-700 hover:underline"
            >
              ← Back to the full Naatukavala marketplace
            </Link>
          </div>
        )}

        <ReviewsSection
          summary={reviews}
          title={`${shop.name} ratings & reviews`}
          emptyMessage="No reviews yet for this shop. Orders rated after delivery appear here."
        />
      </div>
    </div>
  );
}