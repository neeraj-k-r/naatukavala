import Link from "next/link";

import ShopForm from "@/components/ShopForm";
import { requireSeller } from "@/lib/auth";
import { getShopByOwner } from "@/lib/queries";
import { shopUrl } from "@/lib/subdomain";

export const metadata = {
  title: "Shop profile",
};

export default async function ShopProfilePage() {
  const user = await requireSeller();
  const shop = await getShopByOwner(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {shop ? "Shop profile" : "Create your shop"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {shop
            ? "Update the details buyers see on your storefront."
            : "Pick a name and URL for your storefront. We'll review it and approve it soon."}
        </p>
      </div>

      {shop && (
        <Link
          href={shopUrl(shop.slug)}
          className="inline-block rounded-lg bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          View {shop.name}→
        </Link>
      )}

      <ShopForm shop={shop} />
    </div>
  );
}