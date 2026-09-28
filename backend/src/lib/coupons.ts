import { getSupabaseAdmin } from "./supabase.js";

export interface CouponRow {
  id: string;
  code: string;
  kind: "flat" | "percent";
  value: number;
  min_order_value: number;
  max_discount: number | null;
  max_uses: number | null;
  used_count: number;
  per_user_limit: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export interface PricedShopLine {
  shop_id: string;
  shop_name: string;
  subtotal: number;
}

export interface CouponLineResult {
  shop_id: string;
  discount: number;
}

export interface CouponDecision {
  ok: boolean;
  message: string;
  coupon: CouponRow | null;
  lines: CouponLineResult[];
  discount_total: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Checks a coupon code against the buyer's priced shop lines without
 * writing anything. Flat discounts land once on the biggest shop order;
 * percent discounts apply per shop order (each capped by max_discount).
 */
export async function evaluateCoupon(
  buyerId: string,
  rawCode: string,
  lines: PricedShopLine[],
): Promise<CouponDecision> {
  const none: CouponDecision = {
    ok: false,
    message: "",
    coupon: null,
    lines: [],
    discount_total: 0,
  };

  const code = rawCode.trim().toUpperCase();
  if (!code) return { ...none, message: "Enter a coupon code." };
  if (lines.length === 0) return { ...none, message: "Your cart is empty." };

  const supabase = getSupabaseAdmin();
  let coupon: CouponRow | null = null;
  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) throw error;
    coupon = (data ?? null) as CouponRow | null;
  } catch {
    return { ...none, message: "Coupons are not available right now." };
  }

  if (!coupon || !coupon.is_active) {
    return { ...none, message: "This code is not valid." };
  }

  const now = Date.now();
  if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now) {
    return { ...none, message: "This code is not active yet." };
  }
  if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now) {
    return { ...none, message: "This code has expired." };
  }

  const cartTotal = round2(
    lines.reduce((sum, line) => sum + line.subtotal, 0),
  );
  if (cartTotal < Number(coupon.min_order_value)) {
    return {
      ...none,
      message: `Needs a minimum order of ₹${Number(coupon.min_order_value)}.`,
    };
  }

  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    return { ...none, message: "This code has run out." };
  }

  const { data: redemptions } = await supabase
    .from("coupon_redemptions")
    .select("order_id")
    .eq("coupon_id", coupon.id)
    .eq("buyer_id", buyerId);
  const distinctOrders = new Set(
    ((redemptions ?? []) as { order_id: string }[]).map((r) => r.order_id),
  );
  if (distinctOrders.size >= coupon.per_user_limit) {
    return { ...none, message: "You have already used this code." };
  }

  let results: CouponLineResult[];
  if (coupon.kind === "percent") {
    const pct = Math.min(100, Math.max(0, Number(coupon.value)));
    results = lines.map((line) => {
      const raw = (line.subtotal * pct) / 100;
      const capped =
        coupon!.max_discount !== null
          ? Math.min(raw, Number(coupon!.max_discount))
          : raw;
      return { shop_id: line.shop_id, discount: round2(Math.min(capped, line.subtotal)) };
    });
  } else {
    const biggest = [...lines].sort((a, b) => b.subtotal - a.subtotal)[0];
    results = lines.map((line) => ({
      shop_id: line.shop_id,
      discount:
        line.shop_id === biggest.shop_id
          ? round2(Math.min(Number(coupon!.value), line.subtotal))
          : 0,
    }));
  }

  const discount_total = round2(
    results.reduce((sum, line) => sum + line.discount, 0),
  );
  if (discount_total <= 0) {
    return { ...none, message: "This code gives no discount on your cart." };
  }

  return { ok: true, message: "Coupon applied.", coupon, lines: results, discount_total };
}

/**
 * Atomically bumps used_count. False means someone else consumed the last
 * available use concurrently — the caller should stop, not overshoot.
 */
export async function consumeCouponUse(
  couponId: string,
  seenUsedCount: number,
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("coupons")
    .update({ used_count: seenUsedCount + 1 })
    .eq("id", couponId)
    .eq("used_count", seenUsedCount)
    .select("id");
  if (error) return false;
  return (data ?? []).length > 0;
}

let orderCouponColumns: boolean | null = null;

/** Whether orders.coupon_code exists (checked once per backend lifetime). */
export async function hasOrderCouponColumns(): Promise<boolean> {
  if (orderCouponColumns !== null) return orderCouponColumns;
  try {
    const { error } = await getSupabaseAdmin()
      .from("orders")
      .select("coupon_code")
      .limit(1);
    orderCouponColumns = !error;
  } catch {
    orderCouponColumns = false;
  }
  return orderCouponColumns;
}
