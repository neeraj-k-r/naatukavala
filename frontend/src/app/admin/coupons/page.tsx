import { Suspense } from "react";

import CouponCreateForm from "@/components/CouponCreateForm";
import CouponToggleButton from "@/components/CouponToggleButton";
import { requireAdmin } from "@/lib/auth";
import { getCoupons } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { AdminCardListSkeleton, AdminPageHeaderSkeleton } from "@/components/AdminSkeletons";

export const metadata = {
  title: "Coupons",
};

export const dynamic = "force-dynamic";

function describe(coupon: Awaited<ReturnType<typeof getCoupons>>[number]) {
  const value =
    coupon.kind === "flat"
      ? `₹${Number(coupon.value)} off`
      : `${Number(coupon.value)}% off`;
  const cap =
    coupon.kind === "percent" && coupon.max_discount !== null
      ? `, up to ₹${Number(coupon.max_discount)} per order`
      : "";
  const min =
    Number(coupon.min_order_value) > 0
      ? `, min ₹${Number(coupon.min_order_value)}`
      : "";
  const uses = coupon.max_uses !== null ? ` · ${coupon.used_count}/${coupon.max_uses} used` : "";
  return `${value}${cap}${min}${uses}`;
}

async function CouponsContent() {
  await requireAdmin();
  const coupons = await getCoupons();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Coupons
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Flat ₹-off applies once to the biggest shop order; percent-off
          applies to every shop order in the checkout.
        </p>
      </div>

      <CouponCreateForm />

      <div className="space-y-3">
        {coupons.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No coupon codes yet.
          </p>
        ) : (
          coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold tracking-wide text-slate-900 dark:text-slate-100">
                  {coupon.code}{" "}
                  <span
                    className={`ml-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      coupon.is_active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {coupon.is_active ? "active" : "paused"}
                  </span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {describe(coupon)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {coupon.per_user_limit} per buyer
                  {coupon.ends_at
                    ? ` · expires ${formatDate(coupon.ends_at)}`
                    : " · no expiry"}{" "}
                  · created {formatDate(coupon.created_at)}
                </p>
              </div>
              <CouponToggleButton
                couponId={coupon.id}
                isActive={coupon.is_active}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default async function AdminCouponsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<AdminPageHeaderSkeleton />}>
        <CouponsContent />
      </Suspense>
    </div>
  );
}