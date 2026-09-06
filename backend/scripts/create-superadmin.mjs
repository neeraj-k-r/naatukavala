#!/usr/bin/env node
/**
 * Seeds the Naatukavala superadmin account (naatukavala.admin@gmail.com).
 *
 * Usage:
 *   npm run seed:superadmin
 *
 * Reads credentials from .env.local. Requires SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, value] = match;
    if (!(key in process.env)) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvFile(join(__dirname, "../.env"));
loadEnvFile(".env.local");

const email = process.env.SUPERADMIN_EMAIL || "naatukavala.admin@gmail.com";
const password = process.env.SUPERADMIN_PASSWORD;
const name = process.env.SUPERADMIN_NAME || "Naattukavala Admin";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPERBASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!password || password === "set-a-strong-password") {
  console.error("Set SUPERADMIN_PASSWORD in .env.local first.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const existing = users.find((u) => u.email?.toLowerCase() === email.toLowerCase());

  let userId;
  if (existing) {
    console.log(`Found existing user: ${email} (${existing.id})`);
    if (existing.user_metadata?.role !== "superadmin") {
      const { error } = await supabase.auth.admin.updateUserById(existing.id, {
        user_metadata: { role: "superadmin", full_name: name },
      });
      if (error) throw error;
      console.log("Updated user metadata role -> superadmin");
    }
    userId = existing.id;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "superadmin", full_name: name },
    });
    if (error) throw error;
    console.log(`Created user: ${email}`);
    userId = data.user.id;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert({ id: userId, full_name: name, role: "superadmin" }, { onConflict: "id" });

  if (profileError) throw profileError;

  console.log(`Superadmin ready: ${email}`);
  console.log("Sign in at /login with this email and the configured password.");
}

main().catch((error) => {
  console.error("Seed failed:", error.message ?? error);
  process.exit(1);
});