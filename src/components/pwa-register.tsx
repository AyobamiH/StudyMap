"use client";

import { useEffect } from "react";

/** Registers the service worker in production so the app works offline. */
export function PwaRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const version = process.env.NEXT_PUBLIC_SW_VERSION;
    const scriptUrl = version
      ? `/sw.js?v=${encodeURIComponent(version)}`
      : "/sw.js";

    navigator.serviceWorker.register(scriptUrl).catch((error) => {
      console.error("[PWA] Service worker registration failed:", error);
    });
  }, []);

  return null;
}
