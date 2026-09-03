"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { brl, productWaMessage, waLink, waNumber, shareProduct } from "@/lib/format";
import { logEvent } from "@/lib/analytics";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/components/Toast";
import type { Product, Variant } from "@/lib/types";

type Props = {
  product: Product;
  variants: Variant[];
  siteName: string;
  whatsapp: string;
  lowStock: number;
};

export default function ProductDetail({ product: p, variants, siteName, whatsapp, lowStock }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const { has, toggle } = useFavorites();

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

  const stockFor = useMemo(() => {
    const map = new Map<string, number>();
    variants.forEach((v) => {
      const k = `${v.size}||${v.color}`;
      map.set(k, (map.get(k) || 0) + v.stock);
    });
    return map;
  }, [variants]);

  const totalStock = useMemo(() => variants.reduce((s, v) => s + v.stock, 0), [variants]);

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

  // Libera tamanho/cor automaticamente quando só existe uma opção
  useEffect(() => {
    if (p.sizes.length === 1) setSize(p.sizes[0]);
    if (p.colors.length === 1) setColor(p.colors[0]);
  }, [p.sizes, p.colors]);

  const effectivePrice = p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price;
  const hasPromo = effectivePrice !== p.price;
  const fav = has(p.id);
  const productUrl = typeof window !== "undefined" ? window.location.href : "";

  function buy() {
    const sizeSel = size || (p.sizes.length === 1 ? p.sizes[0] : null);
    const colorSel = color || (p.colors.length === 1 ? p.colors[0] : null);

    // 1. Abre o WhatsApp IMEDIATAMENTE (log nunca bloqueia)
    const msg = productWaMessage({
      siteName,
      productName: p.name,
      size: sizeSel,
      color: colorSel,
      price: effectivePrice,
      slug: p.slug,
    });
    window.open(waLink(waNumber(whatsapp), msg), "_blank", "noopener");

    // 2. Registra o clique (fire-and-forget, direto via REST)
    logEvent("wa_click", {
      product_id: p.id,
      metadata: { size: sizeSel, color: colorSel, price: effectivePrice, page: "product" },
    });
    fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/whatsapp_clicks`, {
      method: "POST",
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        product_id: p.id,
        product_name: p.name,
        size: sizeSel,
        color: colorSel,
        source_page: "product",
      }),
      keepalive: true,
    }).catch(() => {});
  }

  function onToggleFav() {
    const adding = toggle(p.id);
    toast(adding ? "Adicionado aos favoritos ♥" : "Removido dos favoritos");
  }

  async function onShare() {
    logEvent("share", { product_id: p.id });
    const result = await shareProduct(productUrl, `${p.name} · ${siteName}`);
    if (result === "copied") toast("Link copiado!");
    if (result === "failed") toast("Não foi possível compartilhar", "err");
  }

  const installment = effectivePrice / 3;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-12">
        {/* ------- Galeria (1ª no mobile) ------- */}
        <div>
          <div
            className="zoom-frame relative aspect-[3/4] cursor-zoom-in bg-sand"
            onClick={() => setZoom(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setZoom(true)}
            aria-label="Ampliar foto"
          >
            <Image
              src={gallery[imgIdx]}
              alt={p.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-3 flex gap-3" role="tablist" aria-label="Fotos do produto">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  role="tab"
                  aria-selected={i === imgIdx}
                  aria-label={`Foto ${i + 1}`}
                  className={`relative aspect-[3/4] w-16 overflow-hidden border-2 transition-colors sm:w-20 ${
                    i === imgIdx ? "border-caramel" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------- Info (2ª no mobile, logo após imagem) ------- */}
        <div>
          {p.collections?.name && (
            <p className="mb-2 text-[11px] uppercase tracking-[0.25em] text-caramel">
              {p.collections.name}
              {p.collections.period_text ? ` · ${p.collections.period_text}` : ""}
            </p>
          )}
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{p.name}</h1>
          {p.short_description && (
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{p.short_description}</p>
          )}

          {/* Preço — logo após nome no mobile */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3">
            {hasPromo ? (
              <>
                <span className="text-2xl font-semibold text-caramel">{brl(effectivePrice)}</span>
                <span className="text-sm text-ink-soft line-through">{brl(p.price)}</span>
                <span className="rounded-full bg-caramel/10 px-2.5 py-1 text-xs font-semibold text-caramel">
                  −{Math.round((1 - effectivePrice / p.price) * 100)}%
                </span>
              </>
            ) : (
              <span className="text-2xl font-semibold text-ink">{brl(p.price)}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">ou 3x de {brl(installment)} sem juros</p>

          {p.description && (
            <p className="mt-6 whitespace-pre-line leading-relaxed text-ink-soft">{p.description}</p>
          )}
          {p.fabric && (
            <p className="mt-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">Tecido:</span> {p.fabric}
            </p>
          )}

          {/* Tamanhos */}
          {p.sizes.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-soft">
                Tamanho{size ? ` — ${size}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => {
                  const st = stockOf(s, color);
                  const disabled = st <= 0;
                  return (
                    <button
                      key={s}
                      disabled={disabled}
                      onClick={() => setSize(size === s ? null : s)}
                      aria-pressed={size === s}
                      className={`min-h-11 min-w-12 rounded-full border px-4 py-2.5 text-sm transition-all ${
                        disabled
                          ? "cursor-not-allowed border-line text-ink-soft/30 line-through"
                          : size === s
                            ? "border-ink bg-ink text-cream"
                            : "border-line hover:border-ink"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Cores */}
          {p.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-soft">
                Cor{color ? ` — ${color}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => {
                  const st = stockOf(size, c);
                  const disabled = st <= 0;
                  return (
                    <button
                      key={c}
                      disabled={disabled}
                      onClick={() => setColor(color === c ? null : c)}
                      aria-pressed={color === c}
                      className={`min-h-11 rounded-full border px-4 py-2.5 text-sm transition-all ${
                        disabled
                          ? "cursor-not-allowed border-line text-ink-soft/30 line-through"
                          : color === c
                            ? "border-ink bg-ink text-cream"
                            : "border-line hover:border-ink"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estoque */}
          <p className="mt-6 text-sm" aria-live="polite">
            {totalStock <= 0 ? (
              <span className="font-medium text-ink-soft">Esgotado — volte logo, novidades chegam toda semana.</span>
            ) : totalStock <= lowStock ? (
              <span className="font-medium text-caramel">Últimas peças em estoque!</span>
            ) : (
              <span className="text-ink-soft">Em estoque</span>
            )}
          </p>

          {p.size_chart && (
            <details className="mt-5 rounded-xl border border-line bg-white/60 px-5 py-3.5 text-sm text-ink-soft">
              <summary className="cursor-pointer font-medium text-ink">Medidas do modelo</summary>
              <p className="mt-2">{p.size_chart}</p>
            </details>
          )}

          {/* CTAs — sticky no mobile */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={buy}
              disabled={totalStock <= 0}
              className="min-h-13 flex-1 rounded-full bg-ink px-8 py-4 text-[12px] font-semibold uppercase tracking-widest text-cream transition-all hover:bg-caramel disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comprar pelo WhatsApp
            </button>
            <div className="flex gap-3">
              <button
                onClick={onToggleFav}
                aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-pressed={fav}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-6 py-4 text-[12px] font-semibold uppercase tracking-widest transition-all sm:flex-none ${
                  fav ? "border-caramel bg-caramel/10 text-caramel" : "border-line text-ink hover:border-ink"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {fav ? "Favorito" : "Favoritar"}
              </button>
              <button
                onClick={onShare}
                aria-label="Compartilhar produto"
                className="flex items-center justify-center rounded-full border border-line px-4 py-4 text-ink transition-all hover:border-ink"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6"
          onClick={() => setZoom(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Foto ampliada"
        >
          <div className="relative h-[85vh] w-full max-w-3xl">
            <Image src={gallery[imgIdx]} alt={p.name} fill sizes="100vw" className="object-contain" />
          </div>
          <button className="absolute right-6 top-6 text-3xl text-cream/80 hover:text-cream" aria-label="Fechar zoom">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
