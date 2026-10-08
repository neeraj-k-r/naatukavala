import { Suspense } from "react";

import AdminPromotionCard from "@/components/AdminPromotionCard";
import { requireAdmin } from "@/lib/auth";
import { getAllPromotions } from "@/lib/api";
import { AdminPageHeaderSkeleton } from "@/components/AdminSkeletons";

import type { Promotion } from "@/lib/types";

export const metadata = {
  title: "Promotions",
};

export const dynamic = "force-dynamic";

async function PromotionsContent() {
  await requireAdmin();

  let promotions: Promotion[] = [];
  let loadError: string | null = null;
  try {
    promotions = await getAllPromotions();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load promotions.";
  }

  const pending = promotions.filter((p) => p.status === "requested");
  const active = promotions.filter((p) => p.status === "approved");
  const history = promotions.filter(
    (p) =>
      p.status === "rejected" || p.status === "expired" || p.status === "removed",
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Promotions</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Approve sponsored spots for the marketplace — shops and products get
          featured placement with a Sponsored badge.
        </p>
      </div>

      {loadError && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p className="font-semibold">Promotions are not set up yet.</p>
          <p className="mt-1">
            Run{" "}
            <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs dark:bg-amber-900">
              backend/supabase/migrations/20260919_promotions.sql
            </code>{" "}
            in the Supabase SQL editor, then refresh this page.
          </p>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">{loadError}</p>
        </div>
      )}

      {!loadError && (
        <>
          <section>
            <h3 className="mb-3 font-bold text-slate-900 dark:text-slate-100">
              Pending requests ({pending.length})
            </h3>
            {pending.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                No pending promotion requests.
              </p>
            ) : (
              <div className="space-y-3">
                {pending.map((promotion) => (
                  <AdminPromotionCard key={promotion.id} promotion={promotion} />
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="mb-3 font-bold text-slate-900 dark:text-slate-100">
              Active ({active.length})
            </h3>
            {active.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                Nothing promoted right now.
              </p>
            ) : (
              <div className="space-y-3">
                {active.map((promotion) => (
                  <AdminPromotionCard key={promotion.id} promotion={promotion} />
                ))}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h3 className="mb-3 font-bold text-slate-400 dark:text-slate-500">
                History ({history.length})
              </h3>
              <div className="space-y-3 opacity-90">
                {history.map((promotion) => (
                  <AdminPromotionCard key={promotion.id} promotion={promotion} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

export default async function AdminPromotionsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<AdminPageHeaderSkeleton />}>
        <PromotionsContent />
      </Suspense>
    </div>
  );
}
