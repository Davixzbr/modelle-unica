"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { brl } from "@/lib/format";
import { useFavorites } from "@/hooks/useFavorites";
import type { Product } from "@/lib/types";

const TAG_LABEL: Record<string, string> = {
  novo: "Novo",
  promocao: "Promoção",
  exclusivo: "Exclusivo",
};

export function StockBadge({ stock, low }: { stock: number; low: number }) {
  if (stock <= 0)
    return (
      <span className="rounded-full bg-ink/75 px-3 py-1 text-[10.5px] font-medium tracking-wide text-cream backdrop-blur-sm">
        Esgotado
      </span>
    );
  if (stock <= low)
    return (
      <span className="rounded-full bg-cream/90 px-3 py-1 text-[10.5px] font-medium tracking-wide text-wine">
        Últimas peças
      </span>
    );
  return null;
}

/** Botão de favorito independente (para fora do card, ex.: página de produto). */
export function FavoriteButton({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const { has, toggle } = useFavorites();
  const active = has(product.id);
  const [bump, setBump] = useState(false);

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(product.id);
    setBump(true);
    setTimeout(() => setBump(false), 350);
  }

  return (
    <button
      onClick={onClick}
      aria-label={active ? `Remover ${product.name} dos favoritos` : `Favoritar ${product.name}`}
      aria-pressed={active}
      className={`grid place-items-center rounded-full backdrop-blur-sm transition-all duration-200 ${
        size === "sm" ? "h-8 w-8" : "h-9 w-9"
      } ${active ? "bg-cream text-wine" : "bg-cream/85 text-ink hover:bg-cream"} ${
        bump ? "scale-110" : "scale-100"
      }`}
    >
      <Icon
        name="heart"
        size={size === "sm" ? 15 : 17}
        strokeWidth={active ? 2 : 1.5}
        className={active ? "fill-current" : ""}
      />
    </button>
  );
}

export default function ProductCard({ p, lowStock = 2 }: { p: Product; lowStock?: number }) {
  const total = p.total_stock;
  const hasPromo = p.promo_price != null && p.promo_price < p.price;
  const soldOut = total <= 0;
  const hoverImage = p.images.length > 1 ? p.images[1] : null;
  const [hover, setHover] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <Link
      href={`/produto/${p.slug}`}
      className={`group block ${soldOut ? "opacity-80" : ""}`}
      aria-label={soldOut ? `${p.name} (esgotado)` : `Ver ${p.name}`}
      onMouseEnter={() => {
        if (hoverImage) {
          timer.current = setTimeout(() => setHover(true), 180);
        }
      }}
      onMouseLeave={() => {
        if (timer.current) clearTimeout(timer.current);
        setHover(false);
      }}
    >
      <div className="zoom-frame relative aspect-[3/4] w-full bg-sand">
        <Image
          src={(hover && hoverImage) || p.main_image || p.images[0] || "/images/look-001.jpg"}
          alt={p.name}
          fill
          loading="lazy"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-cover transition-opacity duration-300 ${hover && hoverImage ? "opacity-100" : "opacity-100"}`}
        />
        {p.is_new && (
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-ink">
            Novo
          </span>
        )}
        {!p.is_new && p.tags.includes("exclusivo") && (
          <span className="absolute left-3 top-3 rounded-full bg-cream/95 px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-gold-deep">
            Exclusivo
          </span>
        )}
        <div className="absolute right-3 top-3">
          <FavoriteButton product={p} size="sm" />
        </div>
        <div className="absolute bottom-3 left-3">
          <StockBadge stock={total} low={lowStock} />
        </div>
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-cream/40">
            <span className="rounded-full bg-ink/85 px-5 py-2 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-cream backdrop-blur-sm">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="pt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-[15.5px] leading-snug text-ink transition-colors duration-200 group-hover:text-gold-deep">
            {p.name}
          </h3>
        </div>
        <p className="mt-1 flex items-baseline gap-2">
          {hasPromo ? (
            <>
              <span className="text-[15px] font-semibold text-wine">{brl(p.promo_price!)}</span>
              <span className="text-xs text-ink-faint line-through">{brl(p.price)}</span>
            </>
          ) : (
            <span className="text-[15px] font-semibold tracking-wide text-ink">{brl(p.price)}</span>
          )}
        </p>
      </div>
    </Link>
  );
}
