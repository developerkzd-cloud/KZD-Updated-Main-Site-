"use client";

/* ==========================================================================
   OfflineGate — mounted once in the root layout.

   1. Shows OfflineScreen over the page whenever the browser reports it has
      lost its connection, and removes it again the moment the connection
      returns, so the visitor carries on exactly where they were.
   2. Registers /sw.js (production only), which serves the cached /offline
      page when a page is opened or reloaded with no connection at all.
   ========================================================================== */

import { useEffect, useSyncExternalStore } from "react";
import OfflineScreen from "./OfflineScreen";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export default function OfflineGate() {
  const offline = useSyncExternalStore(
    subscribe,
    () => !navigator.onLine,
    () => false
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const register = () => navigator.serviceWorker.register("/sw.js").catch(() => {});
    /* After load, so it never competes with the page itself. */
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return offline ? <OfflineScreen /> : null;
}
