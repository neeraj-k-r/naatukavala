import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import AddToCartButton from "@/components/AddToCartButton";
import ReviewsSection from "@/components/ReviewsSection";
import { getProductById, getProductReviews } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { shopUrl } from "@/lib/subdomain";

export default async function ProductPage({
  params,
}: PageProps<"/product/[id]">) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const [image, reviews] = [product.images?.[0], await getProductReviews(id)];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-6xl">
                🌿
              </div>
            )}
            {product.stock === 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                Out of stock
              </span>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.map((src) => (
                <Image
                  key={src}
                  src={src}
                  alt={product.name}
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-xl border border-slate-100 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <Link
            href={shopUrl(product.shop.slug)}
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            {product.shop.name}
          </Link>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {product.name}
          </h1>

          {product.category && (
            <p className="mt-2">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                {product.category}
              </span>
            </p>
          )}

          <p className="mt-4 text-3xl font-extrabold text-slate-900">
            {formatCurrency(product.price, product.currency)}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {product.stock > 0
              ? `${product.stock} available in stock`
              : "Currently out of stock"}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Delivery charge:{" "}
            <span className="font-medium text-slate-700">
              {formatCurrency(product.shop.delivery_charge, product.currency)}
            </span>
          </p>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <AddToCartButton
              productId={product.id}
              name={product.name}
              price={product.price}
              currency={product.currency}
              image={image ?? null}
              shopName={product.shop.name}
              shopSlug={product.shop.slug}
              deliveryCharge={product.shop.delivery_charge}
              stock={product.stock}
            />
            <Link
              href="/cart"
              className="ml-3 inline-flex items-center justify-center rounded-xl border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              View cart
            </Link>
          </div>

          <div className="mt-10 rounded-2xl border border-slate-100 bg-white p-5 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">About this shop</p>
            <p className="mt-1">
              Sold by <span className="font-medium text-emerald-700">{product.shop.name}</span>{" "}
              on Naatukavala.{" "}
              <Link
                href={shopUrl(product.shop.slug)}
                className="font-medium text-emerald-700 hover:underline"
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
      />
    </div>
  );
}