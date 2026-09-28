import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { evaluateCoupon } from "../lib/coupons.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

const BUYER_ROLES = ["buyer", "seller", "admin", "superadmin"];

/**
 * Preview a code against the buyer's cart without consuming anything.
 * Returns exact per-shop discounts so checkout shows honest numbers.
 */
router.post(
  "/validate",
  requireAuth,
  requireRole(BUYER_ROLES),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });

    const code = String(req.body?.code ?? "");
    const cart: { product_id?: unknown; quantity?: unknown }[] = Array.isArray(
      req.body?.cart,
    )
      ? req.body.cart
      : [];
    if (!code.trim() || cart.length === 0) {
      return res.json({ valid: false, message: "Enter a code with items in your cart." });
    }

    const supabase = getSupabaseAdmin();
    const ids = [
      ...new Set(
        cart.map((line) => String(line?.product_id ?? "")).filter(Boolean),
      ),
    ];
    const { data: products } = await supabase
      .from("products")
      .select("id, price, shop_id")
      .in("id", ids);
    const productById = new Map(((products ?? []) as { id: string; price: number; shop_id: string }[]).map((p) => [p.id, p]));

    const subtotalByShop = new Map<string, number>();
    for (const line of cart) {
      const product = productById.get(String(line?.product_id ?? ""));
      if (!product) continue;
      const qty = Math.max(1, Math.floor(Number(line?.quantity ?? 1)));
      subtotalByShop.set(
        product.shop_id,
        Math.round(((subtotalByShop.get(product.shop_id) ?? 0) + Number(product.price) * qty) * 100) / 100,
      );
    }
    if (subtotalByShop.size === 0) {
      return res.json({ valid: false, message: "Your cart is empty." });
    }

    const shopIds = [...subtotalByShop.keys()];
    const { data: shopRows } = await supabase
      .from("shops")
      .select("id, name")
      .in("id", shopIds);
    const nameById = new Map(
      ((shopRows ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]),
    );

    const priced = shopIds.map((shop_id) => ({
      shop_id,
      shop_name: nameById.get(shop_id) ?? "Shop",
      subtotal: subtotalByShop.get(shop_id) ?? 0,
    }));

    const decision = await evaluateCoupon(req.user.id, code, priced);
    if (!decision.ok || !decision.coupon) {
      return res.json({ valid: false, message: decision.message });
    }

    const discountByShop = new Map(
      decision.lines.map((line) => [line.shop_id, line.discount]),
    );
    return res.json({
      valid: true,
      code: decision.coupon.code,
      kind: decision.coupon.kind,
      message: decision.message,
      discount_total: decision.discount_total,
      lines: priced.map((line) => ({
        ...line,
        discount: discountByShop.get(line.shop_id) ?? 0,
        total:
          Math.round((line.subtotal - (discountByShop.get(line.shop_id) ?? 0)) * 100) / 100,
      })),
    });
  },
);

/** Admin: list every coupon, newest first. */
router.get(
  "/",
  requireAuth,
  requireRole(["admin", "superadmin"]),
  async (_req, res) => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.json({ coupons: [] });
    return res.json({ coupons: data ?? [] });
  },
);

/** Admin: create a coupon code. */
router.post(
  "/",
  requireAuth,
  requireRole(["admin", "superadmin"]),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });

    const code = String(req.body?.code ?? "").trim().toUpperCase();
    const kind = String(req.body?.kind ?? "");
    const value = Number(req.body?.value);
    const minOrder = Number(req.body?.min_order_value ?? 0);
    const maxDiscountRaw = req.body?.max_discount;
    const maxUsesRaw = req.body?.max_uses;
    const perUserRaw = req.body?.per_user_limit ?? 1;
    const startsRaw = req.body?.starts_at;
    const endsRaw = req.body?.ends_at;

    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return res.status(400).json({ error: "Code must be 3-20 letters or digits." });
    }
    if (kind !== "flat" && kind !== "percent") {
      return res.status(400).json({ error: "Kind must be flat or percent." });
    }
    if (!Number.isFinite(value) || value <= 0) {
      return res.status(400).json({ error: "Value must be above zero." });
    }
    if (kind === "percent" && value > 100) {
      return res.status(400).json({ error: "Percent cannot exceed 100." });
    }
    if (!Number.isFinite(minOrder) || minOrder < 0) {
      return res.status(400).json({ error: "Minimum order must be zero or more." });
    }
    const maxDiscount =
      maxDiscountRaw === undefined || maxDiscountRaw === null || maxDiscountRaw === ""
        ? null
        : Number(maxDiscountRaw);
    if (maxDiscount !== null && (!Number.isFinite(maxDiscount) || maxDiscount <= 0)) {
      return res.status(400).json({ error: "Max discount must be above zero." });
    }
    const maxUses =
      maxUsesRaw === undefined || maxUsesRaw === null || maxUsesRaw === ""
        ? null
        : Math.floor(Number(maxUsesRaw));
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
      return res.status(400).json({ error: "Max uses must be a whole number above zero." });
    }
    const perUser = Math.floor(Number(perUserRaw));
    if (!Number.isInteger(perUser) || perUser <= 0) {
      return res.status(400).json({ error: "Per-user limit must be a whole number above zero." });
    }
    const startsAt = startsRaw ? new Date(String(startsRaw)) : null;
    const endsAt = endsRaw ? new Date(String(endsRaw)) : null;
    if ((startsRaw && Number.isNaN(startsAt?.getTime())) || (endsRaw && Number.isNaN(endsAt?.getTime()))) {
      return res.status(400).json({ error: "Invalid start or end date." });
    }
    if (startsAt && endsAt && endsAt <= startsAt) {
      return res.status(400).json({ error: "End date must be after start date." });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code,
        kind,
        value,
        min_order_value: minOrder,
        max_discount: maxDiscount,
        max_uses: maxUses,
        per_user_limit: perUser,
        starts_at: startsAt ? startsAt.toISOString() : null,
        ends_at: endsAt ? endsAt.toISOString() : null,
        is_active: true,
        created_by: req.user.id,
      })
      .select("id")
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ error: "That code already exists." });
      }
      return res.status(500).json({ error: "Could not create the coupon. Run the coupons migration first." });
    }
    return res.status(201).json({ ok: true, id: data.id });
  },
);

/** Admin: activate or pause a coupon. Values stay frozen for clean accounting. */
router.patch(
  "/:id",
  requireAuth,
  requireRole(["admin", "superadmin"]),
  async (req, res) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated." });

    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: Boolean(req.body?.is_active) })
      .eq("id", String(req.params.id));

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  },
);

export default router;
