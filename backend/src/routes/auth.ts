import type { Router } from "express";
import express from "express";

import { getSupabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middleware/auth.js";

const router: Router = express.Router();

router.post("/signup", async (req, res) => {
  const { email, password, full_name, role } = req.body ?? {};

  if (!email || !password || !full_name) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long." });
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
  const { email, password } = req.body ?? {};
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: String(email ?? "").trim(),
    password: String(password ?? ""),
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

export default router;