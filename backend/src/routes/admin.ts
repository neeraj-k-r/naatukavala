import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { clearCache } from "../lib/cache.js";
import type { Database } from "../lib/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

router.use(requireAuth, requireRole(["admin", "superadmin"]));

router.get("/shops", async (_req, res) => {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const shopRows = data ?? [];
  const ownerIds = [...new Set(shopRows.map((shop) => shop.owner_id))];
  const ownerNames = new Map<string, string>();

  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", ownerIds);
    for (const profile of profiles ?? []) {
      ownerNames.set(profile.id, profile.full_name);
    }
  }

  return res.json({
    shops: shopRows.map((shop) => ({
      ...shop,
      owner_name: ownerNames.get(shop.owner_id) ?? null,
    })),
  });
});

router.get("/users", async (_req, res) => {
  const supabase = getSupabaseAdmin();

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) return res.status(500).json({ error: error.message });

  const ids = users.map((user) => user.id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("id", ids);

  const profileById = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile]),
  );

  return res.json({
    users: users.map((user) => {
      const profile = profileById.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        full_name: profile?.full_name ?? "",
        role: profile?.role ?? "buyer",
        created_at: user.created_at ?? new Date().toISOString(),
      };
    }),
  });
});

router.get("/stats", async (_req, res) => {
  const supabase = getSupabaseAdmin();

  const [shops, users, products, orders] = await Promise.all([
    supabase.from("shops").select("id, status"),
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from("products").select("id"),
    supabase.from("orders").select("id"),
  ]);

  const shopRows = shops.data ?? [];
  const pending = shopRows.filter((shop) => shop.status === "pending").length;

  return res.json({
    totalShops: shopRows.length,
    pendingShops: pending,
    approvedShops: shopRows.filter((shop) => shop.status === "approved").length,
    totalUsers: users.data?.users.length ?? 0,
    totalProducts: products.data?.length ?? 0,
    totalOrders: orders.data?.length ?? 0,
  });
});

type AdminOrderRow = {
  id: string;
  buyer_id: string;
  shop_id: string;
  status: string;
  total: number;
  currency: string;
  shipping_address: string | null;
  buyer_note: string | null;
  tracking_number: string | null;
  created_at: string;
};

async function fetchAllOrders(): Promise<AdminOrderRow[]> {
  const supabase = getSupabaseAdmin();
  const pageSize = 1000;
  const all: AdminOrderRow[] = [];
  for (let page = 0; ; page++) {
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, buyer_id, shop_id, status, total, currency, shipping_address, buyer_note, tracking_number, created_at",
      )
      .order("created_at", { ascending: false })
      .range(page * pageSize, page * pageSize + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...(data as AdminOrderRow[]));
    if (data.length < pageSize) break;
    if (all.length >= 10000) break;
  }
  return all;
}

/**
 * Marketplace-wide sales report for the admin panel.
 * Powers KPI cards, revenue graphs, top shops/products and fulfilment queues.
 * `?days=7|30|90` controls the daily series length (default 30).
 */
