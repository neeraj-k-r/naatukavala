"use client";

import Image from "next/image";
import { useActionState, useRef, useState, useTransition } from "react";

import { submitVerification } from "@/lib/actions";
import { uploadFile } from "@/lib/client-api";

import type { Shop } from "@/lib/types";

const statusLabels: Record<Shop["verification_status"], { label: string; className: string }> = {
  none: { label: "Not verified", className: "bg-slate-100 text-slate-600" },
  pending: { label: "Under review", className: "bg-amber-100 text-amber-800" },
  verified: { label: "Verified", className: "bg-sky-100 text-sky-800" },
  rejected: { label: "Rejected — resubmit", className: "bg-red-100 text-red-700" },
};

export default function VerificationUpload({ shop }: { shop: Shop }) {
  const [docUrl, setDocUrl] = useState(shop.verification_doc_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [state, action, pending] = useActionState(submitVerification, undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const info = statusLabels[shop.verification_status];
  const verified = shop.verification_status === "verified";

  async function handleFile(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadFile(file);
      setDocUrl(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <form action={action} className="max-w-xl rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Identity verification</h3>
          <p className="mt-1 text-xs text-slate-500">
            Upload a government photo ID (Aadhaar/PAN) to earn the{" "}
            <span className="font-semibold text-sky-700">Verified seller</span> badge on
            your storefront.
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${info.className}`}>
          {info.label}
        </span>
      </div>

      {verified && shop.verified_at && (
        <p className="mt-3 text-xs text-slate-500">
          Verified on {new Date(shop.verified_at).toLocaleDateString()}
        </p>
      )}

      {!verified && (
        <div className="mt-4">
          <input type="hidden" name="shop_id" value={shop.id} />
          <input type="hidden" name="doc_url" value={docUrl} />

          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Identity document
          </label>

          <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            {docUrl ? (
              <>
                <Image src={docUrl} alt="Identity document" fill sizes="384px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setDocUrl("")}
                  aria-label="Remove document"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-xs text-white hover:bg-red-600"
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
                    <span className="text-xs font-medium">Upload ID card</span>
                  </>
                )}
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleFile(file);
            }}
          />

          {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
          {state && "error" in state && state.error && (
            <p className="mt-2 text-sm text-red-600">{String(state.error)}</p>
          )}
          {state && "success" in state && (
            <p className="mt-2 text-sm text-emerald-700">
              Submitted for review. We&apos;ll approve it shortly.
            </p>
          )}

          {shop.verification_status === "rejected" && (
            <p className="mt-2 text-xs text-slate-400">
              Your last submission was rejected. Upload a clearer image and resubmit.
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !docUrl || uploading}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Submitting…" : shop.verification_status === "rejected" ? "Resubmit" : "Submit for review"}
          </button>
        </div>
      )}
    </form>
  );
}