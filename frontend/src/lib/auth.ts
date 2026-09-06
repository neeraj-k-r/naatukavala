import { cache } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";

export interface AuthUser {
  id: string;
  email: string;
  profile: Profile | null;
  role: UserRole | null;
}

/**
 * Reads the signed-in user together with their profile. Returns null when
 * there is no session. Memoized per-request via React cache().
 */
export const getUser = cache(async (): Promise<AuthUser | null> => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    profile,
    role: profile?.role ?? null,
  };
});

export function requireRole(roles: UserRole[]) {
  return cache(async (): Promise<AuthUser> => {
    const user = await getUser();
    if (!user) redirect("/login");
    if (!user.role || !roles.includes(user.role)) redirect("/");
    return user;
  });
}

export const requireAdmin = requireRole(["superadmin", "admin"]);
export const requireSeller = requireRole(["seller"]);
export const requireBuyer = requireRole(["buyer", "seller", "admin", "superadmin"]);
export const requireSuperadmin = requireRole(["superadmin"]);