router.get("/sales-report", async (req, res) => {
  try {
    const daysParam = Math.max(
      1,
      Math.min(90, Math.floor(Number(req.query.days ?? 30)) || 30),
    );
    const supabase = getSupabaseAdmin();
    const orders = await fetchAllOrders();
    const sales = orders.filter((order) => order.status !== "cancelled");
    const round2 = (value: number) => Math.round(value * 100) / 100;
    const num = (value: unknown) => Number(value ?? 0) || 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayKey = (date: Date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    const daily: { date: string; label: string; orders: number; revenue: number }[] = [];
    const dailyIndex = new Map<string, number>();
    for (let i = daysParam - 1; i >= 0; i--) {
      const date = new Date(startOfToday);
      date.setDate(date.getDate() - i);
      const key = dayKey(date);
      dailyIndex.set(key, daily.length);
      daily.push({
        date: key,
        label: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        orders: 0,
        revenue: 0,
      });
    }

    const monthly: { month: string; orders: number; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      monthly.push({ month: key, orders: 0, revenue: 0 });
    }
    const monthIndex = new Map(monthly.map((entry, index) => [entry.month, index]));

    const revenue = sales.reduce((sum, order) => sum + num(order.total), 0);
    const todayKey = dayKey(now);
    const last7Start = new Date(startOfToday);
    last7Start.setDate(last7Start.getDate() - 6);
    const last30Start = new Date(startOfToday);
    last30Start.setDate(last30Start.getDate() - 29);

    let todayRevenue = 0;
    let last7Revenue = 0;
    let last30Revenue = 0;
    let todayOrders = 0;

    const byStatus: Record<string, { orders: number; revenue: number }> = {
      pending: { orders: 0, revenue: 0 },
      confirmed: { orders: 0, revenue: 0 },
      shipped: { orders: 0, revenue: 0 },
      delivered: { orders: 0, revenue: 0 },
      cancelled: { orders: 0, revenue: 0 },
    };

    for (const order of orders) {
      const created = new Date(order.created_at);
      const dKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}-${String(created.getDate()).padStart(2, "0")}`;
      const mKey = (order.created_at ?? "").slice(0, 7);
      const bucket = byStatus[order.status] ?? (byStatus[order.status] = { orders: 0, revenue: 0 });
      bucket.orders += 1;
      if (order.status !== "cancelled") bucket.revenue = round2(bucket.revenue + num(order.total));

      if (order.status === "cancelled") continue;
      const dayIdx = dailyIndex.get(dKey);
      if (dayIdx !== undefined) {
        daily[dayIdx].orders += 1;
        daily[dayIdx].revenue = round2(daily[dayIdx].revenue + num(order.total));
      }
      const mIdx = monthIndex.get(mKey);
      if (mIdx !== undefined) {
        monthly[mIdx].orders += 1;
        monthly[mIdx].revenue = round2(monthly[mIdx].revenue + num(order.total));
      }
      if (dKey === todayKey) {
        todayRevenue = round2(todayRevenue + num(order.total));
        todayOrders += 1;
      }
      if (created >= last7Start) last7Revenue = round2(last7Revenue + num(order.total));
      if (created >= last30Start) last30Revenue = round2(last30Revenue + num(order.total));
    }

    // Shop + product leaderboards.
    const shopIds = [...new Set(orders.map((order) => order.shop_id).filter(Boolean))];
    const shopMeta = new Map<string, { name: string; slug: string }>();
    if (shopIds.length > 0) {
      const { data: shopRows } = await supabase
        .from("shops")
        .select("id, name, slug")
        .in("id", shopIds);
      for (const shop of shopRows ?? []) {
        shopMeta.set(shop.id, { name: shop.name, slug: shop.slug });
      }
    }

    const shopAgg = new Map<string, { shop_id: string; orders: number; revenue: number }>();
    for (const order of sales) {
      const row = shopAgg.get(order.shop_id) ?? { shop_id: order.shop_id, orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue = round2(row.revenue + num(order.total));
      shopAgg.set(order.shop_id, row);
    }
    const topShops = [...shopAgg.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
      .map((row) => ({
        ...row,
        shop_name: shopMeta.get(row.shop_id)?.name ?? "Unknown shop",
        shop_slug: shopMeta.get(row.shop_id)?.slug ?? null,
      }));

    const soldIds = new Set(sales.map((order) => order.id));
    let topProducts: {
      product_id: string;
      product_name: string;
      image_url: string | null;
      currency: string;
      units: number;
      revenue: number;
    }[] = [];
    const orderIds = orders.map((order) => order.id);
    if (orderIds.length > 0) {
      const items: {
        order_id: string;
        product_id: string;
        product_name: string;
        image_url: string | null;
        quantity: number;
        unit_price: number;
        currency: string;
      }[] = [];
      // order_items has no timestamp — page through by order id chunks.
      for (let i = 0; i < orderIds.length; i += 200) {
        const chunk = orderIds.slice(i, i + 200);
        const { data, error } = await supabase
          .from("order_items")
          .select("order_id, product_id, product_name, image_url, quantity, unit_price, currency")
          .in("order_id", chunk);
        if (error) throw new Error(error.message);
        items.push(...(data ?? []));
      }
      const productMap = new Map<string, (typeof topProducts)[number]>();
      for (const item of items) {
        if (!soldIds.has(item.order_id)) continue;
        const row = productMap.get(item.product_id) ?? {
          product_id: item.product_id,
          product_name: item.product_name,
          image_url: item.image_url,
          currency: item.currency,
          units: 0,
          revenue: 0,
        };
        row.units += num(item.quantity);
        row.revenue = round2(row.revenue + num(item.unit_price) * num(item.quantity));
        productMap.set(item.product_id, row);
      }
      topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    }

    const { data: pendingReturns } = await supabase
      .from("order_returns")
      .select("id, order_id, reason, status, created_at")
      .eq("status", "requested")
      .order("created_at", { ascending: false })
      .limit(25);

    const upcoming = byStatus.pending.orders + byStatus.confirmed.orders;
    const inTransit = byStatus.shipped.orders;
    const needsTracking = orders.filter(
      (order) => order.status === "shipped" && !order.tracking_number,
    ).length;

    return res.json({
      summary: {
        totalOrders: orders.length,
        netOrders: sales.length,
        totalRevenue: round2(revenue),
        avgOrderValue: sales.length ? round2(revenue / sales.length) : 0,
        todayOrders,
        todayRevenue: round2(todayRevenue),
        last7Revenue: round2(last7Revenue),
        last30Revenue: round2(last30Revenue),
        delivered: byStatus.delivered.orders,
        pending: byStatus.pending.orders,
        confirmed: byStatus.confirmed.orders,
        shipped: byStatus.shipped.orders,
        cancelled: byStatus.cancelled.orders,
        upcoming,
        inTransit,
        needsTracking,
        pendingReturns: pendingReturns?.length ?? 0,
      },
      daily,
      monthly,
      byStatus: Object.entries(byStatus).map(([status, value]) => ({
        status,
        orders: value.orders,
        revenue: round2(value.revenue),
      })),
      topShops,
      topProducts,
      pendingReturns: pendingReturns ?? [],
      currency: sales[0]?.currency ?? orders[0]?.currency ?? "INR",
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not build sales report." });
  }
});

/**
 * Every booking/order across the marketplace with shop + buyer context.
 * `?group=upcoming|ongoing|dispatch|needs-tracking|delivered|cancelled|all&status=&search=&limit=&offset=`
 * - upcoming: pending + confirmed (new bookings to fulfil)
 * - ongoing: confirmed + shipped (being prepared / on the way)
 * - dispatch: confirmed (ready to dispatch) + shipped (dispatched, in transit)
 */
router.get("/orders", async (req, res) => {
  try {
    const supabase = getSupabaseAdmin();
    const group = String(req.query.group ?? "all");
    const statusFilter = String(req.query.status ?? "").trim();
    const search = String(req.query.search ?? "").trim().toLowerCase();
    const limit = Math.max(1, Math.min(200, Math.floor(Number(req.query.limit ?? 60)) || 60));
    const offset = Math.max(0, Math.floor(Number(req.query.offset ?? 0)) || 0);

    const GROUP_STATUS: Record<string, string[]> = {
      upcoming: ["pending", "confirmed"],
      ongoing: ["confirmed", "shipped"],
      dispatch: ["confirmed", "shipped"],
    };

    let query = supabase
      .from("orders")
      .select(
        "id, buyer_id, shop_id, status, total, currency, shipping_address, buyer_note, tracking_number, created_at, shop:shops(name, slug)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (group === "needs-tracking") {
      query = query.eq("status" as never, "shipped" as never).or("tracking_number.is.null,tracking_number.eq.");
    } else if (GROUP_STATUS[group]) {
      query = query.in("status" as never, GROUP_STATUS[group] as never[]);
    } else if (statusFilter && statusFilter !== "all") {
      query = query.eq("status" as never, statusFilter as never);
    }
    if (group === "dispatch" && String(req.query.ready ?? "") === "true") {
      query = query.eq("status", "confirmed");
    }

    const { data, error, count } = await query;
    if (error) return res.status(500).json({ error: error.message });

    let rows = (data ?? []) as unknown as (AdminOrderRow & {
      shop: { name: string; slug: string } | null;
    })[];

    if (search) {
      rows = rows.filter(
        (row) =>
          row.id.toLowerCase().includes(search) ||
          (row.tracking_number ?? "").toLowerCase().includes(search) ||
          (row.shop?.name ?? "").toLowerCase().includes(search) ||
          (row.shipping_address ?? "").toLowerCase().includes(search),
      );
    }

    const buyerIds = [...new Set(rows.map((row) => row.buyer_id).filter(Boolean))];
    const buyerNames = new Map<string, string>();
    if (buyerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", buyerIds);
      for (const profile of profiles ?? []) {
        buyerNames.set(profile.id, profile.full_name);
      }
    }

    return res.json({
      orders: rows.map((row) => ({
        ...row,
        buyer_name: buyerNames.get(row.buyer_id) ?? null,
      })),
      total: count ?? rows.length,
    });
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : "Could not load bookings." });
  }
});

/** Admin override for fulfilment: mark any order pending → confirmed → shipped → delivered. */
router.patch("/orders/:id/status", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { status, tracking_number } = req.body ?? {};
  const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (status !== undefined && !allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status." });
  }
  const tracking =
    tracking_number === undefined || tracking_number === null
      ? undefined
      : String(tracking_number).trim();

  const supabase = getSupabaseAdmin();
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, tracking_number")
    .eq("id", String(req.params.id))
    .maybeSingle();
  if (!order) return res.status(404).json({ error: "Order not found." });

  const update: Record<string, string | null> = {};
  if (typeof status === "string" && allowed.includes(status)) update.status = status;
  if (tracking !== undefined) update.tracking_number = tracking || null;
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Nothing to update." });
  }

  const { error } = await supabase.from("orders").update(update as never).eq("id", order.id);
  if (error) return res.status(500).json({ error: error.message });

  if (typeof status === "string" && status !== order.status) {
    await supabase.from("order_status_history").insert({
      order_id: order.id,
      status,
      note: `Updated by admin ${req.user.email ?? req.user.id}`,
    } as never);
  }
  clearCache();
  return res.json({ ok: true });
});

router.patch("/shops/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { decision } = req.body ?? {};
  const statusFor: Record<string, Database["public"]["Tables"]["shops"]["Row"]["status"]> = {
    approve: "approved",
    reject: "rejected",
    suspend: "suspended",
  };
  const status = statusFor[decision];
  if (!status) return res.status(400).json({ error: "Invalid decision." });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("shops")
    .update({
      status,
      approved_by: req.user.id,
      approved_at: decision === "approve" ? new Date().toISOString() : null,
    })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.json({ ok: true });
});

router.patch("/shops/:id/verification", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { decision } = req.body ?? {};
  const statusFor: Record<string, "verified" | "rejected"> = {
    verified: "verified",
    rejected: "rejected",
  };
  const status = statusFor[decision];
  if (!status) {
    return res.status(400).json({ error: "Decision must be verified or rejected." });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("shops")
    .update({
      verification_status: status,
      verified_at: status === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.json({ ok: true });
});

router.patch("/users/:id/role", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { role } = req.body ?? {};
  const allowed = ["superadmin", "admin", "seller", "buyer"];
  if (!allowed.includes(role)) return res.status(400).json({ error: "Invalid role." });

  const supabase = getSupabaseAdmin();

  // Only superadmin may grant admin/superadmin roles.
  if (role === "admin" || role === "superadmin") {
    if (req.user.profile?.role !== "superadmin") {
      return res.status(403).json({ error: "Only a superadmin can grant admin roles." });
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

router.delete("/users/:id", async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.auth.admin.deleteUser(req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;