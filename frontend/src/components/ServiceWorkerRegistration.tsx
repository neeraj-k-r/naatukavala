"use client";

import { useEffect } from "react";

/**
 * Registers the service worker that powers offline support. Runs once on
 * mount, only in production (a service worker in dev would cache stale
 * modules and fight hot reload).
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  }, []);

  return null;
}
