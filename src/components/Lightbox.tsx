"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/Icon";

/**
 * Lightbox fullscreen da galeria do produto: setas/teclado, swipe no mobile,
 * contador "2/5", zoom por duplo toque/clique, fecha com ESC/backdrop.
 */
export default function Lightbox({
  images,
  alt,
  index,
  onClose,
}: {
  images: string[];
  alt: string;
  index: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(index);
  const [zoom, setZoom] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const closeRef = useRef<HTMLButtonElement>(null);
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const lastTap = useRef(0);

  const prev = useCallback(() => setIdx((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setIdx((i) => (i + 1) % images.length), [images.length]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft") {
        setZoom(false);
        prev();
      } else if (e.key === "ArrowRight") {
        setZoom(false);
        next();
      } else if (e.key === "Tab") {
        e.preventDefault(); // lightbox controla tudo pelo teclado próprio
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose, prev, next]);

  if (images.length === 0) return null;

  /** Duplo toque/clique alterna zoom; clique simples (desktop, sem zoom) não faz nada. */
  function onTap(e: React.MouseEvent) {
    const now = Date.now();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;
    if (now - lastTap.current < 320) {
      setOrigin(`${px}% ${py}%`);
      setZoom((z) => !z);
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-ink/95"
      role="dialog"
      aria-modal="true"
      aria-label={`Galeria de ${alt}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Topo: contador + fechar */}
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-[12px] font-medium tracking-[0.2em] text-cream/80">
          {idx + 1}/{images.length}
        </span>
        <button
          ref={closeRef}
          onClick={onClose}
          aria-label="Fechar galeria"
          className="grid h-11 w-11 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Imagem */}
      <div
        className="relative flex-1 select-none overflow-hidden"
        onClick={onTap}
        onTouchStart={(e) => {
          const t = e.touches[0];
          touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
        }}
        onTouchEnd={(e) => {
          const s = touch.current;
          if (!s || zoom) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          const dt = Date.now() - s.t;
          if (dt < 600 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) next();
            else prev();
          }
          touch.current = null;
        }}
      >
        <div
          className="relative h-full w-full transition-transform duration-300"
          style={{ transform: zoom ? "scale(2)" : "scale(1)", transformOrigin: origin }}
        >
          <Image
            src={images[idx]}
            alt={`${alt} — foto ${idx + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(false);
                prev();
              }}
              aria-label="Foto anterior"
              className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
            >
              <Icon name="chevronLeft" size={19} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoom(false);
                next();
              }}
              aria-label="Próxima foto"
              className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-cream/10 text-cream transition-colors hover:bg-cream/20"
            >
              <Icon name="chevronRight" size={19} />
            </button>
          </>
        )}
      </div>

      {/* Base: indicadores */}
      {images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-5">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === idx ? "w-5 bg-cream" : "w-1.5 bg-cream/40"
              }`}
            />
          ))}
        </div>
      )}
      <p className="pb-4 text-center text-[11px] text-cream/50">
        Toque duas vezes para ampliar · arraste para trocar de foto
      </p>
    </div>
  );
}
