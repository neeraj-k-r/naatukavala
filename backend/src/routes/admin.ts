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