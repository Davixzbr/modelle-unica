"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MedidasContent from "@/components/MedidasContent";
import Icon from "@/components/Icon";

/** Guia de medidas em modal leve (não navega). Foco preso, ESC fecha. */
export default function MedidasModal({
  policy,
  onClose,
}: {
  policy: { title?: string; text?: string } | null;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const f = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label="Guia de medidas"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-auto flex justify-center sm:inset-0 sm:items-center sm:p-6">
        <div
          ref={panelRef}
          className="relative max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-cream p-6 shadow-float sm:rounded-2xl sm:p-8"
          style={{ animation: "sheetUp .28s cubic-bezier(.22,1,.36,1)" }}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fechar guia de medidas"
            className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-ink transition-colors hover:bg-sand"
          >
            <Icon name="x" size={18} />
          </button>
          <p className="text-[11px] uppercase tracking-[0.3em] text-caramel">Vista-se bem</p>
          <h2 className="font-display mt-1.5 text-3xl text-ink">Guia de medidas</h2>
          <div className="mt-4">
            <MedidasContent policy={policy} />
          </div>
          <Link
            href="/medidas"
            onClick={onClose}
            className="mt-6 inline-block text-[13px] text-gold-deep underline underline-offset-2"
          >
            Abrir página completa
          </Link>
        </div>
      </div>
    </div>
  );
}
