import Link from "next/link";

import ProductForm from "@/components/ProductForm";
import { createProduct } from "@/lib/actions";

export const metadata = {
  title: "Add product",
};

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add a product</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {`Add photos and a price. Your product appears in the marketplace once your shop is approved.`}
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
        <ProductForm action={createProduct} submitLabel="Add product" />
      </div>
    </div>
  );
}