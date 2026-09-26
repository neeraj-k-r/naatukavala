import Link from "next/link";
import { notFound } from "next/navigation";

import ProductForm from "@/components/ProductForm";
import { updateProduct } from "@/lib/actions";
import { requireSeller } from "@/lib/auth";
import { getOwnerProducts } from "@/lib/api";

export const metadata = {
  title: "Edit product",
};

export default async function EditProductPage({
  params,
}: PageProps<"/dashboard/products/[id]/edit">) {
  const user = await requireSeller();
  const { id } = await params;

  const products = await getOwnerProducts(user.id);
  const product = products.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Edit product</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update the details and photos.
          </p>
        </div>
        <Link
          href="/dashboard/products"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          ← Back
        </Link>
      </div>

      <div className="max-w-xl">
        <ProductForm product={product} action={updateProduct} submitLabel="Save changes" />
      </div>
    </div>
  );
}