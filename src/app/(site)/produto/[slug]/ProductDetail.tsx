"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase-client";
import { brl, productWaMessage } from "@/lib/format";
import type { Product, Variant } from "@/lib/types";

type Props = {
  product: Product;
  variants: Variant[];
  siteName: string;
  whatsapp: string;
  productUrl: string;
};

export default function ProductDetail({ product: p, variants, siteName, whatsapp, productUrl }: Props) {
  const [imgIdx, setImgIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [fav, setFav] = useState(false);
  const [zoom, setZoom] = useState(false);

  const stockFor = useMemo(() => {
    const map = new Map<string, number>();
    variants.forEach((v) => {
      const k = `${v.size}||${v.color}`;
      map.set(k, (map.get(k) || 0) + v.stock);
    });
    return map;
  }, [variants]);

  const totalStock = useMemo(
    () => variants.reduce((s, v) => s + v.stock, 0),
    [variants]
  );

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

  async function logClick(sizeSel: string | null, colorSel: string | null) {
    try {
      await createClient().from("whatsapp_clicks").insert({
        product_id: p.id,
        product_name: p.name,
        size: sizeSel,
        color: colorSel,
        source_page: "product",
      });
    } catch {
      /* log best-effort */
    }
  }

  async function buy() {
    const sizeSel = size || (p.sizes.length === 1 ? p.sizes[0] : null);
    const colorSel = color || (p.colors.length === 1 ? p.colors[0] : null);
    await logClick(sizeSel, colorSel);
    const msg = productWaMessage(siteName, p.name, sizeSel, colorSel, productUrl);
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  }

  function toggleFav() {
    try {
      const raw = localStorage.getItem("mu_favorites");
      let ids: string[] = raw ? JSON.parse(raw) : [];
      if (ids.includes(p.id)) {
        ids = ids.filter((i) => i !== p.id);
        setFav(false);
      } else {
        ids.push(p.id);
        setFav(true);
      }
      localStorage.setItem("mu_favorites", JSON.stringify(ids));
    } catch {
      /* localStorage indisponível */
    }
  }

  useEffectFav(p.id, setFav);

  const hasPromo = p.promo_price != null && p.promo_price < p.price;
  const installment = hasPromo ? p.promo_price! / 3 : p.price / 3;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="grid gap-12 lg:grid-cols-2">
        {/* ------- Galeria ------- */}
        <div>
          <div
            className="zoom-frame relative aspect-[3/4] cursor-zoom-in bg-sand"
            onClick={() => setZoom(true)}
          >
            <Image
              src={p.images[imgIdx] || "/images/look-001.jpg"}
              alt={p.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {p.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {p.images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  className={`relative aspect-[3/4] w-20 overflow-hidden border-2 transition-colors ${
                    i === imgIdx ? "border-caramel" : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                  aria-label={`Foto ${i + 1}`}
                >
                  <Image src={src} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ------- Info ------- */}
        <div>
          {p.tags.length > 0 && (
            <p className="mb-2 flex gap-2">
              {p.tags.map((t) => (
                <span key={t} className="rounded-full bg-sand px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-caramel-deep">
                  {t === "promocao" ? "promoção" : t}
                </span>
              ))}
            </p>
          )}
          <h1 className="font-display text-3xl text-ink sm:text-4xl">{p.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            {hasPromo ? (
              <>
                <span className="text-2xl font-semibold text-caramel">{brl(p.promo_price!)}</span>
                <span className="text-sm text-ink-soft line-through">{brl(p.price)}</span>
              </>
            ) : (
              <span className="text-2xl font-semibold text-ink">{brl(p.price)}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            ou 3x de {brl(installment)} sem juros
          </p>

          {p.description && (
            <p className="mt-6 leading-relaxed text-ink-soft">{p.description}</p>
          )}
          {p.fabric && (
            <p className="mt-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">Tecido:</span> {p.fabric}
            </p>
          )}
          {p.size_chart && (
            <p className="mt-2 text-sm text-ink-soft">
              <span className="font-medium text-ink">Medidas:</span> {p.size_chart}
            </p>
          )}

          {/* Tamanhos */}
          {p.sizes.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-soft">
                Tamanho
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
                      className={`min-w-12 rounded-full border px-4 py-2.5 text-sm transition-all ${
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
              <p className="mb-3 text-[11px] uppercase tracking-widest text-ink-soft">Cor</p>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c) => {
                  const st = stockOf(size, c);
                  const disabled = st <= 0;
                  return (
                    <button
                      key={c}
                      disabled={disabled}
                      onClick={() => setColor(color === c ? null : c)}
                      className={`rounded-full border px-4 py-2.5 text-sm transition-all ${
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
          <p className="mt-6 text-sm">
            {totalStock <= 0 ? (
              <span className="font-medium text-ink-soft">Esgotado</span>
            ) : totalStock <= 4 ? (
              <span className="font-medium text-caramel">Últimas peças em estoque!</span>
            ) : (
              <span className="text-ink-soft">Em estoque</span>
            )}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={buy}
              disabled={totalStock <= 0}
              className="flex-1 rounded-full bg-ink px-8 py-4 text-[12px] font-semibold uppercase tracking-widest text-cream transition-all hover:bg-caramel disabled:cursor-not-allowed disabled:opacity-40"
            >
              Comprar pelo WhatsApp
            </button>
            <button
              onClick={toggleFav}
              aria-label="Favoritar"
              className={`flex items-center justify-center gap-2 rounded-full border px-6 py-4 text-[12px] font-semibold uppercase tracking-widest transition-all ${
                fav ? "border-caramel bg-caramel/10 text-caramel" : "border-line text-ink hover:border-ink"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill={fav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {fav ? "Favoritado" : "Favoritar"}
            </button>
          </div>
        </div>
      </div>

      {/* Zoom modal */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-6"
          onClick={() => setZoom(false)}
        >
          <div className="relative h-[85vh] w-full max-w-3xl">
            <Image
              src={p.images[imgIdx] || "/images/look-001.jpg"}
              alt={p.name}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <button
            className="absolute right-6 top-6 text-2xl text-cream/80 hover:text-cream"
            aria-label="Fechar zoom"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/** Sync inicial do estado de favorito com localStorage. */
function useEffectFav(id: string, set: (v: boolean) => void) {
  if (typeof window === "undefined") return;
  try {
    const ids: string[] = JSON.parse(localStorage.getItem("mu_favorites") || "[]");
    set(ids.includes(id));
  } catch {
    /* noop */
  }
}
