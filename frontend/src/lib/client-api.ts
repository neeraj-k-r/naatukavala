"use client";

import { createClient } from "@/lib/supabase/client";
import { compressVideo } from "@/lib/compressVideo";

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

/** Mirrors the backend limits so users get an instant message instead of a round trip. */
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

export type UploadStage =
  | { phase: "compressing"; progress: number }
  | { phase: "uploading" };

/** Uploads an image or video to the backend, returning the public Cloudinary URL. */
export async function uploadFile(
  file: File,
  onStage?: (stage: UploadStage) => void,
): Promise<string> {
  const isVideo = file.type.startsWith("video/");
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;

  let target = file;
  if (target.size > maxBytes) {
    if (!isVideo) {
      throw new Error("Image must be 10 MB or smaller.");
    }

    // Oversized videos are shrunk in the browser rather than rejected —
    // most clips are large only because phones record at high bitrate.
    onStage?.({ phase: "compressing", progress: 0 });
    try {
      target = await compressVideo(file, (progress) =>
        onStage?.({ phase: "compressing", progress }),
      );
    } catch {
      throw new Error(
        "This video is over 50 MB and couldn't be compressed here. Please upload a shorter clip.",
      );
    }
    if (target.size > maxBytes) {
      throw new Error(
        "The video is still over 50 MB after compressing. Please upload a shorter clip.",
      );
    }
  }

  onStage?.({ phase: "uploading" });

  const token = await getAccessToken();
  if (!token) {
    throw new Error("Please log in before uploading files.");
  }

  const formData = new FormData();
  formData.append("file", target);
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

export interface CouponCartLine {
  product_id: string;
  quantity: number;
  variant_id?: string | null;
}

export interface CouponPreviewResult {
  valid: boolean;
  code: string;
  kind: string;
  message: string;
  discount_total: number;
}

/** Previews a coupon code against the cart without consuming anything. */
export async function validateCoupon(
  code: string,
  cart: CouponCartLine[],
): Promise<CouponPreviewResult> {
  const token = await getAccessToken();
  if (!token) throw new Error("Please log in to use coupons.");

  const res = await fetch(`${API_URL}/coupons/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ code, cart }),
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as Partial<CouponPreviewResult> & {
    error?: string;
  };
  if (!res.ok) throw new Error(json.error ?? "Could not check the code.");
  return {
    valid: json.valid ?? false,
    code: json.code ?? "",
    kind: json.kind ?? "",
    message: json.message ?? "",
    discount_total: json.discount_total ?? 0,
  };
}