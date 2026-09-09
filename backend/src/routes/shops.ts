import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { cached, clearCache } from "../lib/cache.js";
import { slugify } from "../lib/utils.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router: Router = express.Router();

router.get("/marketplace", async (_req, res) => {
  const supabase = getSupabaseAdmin();
  const shops = await cached("shops:marketplace", async () => {
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  });

  return res.json({ shops });
});

router.get("/:slug", async (req, res) => {
  const supabase = getSupabaseAdmin();
  const slug = String(req.params.slug);

  const data = await cached(`shops:slug:${slug}`, async () => {
    const { data: shop, error } = await supabase
      .from("shops")
      .select("*")
      .eq("slug", slug)
      .eq("status", "approved")
      .maybeSingle();

    if (error) throw error;
    if (!shop) return null;

    const { data: products } = await supabase
      .from("products")
      .select("*")
      .eq("shop_id", shop.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    return { shop, products: products ?? [] };
  });

  if (!data) return res.status(404).json({ error: "Shop not found." });
  return res.json(data);
});

router.get("/owner/:ownerId", async (req, res) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("owner_id", req.params.ownerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ shop: data ?? null });
});

router.post("/", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, slug, tagline, delivery_charge } = req.body ?? {};
  if (!name || !slug) {
    return res.status(400).json({ error: "Name and shop URL are required." });
  }

  const parsedSlug = slugify(String(slug));
  if (!parsedSlug) return res.status(400).json({ error: "Invalid shop URL." });

  const charge = Number(delivery_charge ?? 0);
  if (!Number.isFinite(charge) || charge < 0) {
    return res.status(400).json({ error: "Please enter a valid delivery charge." });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("shops").insert({
    owner_id: req.user.id,
    name,
    slug: parsedSlug,
    tagline: tagline || null,
    delivery_charge: charge,
    status: "pending",
  });

  if (error) {
    return res.status(409).json({ error: "That shop URL is already taken. Try a different one." });
  }
  clearCache();
  return res.status(201).json({ ok: true });
});

router.put("/:id", requireAuth, requireRole(["seller", "admin", "superadmin"]), async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });

  const { name, tagline, description, delivery_charge, logo_url, banner_url } = req.body ?? {};
  const charge = Number(delivery_charge ?? 0);
  if (!Number.isFinite(charge) || charge < 0) {
    return res.status(400).json({ error: "Please enter a valid delivery charge." });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("shops")
    .update({
      name: name || undefined,
      tagline: tagline || null,
      description: description || null,
      delivery_charge: charge,
      logo_url: logo_url || null,
      banner_url: banner_url || null,
    })
    .eq("id", String(req.params.id))
    .eq("owner_id", req.user.id);

  if (error) return res.status(500).json({ error: error.message });
  clearCache();
  return res.json({ ok: true });
});

export default router;