import { NextResponse } from "next/server";

import { uploadImageBuffer } from "@/lib/cloudinary";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const folder = formData.get("folder") === "shops" ? "shops" : "products";

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WEBP and GIF images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be smaller than 5MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const url = await uploadImageBuffer(buffer, folder);
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Cloudinary upload failed", error);
    return NextResponse.json(
      { error: "Upload failed, please try again" },
      { status: 500 },
    );
  }
}