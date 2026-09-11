import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { clearCache } from "../lib/cache.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import type { OrderStatus } from "../lib/types.js";

const router: Router = express.Router();

router.post("/", requireAuth, requireRole(["buyer", "seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { shipping_address, buyer_note, cart } = req.body ?? {};

  if (!Array.isArray(cart) || cart.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  const supabase = getSupabaseAdmin();
  const ids = cart.map((line) => line.product_id).filter(Boolean);
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("id", ids);

  if (productsError || !products || products.length !== ids.length) {
    return res.status(400).json({ error: "Some products in your cart are no longer available." });
  }

  const byShop = new Map<string, { product: (typeof products)[0]; quantity: number }[]>();
  for (const line of cart) {
    const product = products.find((p) => p.id === line.product_id);
    if (!product) continue;
    const qty = Math.max(1, Math.floor(Number(line.quantity)));
    if (product.stock < qty) {
      return res.status(400).json({ error: `"${product.name}" only has ${product.stock} in stock.` });
    }
    const list = byShop.get(product.shop_id) ?? [];
    list.push({ product, quantity: qty });
    byShop.set(product.shop_id, list);
  }

  const qtyById = new Map<string, number>();
  for (const line of cart) {
    const id = String(line.product_id ?? "");
    if (!id) continue;
    qtyById.set(id, (qtyById.get(id) ?? 0) + Math.max(1, Math.floor(Number(line.quantity))));
  }

  const deducted: { id: string; qty: number }[] = [];
  const revertStocks = async () => {
    for (const d of deducted) {
      const product = products.find((p) => p.id === d.id);
      await supabase
        .from("products")
        .update({ stock: Math.max(0, Number(product?.stock ?? 0) + d.qty) })
        .eq("id", d.id);
    }
    deducted.length = 0;
  };

  for (const [productId, qty] of qtyById) {
    const product = products.find((p) => p.id === productId);
    if (!product) continue;
    const { data, error } = await supabase
      .from("products")
      .update({ stock: Math.max(0, Number(product.stock ?? 0) - qty) })
      .eq("id", productId)
      .eq("stock", Number(product.stock ?? 0))
      .select("id");
    if (error || !data || data.length === 0) {
      await revertStocks();
      return res.status(409).json({ error: `"${product.name}" is no longer in stock. Please refresh your cart.` });
    }
    deducted.push({ id: productId, qty });
  }

  const shopIds = [...byShop.keys()];
  if (shopIds.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }

  const { data: shopRows } = await supabase
    .from("shops")
    .select("id, delivery_charge")
    .in("id", shopIds);
  const chargeById = new Map(
    (shopRows ?? []).map((shop) => [shop.id, Number(shop.delivery_charge ?? 0)]),
  );

  for (const [shopId, lines] of byShop) {
    const productsTotal = lines.reduce(
      (sum, { product, quantity }) => sum + Number(product.price) * quantity,
      0,
    );
    const deliveryCharge = chargeById.get(shopId) ?? 0;
    const total = productsTotal + Number(deliveryCharge);

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: req.user.id,
        shop_id: shopId,
        total,
        shipping_address: shipping_address || null,
        buyer_note: buyer_note || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      await revertStocks();
      return res.status(500).json({ error: "Could not place your order. Please try again." });
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      lines.map(({ product, quantity }) => ({
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        image_url: product.images?.[0] ?? null,
        quantity,
        unit_price: product.price,
        currency: product.currency ?? "INR",
      })),
    );

    if (itemsError) {
      await revertStocks();
      return res.status(500).json({ error: "Could not save your order items. Please try again." });
    }
  }

  clearCache();
  return res.status(201).json({ ok: true });
});

router.get("/buyer", requireAuth, requireRole(["buyer", "seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, shop:shops(name, slug, return_policy)")
    .eq("buyer_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ orders: data ?? [] });
});

router.get("/seller", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.json({ orders: [] });

  const { data, error } = await supabase
    .from("orders")
    .select("*, shop:shops(name, slug, return_policy)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ orders: data ?? [] });
});

router.get("/seller/stats", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const empty = {
    summary: {
      orders: 0,
      revenue: 0,
      avgOrderValue: 0,
      delivered: 0,
      pending: 0,
      confirmed: 0,
      shipped: 0,
      cancelled: 0,
    },
    monthly: [] as { month: string; orders: number; revenue: number }[],
    products: [] as {
      product_id: string;
      product_name: string;
      image_url: string | null;
      currency: string;
      units: number;
      revenue: number;
    }[],
  };

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.json(empty);

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, total, created_at")
    .eq("shop_id", shop.id);

  if (error) return res.status(500).json({ error: error.message });

  const all = orders ?? [];
  const sales = all.filter((order) => order.status !== "cancelled");

  const orderIds = all.map((order) => order.id);
  let items: {
    order_id: string;
    product_id: string;
    product_name: string;
    image_url: string | null;
    quantity: number;
    unit_price: number;
    currency: string;
  }[] = [];

  if (orderIds.length > 0) {
    const { data, error: itemsError } = await supabase
      .from("order_items")
      .select("order_id, product_id, product_name, image_url, quantity, unit_price, currency")
      .in("order_id", orderIds);

    if (itemsError) return res.status(500).json({ error: itemsError.message });
    items = data ?? [];
  }

  const soldOrders = new Set(sales.map((order) => order.id));
  const productMap = new Map<
    string,
    {
      product_id: string;
      product_name: string;
      image_url: string | null;
      currency: string;
      units: number;
      revenue: number;
    }
  >();

  for (const item of items) {
    if (!soldOrders.has(item.order_id)) continue;
    const row =
      productMap.get(item.product_id) ?? {
        product_id: item.product_id,
        product_name: item.product_name,
        image_url: item.image_url,
        currency: item.currency,
        units: 0,
        revenue: 0,
      };
    row.units += item.quantity;
    row.revenue += Number(item.unit_price) * item.quantity;
    productMap.set(item.product_id, row);
  }

  const revenue = sales.reduce((sum, order) => sum + Number(order.total), 0);
  const round2 = (value: number) => Math.round(value * 100) / 100;

  const now = new Date();
  const monthly: { month: string; orders: number; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    monthly.push({ month: key, orders: 0, revenue: 0 });
  }
  const monthIndex = new Map(monthly.map((entry, index) => [entry.month, index]));
  for (const order of sales) {
    const key = (order.created_at ?? "").slice(0, 7);
    const index = monthIndex.get(key);
    if (index !== undefined) {
      monthly[index].orders += 1;
      monthly[index].revenue += Number(order.total);
    }
  }

  return res.json({
    summary: {
      orders: sales.length,
      revenue: round2(revenue),
      avgOrderValue: sales.length ? round2(revenue / sales.length) : 0,
      delivered: all.filter((order) => order.status === "delivered").length,
      pending: all.filter((order) => order.status === "pending").length,
      confirmed: all.filter((order) => order.status === "confirmed").length,
      shipped: all.filter((order) => order.status === "shipped").length,
      cancelled: all.filter((order) => order.status === "cancelled").length,
    },
    monthly,
    products: [...productMap.values()].sort((a, b) => b.revenue - a.revenue),
  });
});

router.get("/:id/items", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, shop_id")
    .eq("id", String(req.params.id))
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", order.shop_id)
    .maybeSingle();

  const isBuyer = order.buyer_id === req.user.id;
  const isOwner = shop?.owner_id === req.user.id;
  if (!isBuyer && !isOwner) {
    return res.status(403).json({ error: "You cannot view this order." });
  }

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", String(req.params.id));

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ items: data ?? [] });
});

