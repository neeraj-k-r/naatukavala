"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";

import { submitFeedback } from "@/lib/actions";
import { uploadFile } from "@/lib/client-api";

const MAX_PHOTOS = 4;

export default function FeedbackForm({
  orderId,
  initialRating,
  initialFeedback,
  initialImages = [],
}: {
  orderId: string;
  initialRating: number | null;
  initialFeedback: string | null;
  initialImages?: string[];
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [images, setImages] = useState<string[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    for (const file of Array.from(files).slice(0, MAX_PHOTOS - images.length)) {
      setUploading(true);
      try {
        const url = await uploadFile(file);
        setImages((prev) =>
          prev.length >= MAX_PHOTOS ? prev : [...prev, url],
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const formData = new FormData(event.currentTarget);
    startTransition(() => {
      void submitFeedback(undefined, formData).then((result) => {
        if (result && "error" in result && typeof result.error === "string") {
          setError(result.error);
        }
      });
    });
  }

  const hasFeedback = Boolean(initialRating || initialFeedback);

  return (
    <form
      onSubmit={onSubmit}
      className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
    >
      <p className="text-sm font-semibold text-slate-800">
        {hasFeedback ? "Your feedback" : "Leave feedback for this order"}
      </p>

      <div className="mt-2 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={pending}
            onClick={() => setRating(value)}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            className={`text-2xl leading-none transition-colors disabled:opacity-60 ${
              value <= rating ? "text-amber-400" : "text-slate-300"
            }`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-xs font-medium text-slate-500">
            {rating}/5
          </span>
        )}
        <input type="hidden" name="rating" value={rating} readOnly />
      </div>

      <textarea
        name="feedback"
        rows={3}
        defaultValue={initialFeedback ?? ""}
        disabled={pending}
        placeholder="How was your order? Share what you liked or how it could be better…"
        className="mt-3 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-emerald-500 disabled:opacity-60"
      />

      {images.map((url) => (
        <input key={url} type="hidden" name="images" value={url} />
      ))}

      <div className="mt-3">
        <p className="mb-1.5 text-xs font-medium text-slate-500">
          Photos <span className="text-slate-400">(optional, up to 4)</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div
              key={url}
              className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
            >
              <Image
                src={url}
                alt="Review photo"
                fill
                sizes="64px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setImages((prev) => prev.filter((image) => image !== url))
                }
                className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900/70 text-[10px] text-white hover:bg-red-600"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {images.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading || pending}
              className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-slate-300 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-[10px]">Uploading…</span>
              ) : (
                <>
                  <span className="text-lg leading-none">＋</span>
                  <span className="text-[10px] font-medium">Photo</span>
                </>
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={(event) => void handleFiles(event.target.files)}
          />
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : hasFeedback
              ? "Update feedback"
              : "Submit feedback"}
        </button>
      </div>

      <input type="hidden" name="order_id" value={orderId} />
    </form>
  );
}