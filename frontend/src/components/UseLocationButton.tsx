"use client";

import { useState } from "react";

/**
 * Builds "house, street, area, city, state, PIN" from reverse-geocode
 * parts, skipping the noise. Falls back to display_name, then coords.
 */
function cleanAddress(
  body: { display_name?: string; address?: Record<string, string> },
  latitude: number,
  longitude: number,
): string {
  const a = body.address ?? {};
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const parts = [
    street || a.amenity || a.building || null,
    a.suburb ?? a.neighbourhood ?? a.hamlet ?? a.locality ?? null,
    a.city ?? a.town ?? a.village ?? a.municipality ?? null,
    a.state ?? null,
    a.postcode ?? null,
  ].filter((part): part is string => Boolean(part));
  if (parts.length > 0) return [...new Set(parts)].join(", ");
  return body.display_name ?? `${latitude}, ${longitude}`;
}

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
      // zoom=18 asks for building-level precision; addressdetails lets us
      // build a short delivery-style address instead of the raw
      // display_name blob (which often names a nearby road, not you).
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } },
      );
      const body = (await res.json()) as {
        display_name?: string;
        address?: Record<string, string>;
      };
      onResolved(cleanAddress(body, latitude, longitude));
      setMessage("Location filled — please check and edit if needed.");
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