router.patch("/:id/status", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
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
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.status(400).json({ error: "Shop not found." });

  const { data: order } = await supabase
    .from("orders")
    .select("id, status, tracking_number")
    .eq("id", String(req.params.id))
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (!order) return res.status(404).json({ error: "Order not found." });

  const update: {
    status?: OrderStatus;
    tracking_number?: string | null;
  } = {};
  const hasStatus = typeof status === "string" && allowed.includes(status);
  if (hasStatus) update.status = status as OrderStatus;
  if (tracking !== undefined) update.tracking_number = tracking || null;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Nothing to update." });
  }

  const { error } = await supabase.from("orders").update(update).eq("id", order.id);

  if (error) return res.status(500).json({ error: error.message });

  const history: { order_id: string; status: OrderStatus; note?: string }[] = [];
  if (hasStatus && order.status !== (status as OrderStatus)) {
    history.push({ order_id: order.id, status: status as OrderStatus });
  }
  if (tracking !== undefined && tracking !== (order.tracking_number ?? "")) {
    history.push({
      order_id: order.id,
      status: order.status,
      note: tracking ? `Tracking number updated to ${tracking}` : "Tracking number removed",
    });
  }

  if (history.length > 0) {
    const { error: historyError } = await supabase
      .from("order_status_history")
      .insert(history);

    if (historyError) {
      return res.status(500).json({ error: "Status saved but tracking history could not be recorded." });
    }
  }

  clearCache();

  if (hasStatus && (status as OrderStatus) === "cancelled" && order.status !== "cancelled") {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", order.id);

    for (const item of items ?? []) {
      const { data: prod } = await supabase
        .from("products")
        .select("stock")
        .eq("id", item.product_id)
        .maybeSingle();
      await supabase
        .from("products")
        .update({ stock: Math.max(0, Number(prod?.stock ?? 0) + item.quantity) })
        .eq("id", item.product_id);
    }
  }

  return res.json({ ok: true });
});

