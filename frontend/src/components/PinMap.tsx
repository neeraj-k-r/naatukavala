"use client";

import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

import { currentPosition } from "@/lib/geocode";

import "leaflet/dist/leaflet.css";

const FALLBACK_CENTER: [number, number] = [20.5937, 78.9629];

/** Big emoji pin — avoids the broken default marker image assets. */
const PIN_ICON = L.divIcon({
  className: "",
  html: `<div style="font-size:34px;line-height:1;transform:translateY(-4px)">📍</div>`,
  iconSize: [34, 38],
  iconAnchor: [17, 36],
});

function LocateOnMount({ onFound }: { onFound: (lat: number, lon: number) => void }) {
  const map = useMap();
  useEffect(() => {
    currentPosition()
      .then(({ latitude, longitude }) => {
        onFound(latitude, longitude);
        map.flyTo([latitude, longitude], 16);
      })
      .catch(() => {
        // No location access — user drops the pin manually.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
  return null;
}

function ClickToPin({ onPin }: { onPin: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onPin(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

/**
 * Tap-to-drop pin map. Centers on the device location when allowed,
 * otherwise starts zoomed out over India.
 */
export default function PinMap({
  onPin,
}: {
  onPin: (latitude: number, longitude: number) => void;
}) {
  const [pin, setPin] = useState<[number, number] | null>(null);

  const dropPin = (latitude: number, longitude: number) => {
    setPin([latitude, longitude]);
    onPin(latitude, longitude);
  };

  return (
    <MapContainer
      center={FALLBACK_CENTER}
      zoom={5}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocateOnMount onFound={dropPin} />
      <ClickToPin onPin={dropPin} />
      {pin && (
        <Marker
          position={pin}
          icon={PIN_ICON}
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const pos = marker.getLatLng();
              dropPin(pos.lat, pos.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
