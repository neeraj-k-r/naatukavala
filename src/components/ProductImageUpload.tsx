"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export default function ProductImageUpload({
  initialImages = [],
}: {
  initialImages?: string[];
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    for (const file of Array.from(files)) {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "products");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        setImages((prev) => [...prev, json.url]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        Product images
      </label>

      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div
            key={url}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200"
          >
            <Image src={url} alt="Upload preview" fill sizes="96px" className="object-cover" />
            <button
              type="button"
              onClick={() => setImages((prev) => prev.filter((image) => image !== url))}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-xs text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              ✕
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50"
        >
          {uploading ? (
            <span className="text-xs">Uploading…</span>
          ) : (
            <>
              <span className="text-2xl">＋</span>
              <span className="text-xs font-medium">Add photo</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400">
        Upload to Cloudinary · JPEG, PNG, WEBP or GIF, up to 5MB each.
      </p>
    </div>
  );
}