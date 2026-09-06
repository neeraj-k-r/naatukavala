"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import { uploadFile } from "@/lib/client-api";

export default function ShopImageUpload({
  name,
  label,
  hint,
  initialUrl = "",
  aspectClass = "aspect-video",
}: {
  name: string;
  label: string;
  hint?: string;
  initialUrl?: string;
  aspectClass?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      <input type="hidden" name={name} value={url} />

      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-50 ${aspectClass}`}
      >
        {url ? (
          <>
            <Image
              src={url}
              alt={label}
              fill
              sizes="384px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => setUrl("")}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-xs text-white hover:bg-red-600"
              aria-label="Remove image"
            >
              ✕
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-sm">Uploading…</span>
            ) : (
              <>
                <span className="text-2xl">＋</span>
                <span className="text-xs font-medium">Upload {label.toLowerCase().replace(/ image$/, "")}</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}