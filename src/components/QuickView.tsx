"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";
import { brl } from "@/lib/format";
import { useCart } from "@/hooks/useCart";
import Icon from "@/components/Icon";
import Swatch from "@/components/Swatch";
import { toast } from "@/components/Toast";
import type { Product, Variant } from "@/lib/types";

/**
 * Quick view — modal/bottom-sheet com seleção de tamanho/cor e add ao carrinho,
 * sem navegar. Foco preso, fecha com ESC/backdrop.
 */
export default function QuickView({
  product: p,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { add } = useCart();
  const [variants, setVariants] = useState<Variant[]>([]);
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | null>(p.sizes.length === 1 ? p.sizes[0] : null);
  const [color, setColor] = useState<string | null>(p.colors.length === 1 ? p.colors[0] : null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const gallery = useMemo(() => {
    const imgs = [...p.images];
    if (p.main_image && imgs[0] !== p.main_image) {
      const i = imgs.indexOf(p.main_image);
      if (i > 0) {
        imgs.splice(i, 1);
        imgs.unshift(p.main_image);
      }
    }
    return imgs.length ? imgs : ["/images/look-001.jpg"];
  }, [p.images, p.main_image]);

  // Busca variantes ao abrir (REST, anon)
  useEffect(() => {
    const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabase
      .from("variants")
      .select("*")
      .eq("product_id", p.id)
      .then(
        (res: { data: Variant[] | null }) => setVariants(res.data || []),
        () => setVariants([])
      );
  }, [p.id]);

  // Scroll lock + foco inicial
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // ESC fecha + foco preso (Tab cicla dentro do modal)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, a[href], input, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
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
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const stockFor = useMemo(() => {
    const map = new Map<string, number>();
    variants.forEach((v) => {
      const k = `${v.size}||${v.color}`;
      map.set(k, (map.get(k) || 0) + v.stock);
    });
    return map;
  }, [variants]);

  function stockOf(s?: string | null, c?: string | null): number {
    let total = 0;
    for (const [k, v] of stockFor) {
      const [ks, kc] = k.split("||");
      if (s && ks !== s) continue;
      if (c && kc !== c) continue;
      total += v;
    }
    return total;
  }

  const totalStock = useMemo(() => variants.reduce((s, v) => s + v.stock, 0), [variants]);
  const effectivePrice = p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price;
  const hasPromo = effectivePrice !== p.price;
  const selectionIncomplete = p.sizes.length > 1 && p.colors.length > 1 && !(size && color);

  function addToCart() {
    if (totalStock > 0 && variants.length > 0 && selectionIncomplete) {
      toast("Escolha tamanho e cor antes de adicionar", "warn");
      return;
    }
    const exact = variants.find((v) => v.size === (size ?? "") && v.color === (color ?? ""));
    const maxStock = exact ? exact.stock : stockOf(size || null, color || null);
    if (variants.length > 0 && maxStock <= 0) {
      toast("Esta variação está esgotada", "warn");
      return;
    }
    const result = add({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      size: size || (p.sizes.length === 1 ? p.sizes[0] : ""),
      color: color || (p.colors.length === 1 ? p.colors[0] : ""),
      price: effectivePrice,
      maxStock: maxStock > 0 ? maxStock : 99,
      image: p.main_image || p.images[0] || null,
    });
    if (result === "added") {
      toast("Adicionado ao carrinho ✓");
      onClose();
    } else if (result === "max") {
      toast(`Você já tem o estoque máximo (${maxStock}) no carrinho`, "warn");
    } else {
      toast("Peça esgotada", "warn");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      aria-label={`Visualização rápida de ${p.name}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 top-auto flex justify-center sm:inset-0 sm:items-center sm:p-6">
        <div
          ref={panelRef}
          className="relative max-h-[92svh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-cream shadow-float sm:rounded-2xl"
          style={{ animation: "sheetUp .28s cubic-bezier(.22,1,.36,1)" }}
        >
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Fechar visualização rápida"
            className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-cream/90 text-ink shadow-card transition-colors hover:bg-sand"
          >
            <Icon name="x" size={18} />
          </button>

          <div className="grid gap-0 sm:grid-cols-2">
            {/* Galeria mini */}
            <div className="bg-sand/60 p-4 sm:p-5">
              <div className="zoom-frame relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-sand">
                <Image
                  src={gallery[imgIdx]}
                  alt={p.name}
                  fill
                  sizes="(max-width: 640px) 92vw, 360px"
                  className="object-cover"
                />
                {p.total_stock <= 0 && (
                  <div className="absolute inset-0 grid place-items-center bg-cream/50">
                    <span className="rounded-full bg-ink/85 px-4 py-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream">
                      Esgotado
                    </span>
                  </div>
                )}
              </div>
              {gallery.length > 1 && (
                <div className="mt-3 flex gap-2" role="tablist" aria-label="Fotos do produto">
                  {gallery.slice(0, 5).map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setImgIdx(i)}
                      role="tab"
                      aria-selected={i === imgIdx}
                      aria-label={`Foto ${i + 1}`}
                      className={`relative aspect-[3/4] w-11 overflow-hidden rounded-md border transition-all duration-150 ${
                        i === imgIdx ? "border-gold-deep" : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <Image src={src} alt="" fill sizes="44px" className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-col p-5 sm:p-6">
              {p.categories?.name && (
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.22em] text-gold-deep">
                  {p.categories.name}
                </p>
              )}
              <h2 className="font-display mt-1.5 text-2xl leading-tight text-ink">{p.name}</h2>
              <p className="mt-2 flex items-baseline gap-2">
                {hasPromo ? (
                  <>
                    <span className="font-display text-xl font-semibold text-wine">{brl(effectivePrice)}</span>
                    <span className="text-[13px] text-ink-faint line-through">{brl(p.price)}</span>
                  </>
                ) : (
                  <span className="font-display text-xl font-semibold text-ink">{brl(p.price)}</span>
                )}
              </p>
              {p.short_description && (
                <p className="mt-2 line-clamp-2 text-[13.5px] leading-relaxed text-ink-soft">
                  {p.short_description}
                </p>
              )}

              {p.sizes.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                    Tamanho{size ? `: ${size}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.sizes.map((s) => {
                      const st = stockOf(s, color);
                      const disabled = variants.length > 0 && st <= 0;
                      return (
                        <button
                          key={s}
                          disabled={disabled}
                          onClick={() => setSize(size === s ? null : s)}
                          aria-pressed={size === s}
                          aria-label={`${s}${disabled ? " (sem estoque)" : ""}`}
                          className={`min-h-10 min-w-11 rounded-lg border px-3 text-[13px] font-medium transition-all duration-150 active:scale-95 ${
                            disabled
                              ? "cursor-not-allowed border-line/60 text-ink-faint/40 line-through"
                              : size === s
                                ? "border-ink bg-ink text-cream"
                                : "border-line bg-paper text-ink hover:border-ink"
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {p.colors.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                    Cor{color ? `: ${color}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {p.colors.map((c) => {
                      const st = stockOf(size, c);
                      const disabled = variants.length > 0 && st <= 0;
                      return (
                        <button
                          key={c}
                          disabled={disabled}
                          onClick={() => setColor(color === c ? null : c)}
                          aria-pressed={color === c}
                          aria-label={`${c}${disabled ? " (sem estoque)" : ""}`}
                          className={`min-h-10 rounded-lg border px-3.5 text-[13px] font-medium transition-all duration-150 active:scale-95 ${
                            disabled
                              ? "cursor-not-allowed border-line/60 text-ink-faint/40 line-through"
                              : color === c
                                ? "border-ink bg-ink text-cream"
                                : "border-line bg-paper text-ink hover:border-ink"
                          }`}
                        >
                          <Swatch name={c} className="mr-1.5 -mb-0.5" />
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  onClick={addToCart}
                  disabled={totalStock <= 0 && variants.length > 0}
                  className="btn btn-solid min-h-12 !text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon name="package" size={16} />
                  {totalStock <= 0 && variants.length > 0 ? "Esgotado" : "Adicionar ao carrinho"}
                </button>
                <Link href={`/produto/${p.slug}`} className="btn btn-outline min-h-12 !text-[13px]">
                  Ver completo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        @media (min-width: 640px) {
          @keyframes fadeIn {
            from { opacity: 0; transform: scale(.97); }
          }
        }
      `}</style>
    </div>
  );
}
