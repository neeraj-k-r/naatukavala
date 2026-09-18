import Link from "next/link";

import { requireSeller } from "@/lib/auth";
import { getOwnerProducts, getSellerOrders, getShopByOwner } from "@/lib/api";

export const metadata = {
  title: "Seller dashboard",
};

// Never serve one seller's stats to another account from the static cache.
export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  const user = await requireSeller();
  const [shop, products, orders] = await Promise.all([
    getShopByOwner(user.id),
    getOwnerProducts(user.id),
    getSellerOrders(user.id),
  ]);

  return (
    <div className="space-y-6">
      {!shop && (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Set up your shop</h2>
          <p className="mt-1 text-sm text-slate-500">
            Get your storefront ready so buyers can find you.
          </p>
          <Link
            href="/dashboard/shop"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Create your shop
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Products" value={products.length} />
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Status" value={shop ? shop.status : "no shop"} />
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent products</h2>
          <Link
            href="/dashboard/products/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Add product
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No products yet.{" "}
            <Link href="/dashboard/products/new" className="font-medium text-emerald-700 hover:underline">
              Add your first product
            </Link>
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100">
            {products.slice(0, 5).map((product) => (
              <li
                key={product.id}
                className="flex items-center justify-between py-3 text-sm"
              >
                <span className="font-medium text-slate-800">{product.name}</span>
                <span className="text-slate-400">
                  ₹{Number(product.price)}
                  {!product.is_active && " · hidden"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-extrabold capitalize text-slate-900">
        {value}
      </p>
    </div>
  );
}