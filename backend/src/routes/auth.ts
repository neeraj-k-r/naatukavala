import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router: Router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Tiny in-memory rate limiter: slows credential stuffing/brute force on the
// public auth endpoints without adding a dependency. Resets per window.
const attempts = new Map<string, { count: number; resetAt: number }>();
const AUTH_LIMIT = 20;
const AUTH_WINDOW_MS = 10 * 60 * 1000;

function authRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > AUTH_LIMIT;
}

router.post("/signup", async (req, res) => {
  if (authRateLimited(req.ip ?? "unknown")) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }

  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const full_name = String(req.body?.full_name ?? "").trim();
  const { role } = req.body ?? {};

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
  }
  if (String(password).length > 72) {
    return res.status(400).json({ error: "Password must be under 72 characters." });
  }
  if (full_name.length > 100) {
    return res.status(400).json({ error: "Name must be under 100 characters." });
  }
  if (role !== "buyer" && role !== "seller") {
    return res.status(400).json({ error: "Invalid account type." });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role, full_name },
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? "Signup failed. Please try again." });
  }

  return res.status(201).json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
});

router.post("/login", async (req, res) => {
  if (authRateLimited(req.ip ?? "unknown")) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }

  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  const supabase = getSupabaseAdmin();

  if (!EMAIL_RE.test(email) || email.length > 254 || !password) {
    // Generic message — never reveal whether the email exists.
    return res.status(401).json({
      error: "Invalid email or password, or the account was not confirmed yet.",
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(401).json({
      error: error?.message?.toLowerCase().includes("rate")
        ? error.message
        : "Invalid email or password, or the account was not confirmed yet.",
    });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  return res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role ?? data.user.user_metadata?.role ?? "buyer",
    },
  });
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: req.user });
});

/**
 * Self-deletion: removes the signed-in user's own account after verifying
 * their password. Sellers whose shops have order history are stopped with
 * guidance (orders reference shops with ON DELETE RESTRICT); everything
 * else cascades away in the database.
 */
router.delete("/me", requireAuth, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated." });
  if (authRateLimited(req.ip ?? "unknown")) {
    return res.status(429).json({ error: "Too many attempts. Please try again later." });
  }

  const password = String(req.body?.password ?? "");
  if (!password) {
    return res.status(400).json({ error: "Please enter your password." });
  }

  const supabase = getSupabaseAdmin();

  const { error: passwordError } = await supabase.auth.signInWithPassword({
    email: req.user.email,
    password,
  });
  if (passwordError) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  const { data: ownedShops } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", req.user.id);
  const ownedShopIds = (ownedShops ?? []).map((shop) => shop.id);
  if (ownedShopIds.length > 0) {
    const { count: orderCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("shop_id", ownedShopIds);
    if ((orderCount ?? 0) > 0) {
      return res.status(409).json({
        error:
          "Your shop has order history, so your account cannot be deleted. Contact support to close your shop instead.",
      });
    }
  }

  const { error } = await supabase.auth.admin.deleteUser(req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ ok: true });
});

export default router;