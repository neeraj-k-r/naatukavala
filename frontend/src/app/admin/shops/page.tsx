import { requireAdmin } from "@/lib/auth";
import { getAllShops } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import ShopDecisionButtons from "@/components/ShopDecisionButtons";
import VerificationDecision from "@/components/VerificationDecision";

export const metadata = {
  title: "Shops & sellers",
};

export default async function AdminShopsPage() {
  await requireAdmin();
  const shops = await getAllShops();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Shops & sellers</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Approve new sellers to go live, or suspend shops when needed.
        </p>
      </div>

      <div className="space-y-3">
        {shops.map((shop) => (
          <div
            key={shop.id}
            className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{shop.name}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {shop.slug}.{process.env.NEXT_PUBLIC_APP_DOMAIN || "shop"} ·
                  owner: {shop.owner_name ?? "unknown"} · joined{" "}
                  {formatDate(shop.created_at)}
                </p>
                {shop.tagline && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{shop.tagline}</p>
                )}
              </div>
              <ShopDecisionButtons shopId={shop.id} status={shop.status} />
            </div>

            <VerificationDecision
              shopId={shop.id}
              docUrl={shop.verification_doc_url ?? null}
              status={shop.verification_status ?? "none"}
            />
          </div>
        ))}
      </div>
    </div>
  );
}