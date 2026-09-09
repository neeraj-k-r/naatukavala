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
      return res.status(500).json({ error: "Could not save your order items. Please try again." });
    }
  }

  return res.status(201).json({ ok: true });
});

router.get("/buyer", requireAuth, requireRole(["buyer", "seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .select("*, shop:shops(name, slug)")
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
    .select("*, shop:shops(name, slug)")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ orders: data ?? [] });
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

export default router;