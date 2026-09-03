"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

/** Toast do design system — API: toast(msg, "success" | "error" | "warn"). */
type Kind = "success" | "error" | "warn";
type ToastFn = (msg: string, kind?: Kind) => void;
let pushFn: ToastFn | null = null;

export function toast(msg: string, kind: Kind = "success") {
  pushFn?.(msg, kind);
}

const ICONS: Record<Kind, string> = { success: "check", error: "alert", warn: "alert" };

export default function ToastHost() {
  const [items, setItems] = useState<{ id: number; msg: string; kind: Kind }[]>([]);

  useEffect(() => {
    const push: ToastFn = (msg, kind = "success") => {
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
          className={`pointer-events-none flex animate-[fadeIn_.2s_ease] items-center gap-2 rounded-full py-2.5 pl-4 pr-5 text-[13px] font-medium shadow-float ${
            t.kind === "error"
              ? "bg-wine text-cream"
              : t.kind === "warn"
                ? "bg-gold-deep text-cream"
                : "bg-ink text-cream"
          }`}
        >
          <Icon name={ICONS[t.kind]} size={15} strokeWidth={2} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
