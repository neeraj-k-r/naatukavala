"use client";

import { useState } from "react";

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
    if (!("geolocation" in navigator)) {
      setStatus("error");
      setMessage("Your browser does not support location access.");
      return;
    }
    setStatus("locating");
    setMessage(null);

    let position: GeolocationPosition;
    try {
      position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        }),
      );
    } catch {
      setStatus("error");
      setMessage("Could not get your location. Please allow location access.");
      return;
    }

    const { latitude, longitude } = position.coords;
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
        { headers: { Accept: "application/json" } },
      );
      const body = (await res.json()) as { display_name?: string };
      onResolved(body.display_name ?? `${latitude}, ${longitude}`);
    } catch {
      onResolved(`${latitude}, ${longitude}`);
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
        <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message}</p>
      )}
    </div>
  );
}
