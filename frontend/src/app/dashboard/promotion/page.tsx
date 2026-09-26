import PromotionRequestForm from "@/components/PromotionRequestForm";
import { requireSeller } from "@/lib/auth";
import { getMyPromotions, getOwnerProducts, getShopByOwner } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export const metadata = {
  title: "Promote",
};

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  expired: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default async function PromotionPage() {
  const user = await requireSeller();
  const [shop, products] = await Promise.all([
    getShopByOwner(user.id),
    getOwnerProducts(user.id),
  ]);

  // Degrade gracefully when the migration hasn't been run yet.
  let promotions: Awaited<ReturnType<typeof getMyPromotions>> = [];
  let loadError: string | null = null;
  try {
    promotions = await getMyPromotions();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load promotions.";
  }

  const canRequest = shop?.status === "approved";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Promote</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Get a sponsored spot on the marketplace — your shop or product is
          featured at the top with a Sponsored badge once approved.
        </p>
      </div>

      {!shop ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-6 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Create your shop first, then request a promotion.
        </div>
      ) : !canRequest ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Promotions unlock once your shop is approved. Your current status:{" "}
          <span className="font-semibold capitalize">{shop.status}</span>.
        </div>
      ) : (
        <PromotionRequestForm shopName={shop.name} products={products} />
      )}

      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h3 className="font-bold text-slate-900 dark:text-slate-100">My requests</h3>
        {loadError ? (
          <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
            Promotion history is unavailable right now ({loadError}). You can
            still use the request form above.
          </p>
        ) : promotions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No promotion requests yet.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {promotions.map((promotion) => (
              <li
                key={promotion.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {promotion.product_id
                      ? (promotion.product_name ?? "Product")
                      : "Whole shop"}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Requested {formatDate(promotion.created_at)}
                    {promotion.status === "approved" && promotion.ends_at && (
                      <> · runs till {formatDate(promotion.ends_at)}</>
                    )}
                    {promotion.decision_note && (
                      <> · “{promotion.decision_note}”</>
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[promotion.status] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
                >
                  {promotion.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
