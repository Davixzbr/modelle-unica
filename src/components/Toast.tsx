"use client";

import { useEffect, useState } from "react";

/** Toast minimalista do design system. */
type ToastFn = (msg: string, kind?: "ok" | "err") => void;
let pushFn: ToastFn | null = null;

export function toast(msg: string, kind: "ok" | "err" = "ok") {
  pushFn?.(msg, kind);
}

export default function ToastHost() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: string }[]>([]);

  useEffect(() => {
    const push: ToastFn = (msg, kind = "ok") => {
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev.slice(-2), { id, msg, kind }]);
      setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
    };
    pushFn = push;
    return () => {
      pushFn = null;
    };
  }, []);

  return (
    <div className="fixed bottom-20 left-1/2 z-[60] flex -translate-x-1/2 flex-col items-center gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`animate-[fadeIn_.2s_ease] rounded-full px-5 py-2.5 text-[13px] font-medium shadow-lg ${
            t.kind === "err" ? "bg-red-600 text-white" : "bg-ink text-cream"
          }`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}
