import PromotionDecision from "@/components/PromotionDecision";
import { requireAdmin } from "@/lib/auth";
import { getAllPromotions } from "@/lib/api";
import { formatDate } from "@/lib/utils";

import type { Promotion } from "@/lib/types";

export const metadata = {
  title: "Promotions",
};

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  expired: "bg-slate-100 text-slate-500",
};

function PromotionCard({ promotion }: { promotion: Promotion }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {promotion.product_id
              ? (promotion.product_name ?? "Product")
              : "Whole shop"}
            <span className="font-normal text-slate-500">
              {" "}
              · {promotion.shop_name ?? "unknown shop"}
              {promotion.shop_slug ? ` (${promotion.shop_slug})` : ""}
            </span>
          </p>
          <p className="text-xs text-slate-400">
            Requested {formatDate(promotion.created_at)}
            {promotion.status === "approved" && promotion.ends_at && (
              <> · runs till {formatDate(promotion.ends_at)}</>
            )}
          </p>
          {promotion.note && (
            <p className="mt-1 text-xs text-slate-500">
              Seller note: “{promotion.note}”
            </p>
          )}
          {promotion.decision_note && (
            <p className="mt-1 text-xs text-slate-500">
              Decision note: “{promotion.decision_note}”
            </p>
          )}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[promotion.status] ?? "bg-slate-100 text-slate-500"}`}
        >
          {promotion.status}
        </span>
      </div>

      {(promotion.status === "requested" ||
        promotion.status === "approved") && (
        <PromotionDecision
          promotionId={promotion.id}
          status={promotion.status}
        />
      )}
    </div>
  );
}

export default async function AdminPromotionsPage() {
  await requireAdmin();
  const promotions = await getAllPromotions();

  const pending = promotions.filter((p) => p.status === "requested");
  const active = promotions.filter((p) => p.status === "approved");
  const history = promotions.filter(
    (p) => p.status === "rejected" || p.status === "expired",
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Promotions</h2>
        <p className="mt-1 text-sm text-slate-500">
          Approve sponsored spots for the marketplace — shops and products get
          featured placement with a Sponsored badge.
        </p>
      </div>

      <section>
        <h3 className="mb-3 font-bold text-slate-900">
          Pending requests ({pending.length})
        </h3>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            No pending promotion requests.
          </p>
        ) : (
          <div className="space-y-3">
            {pending.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-bold text-slate-900">
          Active ({active.length})
        </h3>
        {active.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500">
            Nothing promoted right now.
          </p>
        ) : (
          <div className="space-y-3">
            {active.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h3 className="mb-3 font-bold text-slate-400">
            History ({history.length})
          </h3>
          <div className="space-y-3 opacity-90">
            {history.map((promotion) => (
              <PromotionCard key={promotion.id} promotion={promotion} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
