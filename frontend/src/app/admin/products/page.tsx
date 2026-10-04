import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import ProductDecisionButtons from "@/components/ProductDecisionButtons";
import SuperadminDeleteProductButton from "@/components/SuperadminDeleteProductButton";
import { requireAdmin } from "@/lib/auth";
import { getAdminProducts } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/utils";
import { AdminProductCardSkeleton, AdminPageHeaderSkeleton, AdminTabsSkeleton } from "@/components/AdminSkeletons";

export const metadata = {
  title: "Product reviews",
};

export const dynamic = "force-dynamic";

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Live" },
  { key: "rejected", label: "Rejected" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

async function ProductsContent({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const user = await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const status: TabKey =
    params.status === "approved" || params.status === "rejected"
      ? params.status
      : "pending";
  const products = await getAdminProducts(status);
  const isSuperadmin = user.profile?.role === "superadmin";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Product reviews</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Products from unverified sellers wait here. Verified sellers go
          live instantly and never appear in this queue.
          {isSuperadmin &&
            " As superadmin you can also delete any product — a reason is required and saved to the audit log."}
        </p>
      </div>

      <div className="flex gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={`/admin/products?status=${tab.key}`}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === tab.key
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No {status === "approved" ? "live" : status} products.
        </p>
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
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
                  {product.shop?.name ?? "Unknown shop"} ·{" "}
                  {product.category || "Uncategorized"} ·{" "}
                  {formatDate(product.created_at)}
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(product.price, product.currency)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {status === "pending" && (
                  <ProductDecisionButtons productId={product.id} />
                )}
                {isSuperadmin && (
                  <SuperadminDeleteProductButton
                    productId={product.id}
                    productName={product.name}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<AdminPageHeaderSkeleton />}>
        <ProductsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}