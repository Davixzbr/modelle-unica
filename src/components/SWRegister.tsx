"use client";

import { useEffect } from "react";

/** Registra o service worker apenas em produção. */
export default function SWRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    if (window.location.pathname.startsWith("/admin")) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registro nunca quebra a UI */
    });
  }, []);
  return null;
}
