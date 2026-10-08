"use client";

import { useEffect, useRef, useState } from "react";

import PromotionDecision from "@/components/PromotionDecision";
import { formatDate } from "@/lib/utils";
import { getEmbedUrl } from "@/lib/video";

import type { Promotion } from "@/lib/types";

const statusStyles: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  expired: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  removed: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
};

const reasonLabels: Record<string, string> = {
  rejected: "Rejection reason",
  removed: "Removal reason",
  approved: "Decision note",
  expired: "Decision note",
};

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function daysBetween(start: string | null, end: string | null): string {
  if (!start || !end) return "—";
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000);
  return days >= 1 ? `${days} day${days === 1 ? "" : "s"}` : "Same day";
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/70">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

export default function AdminPromotionCard({ promotion }: { promotion: Promotion }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  const target = promotion.product_id
    ? (promotion.product_name ?? "Product")
    : "Whole shop";
  const embedUrl = promotion.video_url ? getEmbedUrl(promotion.video_url) : null;

  return (
    <>
      <div
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-800"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
              {target}
              <span className="font-normal text-slate-500 dark:text-slate-400">
                {" "}
                · {promotion.shop_name ?? "unknown shop"}
                {promotion.shop_slug ? ` (${promotion.shop_slug})` : ""}
              </span>
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Requested {formatDate(promotion.created_at)}
              {promotion.status === "approved" && promotion.ends_at && (
                <> · runs till {formatDate(promotion.ends_at)}</>
              )}
            </p>
            {promotion.note && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Seller note: “{promotion.note}”
              </p>
            )}
            {promotion.decision_note && (
              <p
                className={`mt-1 text-xs ${
                  promotion.status === "removed"
                    ? "font-semibold text-rose-600 dark:text-rose-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {reasonLabels[promotion.status] ?? "Decision note"}: “{promotion.decision_note}”
              </p>
            )}
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[promotion.status] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
          >
            {promotion.status}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            Click to view the full request
          </span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(true);
            }}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            View details
          </button>
        </div>

        {(promotion.status === "requested" || promotion.status === "approved") && (
          <PromotionDecision promotionId={promotion.id} status={promotion.status} />
        )}
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 text-left shadow-xl backdrop:bg-slate-900/60 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="max-h-[85vh] overflow-y-auto p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Promotion request
              </p>
              <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-slate-100">
                {target}
              </h3>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {promotion.shop_name ?? "unknown shop"}
                {promotion.shop_slug ? ` (${promotion.shop_slug})` : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold capitalize ${statusStyles[promotion.status] ?? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
            >
              {promotion.status}
            </span>
          </div>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <DetailRow label="Requested" value={formatDateTime(promotion.created_at)} />
            <DetailRow
              label="Decided"
              value={promotion.decided_at ? formatDateTime(promotion.decided_at) : "Not decided yet"}
            />
            <DetailRow
              label="Runs"
              value={
                promotion.starts_at
                  ? `${formatDate(promotion.starts_at)} → ${promotion.ends_at ? formatDate(promotion.ends_at) : "—"}`
                  : "Not scheduled"
              }
            />
            <DetailRow label="Duration" value={daysBetween(promotion.starts_at, promotion.ends_at)} />
          </dl>

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Seller&apos;s note
            </p>
            <p className="mt-1.5 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300">
              {promotion.note ? promotion.note : "No note provided."}
            </p>
          </div>

          {promotion.decision_note && (
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                {reasonLabels[promotion.status] ?? "Decision note"}
              </p>
              <p
                className={`mt-1.5 rounded-xl border px-4 py-3 text-sm ${
                  promotion.status === "removed"
                    ? "border-rose-200 bg-rose-50 font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
                    : promotion.status === "rejected"
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                      : "border-slate-100 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-300"
                }`}
              >
                {promotion.decision_note}
              </p>
            </div>
          )}

          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Promotion video
            </p>
            {promotion.video_url ? (
              <>
                <div className="mt-1.5 aspect-video w-full overflow-hidden rounded-xl border border-slate-200 bg-black dark:border-slate-700">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={promotion.video_url}
                      controls
                      playsInline
                      className="h-full w-full object-contain"
                    />
                  )}
                </div>
                {!embedUrl && (
                  <p className="mt-1 break-all text-xs text-slate-400 dark:text-slate-500">
                    {promotion.video_url}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1.5 text-sm text-slate-400 dark:text-slate-500">
                No video attached to this request.
              </p>
            )}
          </div>

          <p className="mt-5 text-[11px] text-slate-400 dark:text-slate-500">
            Request ID: <span className="font-mono">{promotion.id}</span>
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </dialog>
    </>
  );
}
