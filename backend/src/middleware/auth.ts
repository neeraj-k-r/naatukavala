import type { Request, Response, NextFunction } from "express";
import { getSupabaseAdmin } from "../lib/supabase.js";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile: {
    id: string;
    full_name: string;
    role: string;
    phone: string | null;
    address: string | null;
  } | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing authorization header." });
  }

  const token = header.slice(7);
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .maybeSingle();

  req.user = {
    id: data.user.id,
    email: data.user.email ?? "",
    // Never trust user_metadata for authorization: it is client-writable at
    // signup. The profiles table (guarded by RLS + escalation trigger) is the
    // only source of truth for roles.
    role: profile?.role ?? "buyer",
    profile: profile ?? null,
  };

  next();
}

export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated." });
    }
    if (!roles.includes(req.user.profile?.role ?? req.user.role)) {
      return res.status(403).json({ error: "Insufficient permissions." });
    }
    next();
  };
}