router.get("/:id/tracking", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, tracking_number, created_at, buyer_id, shop_id")
    .eq("id", String(req.params.id))
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id, name, slug")
    .eq("id", order.shop_id)
    .maybeSingle();

  const isBuyer = order.buyer_id === req.user.id;
  const isOwner = shop?.owner_id === req.user.id;
  if (!isBuyer && !isOwner) {
    return res.status(403).json({ error: "You cannot track this order." });
  }

  const { data: history, error: historyError } = await supabase
    .from("order_status_history")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: true });

  if (historyError) return res.status(500).json({ error: historyError.message });

  return res.json({
    order: {
      id: order.id,
      status: order.status,
      tracking_number: order.tracking_number,
      created_at: order.created_at,
      shop: shop ? { name: shop.name, slug: shop.slug } : null,
    },
    history: history ?? [],
  });
});

router.patch("/:id/feedback", requireAuth, requireRole(["buyer", "seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { rating, feedback } = req.body ?? {};
  const ratingNum = rating === undefined || rating === null ? null : Math.round(Number(rating));
  const feedbackText = typeof feedback === "string" ? feedback.trim() : "";

  if (ratingNum !== null && (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5)) {
    return res.status(400).json({ error: "Rating must be a whole number between 1 and 5." });
  }
  if (!ratingNum && !feedbackText) {
    return res.status(400).json({ error: "Add a rating, a comment, or both." });
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", String(req.params.id))
    .eq("buyer_id", req.user.id)
    .maybeSingle();

  if (orderError || !order) {
    return res.status(403).json({ error: "You can only leave feedback on your own orders." });
  }

  if (order.status !== "delivered") {
    return res.status(400).json({ error: "You can leave feedback only after the order is delivered." });
  }

  const { error } = await supabase
    .from("orders")
    .update({
      rating: ratingNum,
      feedback: feedbackText || null,
      feedback_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.json({ ok: true });
});

router.post("/:id/return", requireAuth, requireRole(["buyer", "seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { reason, description } = req.body ?? {};
  const reasonText = typeof reason === "string" ? reason.trim() : "";
  const descriptionText = typeof description === "string" ? description.trim() : "";

  if (!reasonText) {
    return res.status(400).json({ error: "Please choose a reason for the return." });
  }
  if (/other/i.test(reasonText) && !descriptionText) {
    return res.status(400).json({ error: "Please describe the issue in a few words." });
  }

  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status, shop_id")
    .eq("id", String(req.params.id))
    .eq("buyer_id", req.user.id)
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Order not found." });
  }
  if (order.status !== "delivered") {
    return res.status(400).json({ error: "You can request a return only after the order is delivered." });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("return_policy")
    .eq("id", order.shop_id)
    .maybeSingle();

  if (!shop?.return_policy) {
    return res.status(400).json({ error: "This shop does not accept returns." });
  }

  const { data: existing } = await supabase
    .from("order_returns")
    .select("id")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existing) {
    return res.status(400).json({ error: "A return request already exists for this order." });
  }

  const { data: created, error } = await supabase
    .from("order_returns")
    .insert({
      order_id: order.id,
      buyer_id: req.user.id,
      reason: reasonText,
      description: descriptionText || null,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ return: created });
});

router.get("/:id/return", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_id, shop_id")
    .eq("id", String(req.params.id))
    .single();

  if (orderError || !order) {
    return res.status(404).json({ error: "Order not found." });
  }

  const { data: shop } = await supabase
    .from("shops")
    .select("owner_id")
    .eq("id", order.shop_id)
    .maybeSingle();

  const isBuyer = order.buyer_id === req.user.id;
  const isOwner = shop?.owner_id === req.user.id;
  if (!isBuyer && !isOwner) {
    return res.status(403).json({ error: "You cannot view returns for this order." });
  }

  const { data, error } = await supabase
    .from("order_returns")
    .select("*")
    .eq("order_id", order.id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ return: data ?? null });
});

router.patch("/:id/return", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { decision, note } = req.body ?? {};
  const status = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : null;
  if (!status) {
    return res.status(400).json({ error: "Decision must be approved or rejected." });
  }

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.status(400).json({ error: "Shop not found." });

  const { data: order } = await supabase
    .from("orders")
    .select("shop_id")
    .eq("id", String(req.params.id))
    .eq("shop_id", shop.id)
    .maybeSingle();

  if (!order) return res.status(404).json({ error: "Order not found." });

  const { data: existing } = await supabase
    .from("order_returns")
    .select("id, status")
    .eq("order_id", String(req.params.id))
    .maybeSingle();

  if (!existing) {
    return res.status(404).json({ error: "No return requested for this order." });
  }
  if (existing.status !== "requested") {
    return res.status(400).json({ error: "This return has already been decided." });
  }

  const noteText = typeof note === "string" ? note.trim() : "";
  const { error } = await supabase
    .from("order_returns")
    .update({
      status,
      decided_at: new Date().toISOString(),
      decision_note: noteText || null,
    })
    .eq("id", existing.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;