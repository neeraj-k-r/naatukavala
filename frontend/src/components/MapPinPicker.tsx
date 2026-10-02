"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import { reverseGeocode } from "@/lib/geocode";

const PinMap = dynamic(() => import("./PinMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-500">
      Loading map…
    </div>
  ),
});

/**
 * "Choose on map" pin picker: the buyer taps the map (or drags the
 * pin), confirms, and the address field fills from the pinned spot.
 */
export default function MapPinPicker({
  onResolved,
}: {
  onResolved: (address: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState<{ latitude: number; longitude: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [open]);

  function openPicker() {
    setPin(null);
    setError(null);
    setOpen(true);
  }

  async function confirmPin() {
    if (!pin) return;
    setConfirming(true);
    setError(null);
    try {
      onResolved(await reverseGeocode(pin.latitude, pin.longitude));
      setOpen(false);
    } catch {
      setError("Could not read that spot. Check your connection and try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <span aria-hidden>🗺️</span>
        Choose on map
      </button>

      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-slate-900/50 dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between p-4 pb-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Drop a pin
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tap the map or drag the pin to your doorstep, then confirm.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close map"
            className="rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ✕
          </button>
        </div>

        <div className="h-[55vh] w-full px-4">
          {open && (
            <div className="h-full w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <PinMap
                onPin={(latitude, longitude) => setPin({ latitude, longitude })}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="px-4 pt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center justify-between gap-2 p-4">
          <p className="min-w-0 truncate text-xs text-slate-400 dark:text-slate-500">
            {pin
              ? `${pin.latitude.toFixed(5)}, ${pin.longitude.toFixed(5)}`
              : "No pin dropped yet"}
          </p>
          <button
            type="button"
            onClick={confirmPin}
            disabled={!pin || confirming}
            className="shrink-0 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {confirming ? "Reading spot…" : "Confirm pin"}
          </button>
        </div>
      </dialog>
    </>
  );
}
