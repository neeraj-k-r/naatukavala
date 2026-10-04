"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import ImageEditor from "@/components/ImageEditor";
import { uploadFile } from "@/lib/client-api";
import { prepareUploadFile } from "@/lib/prepareImage";

export default function ProductImageUpload({
  initialImages = [],
}: {
  initialImages?: string[];
}) {
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ url: string; name: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queueRef = useRef<File[]>([]);

  async function uploadOne(file: File) {
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setImages((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  /** GIFs skip the editor (cropping would kill animation). */
  function editNext(files: File[]) {
    const [first, ...rest] = files;
    queueRef.current = rest;
    if (!first) return;
    if (first.type === "image/gif") {
      void uploadOne(first).then(() => editNext(rest));
    } else {
      setEditing({ url: URL.createObjectURL(first), name: first.name });
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    // iPhone photos arrive as HEIC — convert to JPEG first so the
    // crop editor and upload can actually read them.
    setConverting(true);
    try {
      editNext(await Promise.all(Array.from(files).map(prepareUploadFile)));
    } catch {
      setError("Could not read that photo. Try a JPEG or PNG instead.");
    } finally {
      setConverting(false);
    }
  }

  function closeEditor() {
    if (editing) URL.revokeObjectURL(editing.url);
    setEditing(null);
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        Product images
      </label>

      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <div className="flex flex-wrap gap-3">
        {images.map((url) => (
          <div
            key={url}
            className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700"
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
          disabled={uploading || converting}
            className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50 dark:border-slate-600 dark:text-slate-500 dark:hover:text-emerald-400"
        >
          {uploading || converting ? (
            <span className="text-xs">{converting ? "Reading…" : "Uploading…"}</span>
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
          accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
        Upload to Cloudinary · JPEG, PNG, WEBP or GIF, up to 5MB each.
        Photos can be cropped and rotated before upload.
      </p>

      {editing && (
        <ImageEditor
          src={editing.url}
          fileName={editing.name}
          onCancel={() => {
            const rest = queueRef.current;
            queueRef.current = [];
            closeEditor();
            editNext(rest);
          }}
          onDone={(file) => {
            const rest = queueRef.current;
            queueRef.current = [];
            closeEditor();
            void uploadOne(file).then(() => editNext(rest));
          }}
        />
      )}
    </div>
  );
}