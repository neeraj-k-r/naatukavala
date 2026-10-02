import Link from "next/link";
import { notFound } from "next/navigation";

import ProductGallery from "@/components/ProductGallery";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ReviewsSection from "@/components/ReviewsSection";
import SuperadminDeleteProductButton from "@/components/SuperadminDeleteProductButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import { getProductById, getProductReviews, getVotedHelpful, getWishlistIds } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const [product, user, wishlistIds] = await Promise.all([
    getProductById(id),
    getUser(),
    getUser().then((u) => (u ? getWishlistIds() : new Set<string>())),
  ]);
  if (!product) notFound();

  const reviews = await getProductReviews(id);
  const votedIds = user
    ? await getVotedHelpful(reviews.reviews.map((review) => review.order_id))
    : new Set<string>();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <ProductGallery images={product.images} name={product.name} stock={product.stock} />

        {/* Details */}
        <div className="flex flex-col">
          <Link
            href={shopUrl(product.shop.slug)}
            className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {product.shop.name}
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-slate-100 sm:text-3xl">
            {product.name}
          </h1>

          {product.category && (
            <p className="mt-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {product.category}
              </span>
            </p>
          )}

          <ProductPurchasePanel
            product={product}
            wished={wishlistIds.has(product.id)}
            signedIn={Boolean(user)}
          />

          {user?.profile?.role === "superadmin" && (
            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4 dark:border-red-900 dark:bg-red-950/40">
              <p className="text-xs text-red-700 dark:text-red-300">
                Superadmin: remove this product from the marketplace with a
                recorded reason.
              </p>
              <SuperadminDeleteProductButton
                productId={product.id}
                productName={product.name}
              />
            </div>
          )}

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
            Delivery charge:{" "}
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {formatCurrency(product.shop.delivery_charge, product.currency)}
            </span>
          </p>

          {product.shop.return_policy && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Return policy:{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {product.shop.return_policy}
              </span>
            </p>
          )}

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {product.description}
            </p>
          )}

          <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            <p className="font-semibold text-slate-800 dark:text-slate-200">About this shop</p>
            <p className="mt-1">
              Sold by{" "}
              <span className="font-medium text-emerald-700">
                {product.shop.name}
              </span>{" "}
              {product.shop.verification_status === "verified" && (
                <VerifiedBadge />
              )}{" "}
              on Naatukavala.{" "}
              <Link
                href={shopUrl(product.shop.slug)}
                className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                Visit the shop
              </Link>{" "}
              to see everything they sell.
            </p>
          </div>
        </div>
      </div>

      <ReviewsSection
        summary={reviews}
        title="Customer reviews"
        emptyMessage="No reviews yet for this product. Buy it and be the first to review!"
        votedIds={votedIds}
        signedIn={Boolean(user)}
      />
    </div>
  );
}