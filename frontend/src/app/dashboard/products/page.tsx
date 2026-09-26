import Image from "next/image";
import Link from "next/link";

import DeleteProductButton from "@/components/DeleteProductButton";
import { requireSeller } from "@/lib/auth";
import { getOwnerProducts } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = {
  title: "My products",
};

export default async function ProductsPage() {
  const user = await requireSeller();
  const products = await getOwnerProducts(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Products</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {products.length} product{products.length === 1 ? "" : "s"} listed.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + New product
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">No products yet.</p>
          <Link
            href="/dashboard/products/new"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Add your first product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
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
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {product.name}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {product.category || "Uncategorized"} · {formatDate(product.created_at)}
                  {!product.is_active && " · hidden"}
                </p>
                {product.approval_status === "pending" && (
                  <p className="mt-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                    In review — goes live once approved
                  </p>
                )}
                {product.approval_status === "rejected" && (
                  <p className="mt-0.5 text-xs font-semibold text-red-600 dark:text-red-400">
                    Not approved — edit and resubmit for review
                  </p>
                )}
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(product.price, product.currency)}{" "}
                  <span className="font-normal text-slate-400 dark:text-slate-500">· {product.stock} in stock</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Edit
                </Link>
                <DeleteProductButton id={product.id} name={product.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}