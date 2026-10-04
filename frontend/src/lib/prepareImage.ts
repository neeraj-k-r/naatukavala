/**
 * Phone photos (mostly iPhones) arrive as HEIC/HEIF, which browsers can't
 * render in <img>/canvas and our picker used to filter out. Convert those
 * to JPEG before the crop editor / upload so "select photo" just works.
 */

const HEIC_MIME = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

const HEIC_EXT = /\.(heic|heif)$/i;

export function needsHeicConversion(file: File): boolean {
  // iOS Safari sometimes reports an empty MIME type for HEIC files.
  if (!file.type) return HEIC_EXT.test(file.name);
  return HEIC_MIME.has(file.type.toLowerCase());
}

/** Returns a JPEG File for HEIC/HEIF input, otherwise the file unchanged. */
export async function prepareUploadFile(file: File): Promise<File> {
  if (!needsHeicConversion(file)) return file;
  // Lazy-loaded: only phone users taking HEIC photos pay for this chunk.
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}
