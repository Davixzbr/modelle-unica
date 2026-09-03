"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { brl, productWaMessage, waLink, waNumber, shareProduct } from "@/lib/format";
import { logEvent } from "@/lib/analytics";
import { useFavorites } from "@/hooks/useFavorites";
import { useCart } from "@/hooks/useCart";
import Icon from "@/components/Icon";
import { toast } from "@/components/Toast";
import Swatch from "@/components/Swatch";
import Lightbox from "@/components/Lightbox";
import MedidasModal from "@/components/MedidasModal";
import { TrustBadges } from "@/components/Testimonials";
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
  const [lightbox, setLightbox] = useState(false);
  const [medidas, setMedidas] = useState(false);
  const [policy, setPolicy] = useState<{ title?: string; text?: string } | null>(null);
  const { has, toggle } = useFavorites();
  const { add } = useCart();

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

  useEffect(() => {
    if (p.sizes.length === 1) setSize(p.sizes[0]);
    if (p.colors.length === 1) setColor(p.colors[0]);
  }, [p.sizes, p.colors]);

  // Log de visualização (uma vez por montagem)
  useEffect(() => {
    logEvent("view", { product_id: p.id });
  }, [p.id]);

  const effectivePrice = p.promo_price != null && p.promo_price < p.price ? p.promo_price : p.price;
  const hasPromo = effectivePrice !== p.price;
  const fav = has(p.id);
  const soldOut = totalStock <= 0;

  function buy() {
    const sizeSel = size || (p.sizes.length === 1 ? p.sizes[0] : null);
    const colorSel = color || (p.colors.length === 1 ? p.colors[0] : null);

    const msg = productWaMessage({
      siteName,
      productName: p.name,
      size: sizeSel,
      color: colorSel,
      price: effectivePrice,
      slug: p.slug,
    });
    // 1. WhatsApp abre IMEDIATAMENTE
    window.open(waLink(waNumber(whatsapp), msg), "_blank", "noopener");

    // 2. Logs fire-and-forget
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
    toast(adding ? "Adicionado aos favoritos" : "Removido dos favoritos");
  }

  /** Seleção precisa escolher a variante exata quando há mais de 1 tamanho E 1 cor. */
  const selectionIncomplete = p.sizes.length > 1 && p.colors.length > 1 && !(size && color);

  function addToCart() {
    if (soldOut) return;
    if (selectionIncomplete) {
      toast("Escolha tamanho e cor antes de adicionar", "warn");
      return;
    }
    // Variante exata: match direto; senão, soma do estoque das variantes correspondentes
    const exact = variants.find((v) => v.size === (size ?? "") && v.color === (color ?? ""));
    const maxStock = exact
      ? exact.stock
      : stockOf(size || null, color || null);
    if (maxStock <= 0) {
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
      maxStock,
      image: p.main_image || p.images[0] || null,
    });
    if (result === "added") toast("Adicionado ao carrinho ✓");
    else if (result === "max") toast(`Você já tem o estoque máximo (${maxStock}) no carrinho`, "warn");
    else toast("Peça esgotada", "warn");
  }

  async function onShare() {
    logEvent("share", { product_id: p.id });
    const url = typeof window !== "undefined" ? window.location.href : "";
    const result = await shareProduct(url, `${p.name} · ${siteName}`);
    if (result === "copied") toast("Link copiado!");
    if (result === "failed") toast("Não foi possível compartilhar", "error");
  }

  /** Avise-me: WhatsApp com msg pré-montada + evento restock_interest. */
  function notifyMe() {
    const sizeSel = size || (p.sizes.length === 1 ? p.sizes[0] : null);
    const colorSel = color || (p.colors.length === 1 ? p.colors[0] : null);
    const parts = [p.name, sizeSel, colorSel].filter(Boolean).join(" — ");
    const msg = `Olá! Quero ser avisada quando o ${parts} voltar ao estoque.`;
    window.open(waLink(waNumber(whatsapp), msg), "_blank", "noopener");
    logEvent("restock_interest", {
      product_id: p.id,
      metadata: { size: sizeSel, color: colorSel },
    });
    toast("Avisamos você quando chegar!");
  }

  async function openMedidas() {
    setMedidas(true);
    if (!policy) {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "exchange_policy")
          .single();
        setPolicy((data?.value as { title?: string; text?: string }) || null);
      } catch {
        setPolicy(null);
      }
    }
  }

  const installment = effectivePrice / 3;
  const selectedStock = stockOf(size, color);

  return (
    <div className="mx-auto max-w-7xl px-5 pb-32 pt-8 lg:pb-16 lg:pt-14">
      {/* Breadcrumb */}
      <nav className="mb-8 hidden items-center gap-2 text-[12px] text-ink-faint lg:flex" aria-label="Localização">
        <Link href="/" className="hover:text-ink">Home</Link>
        <Icon name="chevronRight" size={11} />
        <Link href="/catalogo" className="hover:text-ink">Catálogo</Link>
        {p.categories && (
          <>
            <Icon name="chevronRight" size={11} />
            <Link href={`/catalogo?cat=${p.categories.slug}`} className="hover:text-ink">
              {p.categories.name}
            </Link>
          </>
        )}
        <Icon name="chevronRight" size={11} />
        <span className="text-ink">{p.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ═══ Galeria — sticky desktop ═══ */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="zoom-frame relative aspect-[3/4] cursor-zoom-in bg-sand"
            onClick={() => setLightbox(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setLightbox(true)}
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
            {p.is_new && (
              <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink">
                Novo
              </span>
            )}
            {/* Swipe no mobile */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx((imgIdx - 1 + gallery.length) % gallery.length);
                  }}
                  className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-ink shadow-card transition-opacity hover:bg-cream lg:hidden"
                  aria-label="Foto anterior"
                >
                  <Icon name="chevronLeft" size={17} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setImgIdx((imgIdx + 1) % gallery.length);
                  }}
                  className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-cream/85 text-ink shadow-card lg:hidden"
                  aria-label="Próxima foto"
                >
                  <Icon name="chevronRight" size={17} />
                </button>
                {/* Indicadores mobile */}
                <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5 lg:hidden">
                  {gallery.map((_, i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === imgIdx ? "w-5 bg-cream" : "w-1.5 bg-cream/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails — só desktop (mobile tem swipe) */}
          {gallery.length > 1 && (
            <div className="mt-4 hidden gap-3 lg:flex" role="tablist" aria-label="Fotos do produto">
              {gallery.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setImgIdx(i)}
                  role="tab"
                  aria-selected={i === imgIdx}
                  aria-label={`Foto ${i + 1}`}
                  className={`relative aspect-[3/4] w-[74px] overflow-hidden border transition-all duration-200 ${
                    i === imgIdx
                      ? "border-gold-deep opacity-100"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <Image src={src} alt="" fill sizes="74px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ═══ Informações ═══ */}
        <div>
          {p.collections?.name && (
            <p className="mb-3 flex items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-gold-deep">
              <span className="inline-block h-px w-6 bg-gold" aria-hidden />
              {p.collections.name}
              {p.collections.period_text ? ` · ${p.collections.period_text}` : ""}
            </p>
          )}
          <h1 className="font-display text-[32px] leading-tight text-ink sm:text-[44px]">{p.name}</h1>
          {p.favorites_count > 0 && (
            <p className="mt-2.5 flex items-center gap-1.5 text-[13px] text-ink-faint">
              <Icon name="heart" size={13} className="text-wine" />
              {p.favorites_count} {p.favorites_count === 1 ? "pessoa favoritou" : "pessoas favoritaram"} esta peça
            </p>
          )}
          {p.short_description && (
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{p.short_description}</p>
          )}

          {/* Preço */}
          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            {hasPromo ? (
              <>
                <span className="font-display text-[32px] font-semibold text-wine">
                  {brl(effectivePrice)}
                </span>
                <span className="text-[15px] text-ink-faint line-through">{brl(p.price)}</span>
                <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-gold-deep">
                  −{Math.round((1 - effectivePrice / p.price) * 100)}%
                </span>
              </>
            ) : (
              <span className="font-display text-[32px] font-semibold text-ink">{brl(p.price)}</span>
            )}
          </div>
          <p className="mt-1 text-[13.5px] text-ink-faint">
            ou 3x de {brl(installment)} sem juros
          </p>

          <div className="my-8 h-px bg-line" />

          {/* Tamanhos */}
          {p.sizes.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 flex items-baseline justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                  Tamanho{size ? `: ${size}` : ""}
                </p>
                <button
                  onClick={openMedidas}
                  className="text-[12px] text-ink-faint underline-offset-2 hover:text-ink hover:underline"
                >
                  Não sabe seu tamanho? Veja o guia
                </button>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {p.sizes.map((s) => {
                  const st = stockOf(s, color);
                  const disabled = st <= 0;
                  return (
                    <button
                      key={s}
                      disabled={disabled}
                      onClick={() => setSize(size === s ? null : s)}
                      aria-pressed={size === s}
                      aria-label={`${s}${disabled ? " (sem estoque)" : ""}`}
                      className={`min-h-12 min-w-14 rounded-lg border px-4 text-[14px] font-medium transition-all duration-150 active:scale-95 ${
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

          {/* Cores */}
          {p.colors.length > 0 && (
            <div className="mt-7">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Cor{color ? `: ${color}` : ""}
              </p>
              <div className="flex flex-wrap gap-2.5">
                {p.colors.map((c) => {
                  const st = stockOf(size, c);
                  const disabled = st <= 0;
                  return (
                    <button
                      key={c}
                      disabled={disabled}
                      onClick={() => setColor(color === c ? null : c)}
                      aria-pressed={color === c}
                      aria-label={`${c}${disabled ? " (sem estoque)" : ""}`}
                      className={`min-h-12 rounded-lg border px-5 text-[14px] font-medium transition-all duration-150 active:scale-95 ${
                        disabled
                          ? "cursor-not-allowed border-line/60 text-ink-faint/40 line-through"
                          : color === c
                            ? "border-ink bg-ink text-cream"
                            : "border-line bg-paper text-ink hover:border-ink"
                      }`}
                    >
                      <Swatch name={c} className="mr-2 -mb-0.5" />
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Estoque contextual */}
          <p className="mt-7 min-h-6 text-[14px]" aria-live="polite">
            {soldOut ? (
              <span className="text-ink-soft">
                Esgotado — novidades chegam toda semana, siga no Instagram.
              </span>
            ) : selectedStock > 0 && (size || color) ? (
              <span className="font-medium text-moss">{selectedStock} em estoque nesta variação</span>
            ) : totalStock <= lowStock ? (
              <span className="font-medium text-wine">Últimas peças em estoque</span>
            ) : (
              <span className="text-ink-faint">Selecione tamanho e cor para ver disponibilidade</span>
            )}
          </p>

          {/* Avise-me — só quando a variação selecionada está esgotada */}
          {!soldOut && size && color && selectedStock <= 0 && (
            <button
              onClick={notifyMe}
              className="btn btn-outline mt-4 min-h-12 w-full !text-[13px] !border-wine/40 !text-wine hover:!border-wine"
            >
              <Icon name="bell" size={16} />
              Avise-me quando chegar: {size}/{color}
            </button>
          )}

          {/* CTAs desktop (mobile usa barra fixa) */}
          <div className="mt-8 hidden gap-3 lg:flex">
            <button
              onClick={addToCart}
              disabled={soldOut}
              className="btn btn-outline min-h-14 flex-1 !text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="package" size={17} />
              {soldOut ? "Esgotado" : "Adicionar ao carrinho"}
            </button>
            <button
              onClick={buy}
              disabled={soldOut}
              className="btn btn-solid min-h-14 flex-1 !text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="whatsapp" size={17} />
              {soldOut ? "Produto esgotado" : "Comprar pelo WhatsApp"}
            </button>
            <FavShareButtons fav={fav} onToggleFav={onToggleFav} onShare={onShare} />
          </div>

          {/* Descrição */}
          {p.description && (
            <div className="mt-10">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                Sobre a peça
              </p>
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">
                {p.description}
              </p>
            </div>
          )}
          {p.fabric && (
            <p className="mt-4 text-[14px] text-ink-soft">
              <span className="font-medium text-ink">Tecido:</span> {p.fabric}
            </p>
          )}

          {p.size_chart && (
            <details className="mt-6 rounded-xl border border-line bg-paper px-5 py-4 text-sm text-ink-soft">
              <summary className="cursor-pointer text-[14px] font-medium text-ink">
                Medidas do modelo
              </summary>
              <p className="mt-2.5 leading-relaxed">{p.size_chart}</p>
            </details>
          )}

          {/* Confiança */}
          <div className="mt-10 grid gap-3 border-t border-line pt-8 text-[13.5px] text-ink-soft">
            <p className="flex items-center gap-3">
              <Icon name="whatsapp" size={16} className="text-moss" />
              Atendimento e venda direto pelo WhatsApp {""}
              — respondemos rápido.
            </p>
            <p className="flex items-center gap-3">
              <Icon name="check" size={16} className="text-moss" />
              Troca facilitada conforme nossa{" "}
              <Link href="/medidas" className="underline underline-offset-2 hover:text-ink">
                política de trocas
              </Link>
              .
            </p>
          </div>

          {/* Selos de confiança */}
          <TrustBadges variant="product" />
        </div>
      </div>

      {/* Barra fixa mobile — CTA sempre acessível */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-cream/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleFav}
            aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-pressed={fav}
            className={`grid h-12 w-12 flex-none place-items-center rounded-full border transition-colors ${
              fav ? "border-wine bg-wine/5 text-wine" : "border-line text-ink"
            }`}
          >
            <Icon name="heart" size={19} strokeWidth={fav ? 2 : 1.5} className={fav ? "fill-current" : ""} />
          </button>
          <button
            onClick={buy}
            disabled={soldOut}
            className="btn btn-solid min-h-12 flex-1 !py-0 !text-[13px] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="whatsapp" size={16} />
            {soldOut ? "Esgotado" : "Comprar"}
          </button>
          <button
            onClick={addToCart}
            disabled={soldOut}
            aria-label="Adicionar ao carrinho"
            className="btn btn-outline h-12 w-12 flex-none !p-0 disabled:opacity-40"
          >
            <Icon name="package" size={18} />
          </button>
        </div>
      </div>

      {/* Lightbox fullscreen */}
      {lightbox && (
        <Lightbox
          images={gallery}
          alt={p.name}
          index={imgIdx}
          onClose={() => setLightbox(false)}
        />
      )}

      {/* Guia de medidas em modal */}
      {medidas && <MedidasModal policy={policy} onClose={() => setMedidas(false)} />}
    </div>
  );

  function FavShareButtons({
    fav,
    onToggleFav,
    onShare,
  }: {
    fav: boolean;
    onToggleFav: () => void;
    onShare: () => void;
  }) {
    return (
      <div className="flex gap-3">
        <button
          onClick={onToggleFav}
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={fav}
          className={`flex items-center gap-2 rounded-full border px-6 text-[13px] font-medium transition-all active:scale-95 ${
            fav ? "border-wine bg-wine/5 text-wine" : "border-line text-ink hover:border-ink"
          }`}
        >
          <Icon name="heart" size={16} strokeWidth={fav ? 2 : 1.5} className={fav ? "fill-current" : ""} />
          {fav ? "Favorito" : "Favoritar"}
        </button>
        <button
          onClick={onShare}
          aria-label="Compartilhar produto"
          className="grid h-13 w-13 place-items-center rounded-full border border-line px-4 text-ink transition-all hover:border-ink active:scale-95"
        >
          <Icon name="external" size={16} />
        </button>
      </div>
    );
  }
}
