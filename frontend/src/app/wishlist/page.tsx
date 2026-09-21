import Link from "next/link";

import ProductGrid from "@/components/ProductGrid";
import { requireBuyer } from "@/lib/auth";
import { getPriceDrops, getWishlist } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export const metadata = {
  title: "My wishlist",
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  await requireBuyer();
  // Viewing the wishlist marks the drops as seen (notify).
  const [items, drops] = await Promise.all([
    getWishlist(),
    getPriceDrops(true),
  ]);

  const products = items.map((item) => item.product);
  const wishlistIds = new Set(items.map((item) => item.product_id));
  const dealLabels: Record<string, string> = Object.fromEntries(
    drops.map((drop) => [drop.product_id, `-${drop.percent_off}%`]),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">My wishlist</h1>
      <p className="mt-1 text-sm text-slate-500">
        {products.length} saved item{products.length === 1 ? "" : "s"}.
      </p>

      {drops.length > 0 && (
        <section className="mt-6 rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-orange-50 p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Price drop
            </span>
            <h2 className="text-lg font-bold text-slate-900">
              {drops.length} saved item{drops.length === 1 ? " is" : "s are"}{" "}
              cheaper now
            </h2>
          </div>
          <ul className="mb-4 space-y-1 text-sm text-slate-600">
            {drops.slice(0, 5).map((drop) => (
              <li key={drop.product_id}>
                <span className="font-medium text-slate-800">
                  {drop.product.name}
                </span>{" "}
                {formatCurrency(drop.old_price, drop.product.currency)} →{" "}
                <span className="font-bold text-rose-700">
                  {formatCurrency(drop.new_price, drop.product.currency)}
                </span>
              </li>
            ))}
          </ul>
          <ProductGrid
            products={drops.map((drop) => drop.product)}
            wishlistIds={wishlistIds}
            signedIn
            dealLabels={dealLabels}
          />
        </section>
      )}

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
            dealLabels={dealLabels}
          />
        </div>
      )}
    </div>
  );
}
