import { v2 as cloudinary } from "cloudinary";

const configured = (() => {
  if (
    typeof window === "undefined" &&
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  ) {
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return true;
  }
  return false;
})();

export function isCloudinaryConfigured(): boolean {
  return configured;
}

/**
 * Uploads an image buffer to Cloudinary and returns the public secure URL.
 * Server-only.
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  folder: "shops" | "products",
): Promise<string> {
  if (!configured) {
    throw new Error("Cloudinary is not configured on the server.");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `naatukavala/${folder}`,
        resource_type: "image",
        transformation: { width: 1200, crop: "limit", quality: "auto" },
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          reject(error ?? new Error("Cloudinary upload failed"));
        } else {
          resolve(result.secure_url);
        }
      },
    );
    stream.end(buffer);
  });
}

/** Deletes an asset from Cloudinary by its secure URL. Server-only. */
export async function deleteImageByUrl(secureUrl: string): Promise<void> {
  if (!configured) return;
  const match = secureUrl.match(/\/(?:v\d+\/)?([^/]+)\.[a-zA-Z0-9]+$/);
  if (!match) return;
  const publicId = `naatukavala/${decodeURIComponent(match[1])}`;
  await cloudinary.uploader.destroy(publicId);
}