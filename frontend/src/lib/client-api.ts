"use client";

import { createClient } from "@/lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/** Number of unseen price drops (peek only — does not mark them as seen). */
export async function getPriceDropCount(): Promise<number> {
  const token = await getAccessToken();
  if (!token) return 0;

  const res = await fetch(`${API_URL}/wishlist/drops`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    drops?: unknown;
  };
  if (!res.ok || !Array.isArray(json.drops)) return 0;
  return json.drops.length;
}

/** Uploads an image to the backend, returning the public Cloudinary URL. */
export async function uploadFile(file: File): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Please log in before uploading images.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", "products");

  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await res.json().catch(() => ({}))) as {
    url?: string;
    error?: string;
  };
  if (!res.ok || !json.url) {
    throw new Error(json.error ?? "Upload failed");
  }
  return json.url;
}