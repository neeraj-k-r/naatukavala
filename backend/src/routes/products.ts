import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

router.get("/marketplace", async (req, res) => {
  const { search, category, shopSlug, limit } = req.query as Record<string, string | undefined>;
  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("products")
    .select("*, shop:shops!inner(name, slug, delivery_charge)")
    .eq("is_active", true)
    .eq("shop.status", "approved");

  if (category) query = query.eq("category", category);
  if (shopSlug) query = query.eq("shop.slug", shopSlug);
  if (search && search.trim()) query = query.ilike("name", `%${search.trim()}%`);
  if (limit) query = query.limit(Number(limit));
  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ products: data ?? [] });
});

router.get("/categories", async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("category, shop:shops!inner(status)")
    .eq("is_active", true)
    .eq("shop.status", "approved")
    .not("category", "is", null);

  if (error) return res.status(500).json({ error: error.message });

  const categories = [...new Set(
    ((data ?? []) as { category: string | null }[])
      .map((row) => row.category)
      .filter(Boolean)
      .sort(),
  )] as string[];
  return res.json({ categories });
});

router.get("/owner", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.json({ products: [] });

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ products: data ?? [] });
});

router.get("/:id", async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("products")
    .select("*, shop:shops!inner(name, slug, delivery_charge)")
    .eq("id", String(req.params.id))
    .eq("shop.status", "approved")
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Product not found." });
  return res.json({ product: data });
});

router.post("/", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, price, stock, category, description, images } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Product name is required." });

  const parsedPrice = Number(price);
  const parsedStock = Number(stock ?? 0);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "Please enter a valid price." });
  }

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) {
    return res.status(400).json({ error: "Please create your shop before adding products." });
  }

  const { error } = await supabase.from("products").insert({
    shop_id: shop.id,
    name,
    price: parsedPrice,
    stock: parsedStock,
    category: category || null,
    description: description || null,
    images: Array.isArray(images) ? images : [],
    is_active: true,
  });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json({ ok: true });
});

router.put("/:id", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, price, stock, category, description, is_active, images } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Product name is required." });

  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ error: "Please enter a valid price." });
  }

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.status(400).json({ error: "Please create your shop before adding products." });

  const { error } = await supabase
    .from("products")
    .update({
      name,
      price: parsedPrice,
      stock: Number(stock ?? 0),
      category: category || null,
      description: description || null,
      is_active: is_active === undefined ? true : Boolean(is_active),
      images: Array.isArray(images) ? images : [],
    })
    .eq("id", String(req.params.id))
    .eq("shop_id", shop.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

router.delete("/:id", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const supabase = getSupabaseAdmin();
  const { data: shop } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id)
    .maybeSingle();

  if (!shop) return res.status(400).json({ error: "Shop not found." });

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", String(req.params.id))
    .eq("shop_id", shop.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;