"use client";

import OfflinePage from "@/components/OfflinePage";
import { useOnlineStatus } from "@/lib/useOnlineStatus";

/**
 * Wraps the whole app: swaps every screen for the offline page the moment
 * the browser loses its connection, and restores the app when it returns.
 */
export default function OfflineGate({ children }: { children: React.ReactNode }) {
  const online = useOnlineStatus();

  if (!online) return <OfflinePage />;

  return (
    <>
      {/* Fetch the offline illustration while there is still a connection so
          the browser has it cached when the network drops. */}
      <img
        src="/naatukavaladisc.webp"
        alt=""
        aria-hidden
        className="pointer-events-none absolute h-px w-px opacity-0"
      />
      {children}
    </>
  );
}
