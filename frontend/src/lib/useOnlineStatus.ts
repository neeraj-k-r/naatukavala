"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the browser's network state. Starts from navigator.onLine and
 * follows the online/offline events so the UI can react the moment the
 * connection drops or returns.
 */
export function useOnlineStatus(): boolean {
  // Always start from `true`: this hook renders on the server too, where
  // navigator is undefined, so reading navigator.onLine for the initial
  // state makes the first client render differ from the server HTML
  // (React hydration error #418) whenever the browser is offline.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // Sync the real value immediately after mount, then follow changes.
    const sync = () => setOnline(navigator.onLine);
    sync();

    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online;
}
