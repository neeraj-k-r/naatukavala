import Image from "next/image";

import ProductDecisionButtons from "@/components/ProductDecisionButtons";
import { requireAdmin } from "@/lib/auth";
import { getPendingProducts } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "Product reviews",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();
  const products = await getPendingProducts();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Product reviews</h2>
        <p className="mt-1 text-sm text-slate-500">
          Products from unverified sellers wait here. Verified sellers go
          live instantly and never appear in this queue.
        </p>
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
          No products waiting for review.
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {product.images?.[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl">
                    🌿
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {product.name}
                </p>
                <p className="text-xs text-slate-400">
                  {product.shop?.name ?? "Unknown shop"} ·{" "}
                  {product.category || "Uncategorized"} ·{" "}
                  {formatDate(product.created_at)}
                </p>
                <p className="text-sm font-bold text-slate-900">
                  {formatCurrency(product.price, product.currency)}
                </p>
              </div>
              <ProductDecisionButtons productId={product.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
