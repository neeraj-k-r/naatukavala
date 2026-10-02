/**
 * Free OpenStreetMap reverse geocoding (no API key).
 * Returns a short delivery-style address — "house, street, area,
 * city, state, PIN" — instead of the raw display_name blob.
 */

export interface LatLon {
  latitude: number;
  longitude: number;
}

/** Browser location wrapped as a promise. */
export function currentPosition(timeoutMs = 10000): Promise<LatLon> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      reject,
      { enableHighAccuracy: true, timeout: timeoutMs },
    );
  });
}

/**
 * Builds "house, street, area, city, state, PIN" from reverse-geocode
 * parts, skipping the noise. Falls back to display_name, then coords.
 */
export function cleanAddress(
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

/** Coordinates → clean address string. Throws when offline/unreachable. */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
    { headers: { Accept: "application/json" } },
  );
  const body = (await res.json()) as {
    display_name?: string;
    address?: Record<string, string>;
  };
  return cleanAddress(body, latitude, longitude);
}
