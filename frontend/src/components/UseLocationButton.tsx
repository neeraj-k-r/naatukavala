"use client";

import { useState } from "react";

import { currentPosition, reverseGeocode } from "@/lib/geocode";

/**
 * Fills the address field from the device's current location.
 * Uses the browser geolocation API plus free OpenStreetMap reverse
 * geocoding (no API key) — falls back to raw coordinates offline.
 */
export default function UseLocationButton({
  onResolved,
}: {
  onResolved: (address: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "locating" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("locating");
    setMessage(null);

    let coords;
    try {
      coords = await currentPosition();
    } catch {
      setStatus("error");
      setMessage(
        "geolocation" in navigator
          ? "Could not get your location. Please allow location access."
          : "Your browser does not support location access.",
      );
      return;
    }

    try {
      onResolved(await reverseGeocode(coords.latitude, coords.longitude));
      setMessage("Location filled — please check and edit if needed.");
    } catch {
      onResolved(`${coords.latitude}, ${coords.longitude}`);
    }
    setStatus("idle");
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={status === "locating"}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60 dark:text-emerald-400 dark:hover:bg-slate-800"
      >
        <span aria-hidden>📍</span>
        {status === "locating" ? "Locating…" : "Use my current location"}
      </button>
      {message && (
        <p
          className={`mt-1 text-xs ${
            status === "error"
              ? "text-red-600 dark:text-red-400"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
