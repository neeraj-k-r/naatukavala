import { getSupabaseAdmin } from "./supabase.js";
import { clearCache } from "./cache.js";

/** Unconfirmed orders live for 1 day before they are auto-cancelled. */
export const ORDER_EXPIRY_MS = 24 * 60 * 60 * 1000;
const SWEEP_LIMIT = 200;
const AUTO_CANCEL_NOTE =
  "Auto-cancelled: the shop did not confirm within 24 hours.";

/**
 * Cancels pending orders older than 1 day: flips them to cancelled
 * (race-safe), records tracking history, restores reserved stock and
 * refreshes one unread admin notification per affected shop. Runs lazily
 * from the order reads — no cron needed at this scale.
 */
export async function expireStalePendingOrders(): Promise<{
  cancelled: number;
}> {
  const supabase = getSupabaseAdmin();
  const cutoff = new Date(Date.now() - ORDER_EXPIRY_MS).toISOString();

  const { data: stale, error } = await supabase
    .from("orders")
    .select("id, shop_id")
    .eq("status", "pending")
    .lt("created_at", cutoff)
    .limit(SWEEP_LIMIT);

  if (error || !stale || stale.length === 0) return { cancelled: 0 };

  const ids = stale.map((order) => order.id);
  const { data: cancelled, error: cancelError } = await supabase
    .from("orders")
    .update({ status: "cancelled" })
    .in("id", ids)
    .eq("status", "pending")
    .select("id, shop_id");

  if (cancelError || !cancelled || cancelled.length === 0) {
    return { cancelled: 0 };
  }

  await supabase.from("order_status_history").insert(
    cancelled.map((order) => ({
      order_id: order.id,
      status: "cancelled" as const,
      note: AUTO_CANCEL_NOTE,
    })),
  );

  // Restore reserved stock, mirroring manual cancellation.
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .in(
      "order_id",
      cancelled.map((order) => order.id),
    );
  for (const item of items ?? []) {
    const { data: prod } = await supabase
      .from("products")
      .select("stock")
      .eq("id", item.product_id)
      .maybeSingle();
    await supabase
      .from("products")
      .update({
        stock: Math.max(0, Number(prod?.stock ?? 0) + item.quantity),
      })
      .eq("id", item.product_id);
  }

  await notifyShops(cancelled.map((order) => order.shop_id));
  clearCache();
  return { cancelled: cancelled.length };
}

/** One unread notification per shop: how many orders it isn't accepting. */
async function notifyShops(shopIds: string[]) {
  const uniq = [...new Set(shopIds)].filter(Boolean);
  if (uniq.length === 0) return;

  try {
    const supabase = getSupabaseAdmin();
    const since = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    for (const shopId of uniq) {
      const { data: autoRows } = await supabase
        .from("order_status_history")
        .select("order_id, orders!inner(shop_id)")
        .eq("status", "cancelled")
        .eq("note", AUTO_CANCEL_NOTE)
        .eq("orders.shop_id", shopId)
        .gte("created_at", since);

      const orderCount = (autoRows ?? []).length;
      const { data: shop } = await supabase
        .from("shops")
        .select("name")
        .eq("id", shopId)
        .maybeSingle();
      const shopName = shop?.name ?? "A shop";
      const message =
        `${shopName} is not accepting orders — ` +
        `${orderCount} order${orderCount === 1 ? "" : "s"} auto-cancelled ` +
        `in the last 30 days after going unconfirmed for 24 hours.`;

      const { data: existing } = await supabase
        .from("admin_notifications")
        .select("id")
        .eq("kind", "unaccepted_orders")
        .eq("shop_id", shopId)
        .eq("is_read", false)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("admin_notifications")
          .update({ order_count: orderCount, message })
          .eq("id", existing.id);
      } else {
        await supabase.from("admin_notifications").insert({
          kind: "unaccepted_orders",
          shop_id: shopId,
          order_count: orderCount,
          message,
          is_read: false,
        });
      }
    }
  } catch {
    // Notifications table not migrated yet — orders are still cancelled.
  }
}
