"use client";

import { useActionState, useRef, useState } from "react";

import { requestPromotion } from "@/lib/actions";
import { uploadFile } from "@/lib/client-api";
import SubmitButton from "@/components/SubmitButton";
import { getEmbedUrl } from "@/lib/video";

import type { Product } from "@/lib/types";

export default function PromotionRequestForm({
  shopName,
  products,
}: {
  shopName: string;
  products: Product[];
}) {
  const [state, action] = useActionState(requestPromotion, undefined);
  // Once a request is sent we replace the form with a confirmation card.
  // Tracking the exact state object (rather than a boolean) keeps the form
  // visible while a follow-up submission is still in flight.
  const [dismissedState, setDismissedState] = useState<unknown>(null);
  const requestSent = Boolean(state?.success) && state !== dismissedState;
  const [videoUrl, setVideoUrl] = useState("");
  const [videoUploading, setVideoUploading] = useState(false);
  const [videoStage, setVideoStage] = useState<string | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const externalUrlRef = useRef<HTMLInputElement>(null);

  async function handleVideoUpload(file: File) {
    setVideoError(null);
    setVideoUploading(true);
    try {
      const url = await uploadFile(file, (stage) => {
        setVideoStage(
          stage.phase === "compressing"
            ? `Compressing… ${Math.round(stage.progress * 100)}%`
            : "Uploading…",
        );
      });
      setVideoUrl(url);
    } catch (err) {
      setVideoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setVideoUploading(false);
      setVideoStage(null);
    }
  }

  function handleExternalUrl() {
    const url = externalUrlRef.current?.value.trim();
    if (!url) return;
    const embedUrl = getEmbedUrl(url);
    if (!embedUrl) {
      setVideoError("Unsupported URL. Try YouTube, Vimeo, Instagram, or Facebook.");
      return;
    }
    setVideoUrl(embedUrl);
    setVideoError(null);
  }

  if (requestSent) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-white p-6 text-center shadow-sm dark:border-emerald-900 dark:bg-slate-900">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
            aria-hidden
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
        <h3 className="mt-4 text-lg font-extrabold text-slate-900 dark:text-slate-100">
          Request sent!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600 dark:text-slate-400">
          Your promotion request is with our team. We&apos;ll review it shortly —
          track its status under <strong>My requests</strong> below.
        </p>
        <button
          type="button"
          onClick={() => {
            setDismissedState(state);
            setVideoUrl("");
            setVideoError(null);
          }}
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full border border-emerald-600 px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <input type="hidden" name="video_url" value={videoUrl} />
      <h3 className="font-bold text-slate-900 dark:text-slate-100">Request a sponsored spot</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Approved promotions appear in the marketplace spotlight with a
        Sponsored badge, like Flipkart and Amazon ads.
      </p>

      {state?.error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </div>
      )}

      <div className="mt-4">
        <label
          htmlFor="target"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          What should we promote?
        </label>
        <select
          id="target"
          name="target"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          <option value="shop">My whole shop — {shopName}</option>
          {products
            .filter((product) => product.is_active)
            .map((product) => (
              <option key={product.id} value={product.id}>
                Product — {product.name}
              </option>
            ))}
        </select>
      </div>

      <div className="mt-4">
        <label
          htmlFor="note"
          className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
        >
          Note for the review team{" "}
          <span className="text-slate-400 dark:text-slate-500">(optional)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={3}
          maxLength={300}
          placeholder="e.g. Festival offer on this product this month"
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Promotion video (optional)
        </label>

        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              ref={externalUrlRef}
              type="url"
              placeholder="Paste Instagram, Facebook, YouTube, Vimeo link…"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            />
            <button
              type="button"
              onClick={handleExternalUrl}
              disabled={videoUploading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              Add
            </button>
          </div>

          <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
            {videoUrl ? (
              <>
                {getEmbedUrl(videoUrl) ? (
                  <iframe
                    src={getEmbedUrl(videoUrl)!}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video src={videoUrl} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setVideoUrl("")}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-xs text-white hover:bg-red-600"
                  aria-label="Remove video"
                >
                  ✕
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                disabled={videoUploading}
                className="flex h-full w-full flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:text-emerald-600 disabled:opacity-50 dark:text-slate-500 dark:hover:text-emerald-400"
              >
                {videoUploading ? (
                  <span className="text-sm">{videoStage ?? "Uploading…"}</span>
                ) : (
                  <>
                    <span className="text-2xl">＋</span>
                    <span className="text-xs font-medium">Upload video (MP4, WebM)</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleVideoUpload(file);
            }}
          />
        </div>

        {videoError && <p className="mt-2 text-sm text-red-600">{videoError}</p>}
        {!videoError && !videoUrl && (
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Upload a video file, or paste a link from YouTube, Vimeo, Instagram, or Facebook.
          </p>
        )}
      </div>

      <SubmitButton
        pendingText="Sending request…"
        className="mt-4 bg-emerald-600 text-white hover:bg-emerald-700"
      >
        Request promotion
      </SubmitButton>
    </form>
  );
}
