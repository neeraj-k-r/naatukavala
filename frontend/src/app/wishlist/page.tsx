import Link from "next/link";

import ProductGrid from "@/components/ProductGrid";
import { requireBuyer } from "@/lib/auth";
import { getWishlist } from "@/lib/api";

export const metadata = {
  title: "My wishlist",
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  await requireBuyer();
  const items = await getWishlist();

  const products = items.map((item) => item.product);
  const wishlistIds = new Set(items.map((item) => item.product_id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My wishlist</h1>
      <p className="mt-1 text-sm text-slate-500">
        {products.length} saved item{products.length === 1 ? "" : "s"}.
      </p>

      {products.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-lg font-semibold text-slate-700">
            Nothing saved yet
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Tap the heart on any product to save it here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <ProductGrid
            products={products}
            wishlistIds={wishlistIds}
            signedIn
          />
        </div>
      )}
    </div>
  );
}
